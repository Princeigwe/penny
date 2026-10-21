import logging

from .agents.state import state_run


class AI_Layer:
  async def invoke(self, human_msg: str, user_thread_id: str):
    state = await state_run(human_msg, user_thread_id)
    
    # check if there is an interrupt message in the state.
    # if there is, return it to the user for feedback 
    if "__interrupt__" in state['messages']:
      logging.info(f"LLM Workflow: HITL interrupt: {state['messages']['__interrupt__']}")
      # the interrupt contains the message to be sent to the user
      interrupt_message = state['messages']["__interrupt__"][0].value
      return interrupt_message
    else:
      # it's a final response.
      last_ai_message_content = state['messages'][-1].content
      return last_ai_message_content



ai = AI_Layer()