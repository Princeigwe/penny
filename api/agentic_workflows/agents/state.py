import json
import logging
import os
import warnings
from typing import Annotated, Literal, TypedDict

from dotenv import load_dotenv

from langchain_core.messages import AIMessage, AnyMessage
from langchain_core.messages.tool import ToolCall
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.graph import END, START, StateGraph, add_messages
from langgraph.prebuilt import ToolNode
from langgraph.types import Command, interrupt
from psycopg_pool import AsyncConnectionPool

from ..enums.user_intent import User_Intent
from ..llm import llm
from ..memory.context_window import trimmed_messages
from ..outputs.coordinator_output import Coordinator_Classifier_Output
from ..outputs.product_search_request_parser import Product_Search_Request_Parser
from ..templates.user_intent_classifier import (
    template as user_intent_classifier_template,
)
from ..templates.system_intro_template import template as system_intro_template
from ..templates.product_search_request_template import template as product_search_request_template
from ..tools.channel3_tools import product_search


POSTGRES_USER = os.environ.get("DB_USERNAME")
POSTGRES_PASSWORD = os.environ.get("DB_PASSWORD")
POSTGRES_DB = os.environ.get("DB_NAME")
POSTGRES_HOST = os.environ.get("DB_HOST")
POSTGRES_PORT = os.environ.get("DB_PORT")

DATABASE_URL = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}/{POSTGRES_DB}"
)


connection_kwargs = {
    "autocommit": True,
    "prepare_threshold": 0,
}


class State(TypedDict):
    user_id: str
    messages: Annotated[list[AnyMessage], add_messages]
    query: str
    intent: str
    product_description: str | None = None
    min_price: int | None = None
    max_price: int | None = None
    gender: str | None = None


class ConfigSchema(TypedDict):
    msg: str


state_workflow = StateGraph(State, config_schema=ConfigSchema)


def coordinator_agent(state: State, config=ConfigSchema):
    """
    The coordinator agent is the main orchestrator of the state workflow.

    It is responsible for: assigning messages to agents based on the user's intent

    Args:
      state (State): The current state of the workflow.
      config (ConfigSchema): The configuration of the workflow.
    """
    msg = config["configurable"].get("msg")
    if not msg:
        return
    parser = JsonOutputParser(pydantic_object=Coordinator_Classifier_Output)
    prompt = PromptTemplate(
        template=user_intent_classifier_template,
        partial_variables={"format_instructions": parser.get_format_instructions},
    )
    formatted_prompt = prompt.format(query=msg)
    llm_response = llm.invoke(formatted_prompt)
    json_parsed_response = parser.parse(llm_response.content)

    return {"query": msg, "intent": json_parsed_response["intent"]}


def system_enquiry_agent(state: State):
    """
    This agent is responsible for answering questions based on system functionalities
    """
    prompt = PromptTemplate.from_template(system_intro_template)
    formatted = prompt.format(
        query=state["query"], state_messages=state.get("messages", [])
    )
    llm_response = llm.invoke(formatted)
    return {"messages": [llm_response]}


def search_product_request_agent(state: State):
    """
    this agent is responsible for searching products on the web based on user queries, along with filters.
    """
    last_human_message = state["messages"][-1].content
    user_id = state["user_id"]
    parser = JsonOutputParser(pydantic_object=Product_Search_Request_Parser)
    prompt = PromptTemplate(
      template=product_search_request_template,
      partial_variables={"format_instructions": parser.get_format_instructions},
    )
    formatted_prompt = prompt.format(query=last_human_message)
    llm_response = llm.invoke(formatted_prompt)
    json_parsed_response = parser.parse(llm_response.content)
    print(f"computed json_parsed_response: {json_parsed_response}")
    return {
      "product_description": json_parsed_response["product_description"],
      "min_price": json_parsed_response["min_price"],
      "max_price": json_parsed_response["max_price"],
      "gender": json_parsed_response["gender"],
    }


def search_product_response_agent(state: State):
  """
  this agent is responsible for giving a response based on the query initiated by the search_product_request_agent
  """
  pass


