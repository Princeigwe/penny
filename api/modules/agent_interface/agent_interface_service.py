from agentic_workflows.ai_layer import ai


async def chat_with_agent(human_msg: str, user_thread_id: str):
  ai_response = await ai.invoke(human_msg, user_thread_id)
  return {"user_id": user_thread_id, "message": human_msg, "penny": ai_response}