def search_product_with_image_agent(state: State):
    """
    this agent is responsible for searching products on the web based on user image url.
    """
    pass


def product_url_lookup_agent(state: State):
    """
    this agent is responsible for looking up products on the web based on the product url from a brand or website.
    """
    pass


def e_commerce_web_product_search_agent(state: State):
    """
    this agent is responsible for searching products on specific e-commerce websites.

    example: can i find a red shoe on amazon?
    """
    pass


def payment_confirmation_trigger_agent(state: State):
    """
    this agent is responsible for triggering payment confirmation to the frontend, to enable the user pay for their desired product.
    """
    pass


state_workflow.add_node("coordinator_agent", coordinator_agent)
state_workflow.add_node("system_enquiry_agent", system_enquiry_agent)
state_workflow.add_node("search_product_request_agent", search_product_request_agent)
state_workflow.add_node("search_product_response_agent", search_product_response_agent)
state_workflow.add_node(
  "search_product_with_image_agent", search_product_with_image_agent
)
state_workflow.add_node("product_url_lookup_agent", product_url_lookup_agent)
state_workflow.add_node(
  "e_commerce_web_product_search_agent", e_commerce_web_product_search_agent
)
state_workflow.add_node(
  "payment_confirmation_trigger_agent", payment_confirmation_trigger_agent
)


def coordinator_agent_condition(state: State):
    coordinating_intent = state["intent"]
    if coordinating_intent == User_Intent.SYSTEM_ENQUIRY:
        return "system_enquiry_agent"
    elif coordinating_intent == User_Intent.PRODUCT_SEARCH:
        return "search_product_request_agent"
    elif coordinating_intent == User_Intent.PRODUCT_IMAGE_SEARCH:
        return "search_product_with_image_agent"
    elif coordinating_intent == User_Intent.PRODUCT_URL_LOOKUP:
        return "product_url_lookup_agent"
    elif coordinating_intent == User_Intent.E_COMMERCE_PRODUCT_SEARCH:
        return "e_commerce_web_product_search_agent"
    else:
        return "payment_confirmation_trigger_agent"


state_workflow.add_edge(START, "coordinator_agent")
state_workflow.add_conditional_edges("coordinator_agent", coordinator_agent_condition)
state_workflow.add_edge("system_enquiry_agent", END)
state_workflow.add_edge("search_product_request_agent", "search_product_response_agent")
state_workflow.add_edge("search_product_response_agent", END)
state_workflow.add_edge("search_product_with_image_agent", END)
state_workflow.add_edge("product_url_lookup_agent", END)
state_workflow.add_edge("e_commerce_web_product_search_agent", END)
state_workflow.add_edge("payment_confirmation_trigger_agent", END)


async def state_run(human_msg: str, user_thread_id: str):
  try:
    # ignoring runtime warnings
    warnings.filterwarnings("ignore")
    connection_pool = AsyncConnectionPool(
      conninfo=DATABASE_URL,
      max_size=30,
      kwargs=connection_kwargs,
      open=False,  # open explicitly below (avoids the deprecation warning)
    )
    await connection_pool.open()
    checkpointer = AsyncPostgresSaver(connection_pool)
    await checkpointer.setup()

    graph = state_workflow.compile(checkpointer=checkpointer)
    user_configuration = {
      "configurable": {"thread_id": user_thread_id, "msg": human_msg},
    }

    # getting the current state of the graph and checking if it has been interrupted
    current_state = await graph.aget_state(user_configuration)

    logging.info(
      f"Agentic Workflow: State Graph: current interrupt graph state {current_state}"
    )

    # if the graph has been interrupted, it means we are waiting for human feedback.. resume with human feedback
    if current_state and current_state.next:
      # if so, resume with the user's feedback
      state_messages = await graph.ainvoke(
        Command(resume=human_msg), user_configuration
      )
    else:
      logging.info(
        "Agentic Workflow: State Graph: current un-interrupt graph state"
      )

      # otherwise, start a new turn
      state_messages = await graph.ainvoke(
        {"messages": [human_msg], "user_id": user_thread_id}, user_configuration
      )

    return state_messages
  finally:
    await connection_pool.close()
