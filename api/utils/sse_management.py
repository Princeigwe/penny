import asyncio
import json
import logging
from fastapi import Request
from fastapi.responses import StreamingResponse

subscribers: set[asyncio.Queue] = set()

async def stream_sse(request: Request):
  queue: asyncio.Queue = asyncio.Queue()
  subscribers.add(queue)

  async def generator():
    try:
      while True:
        if await request.is_disconnected():
          break
        try:
          msg = await asyncio.wait_for(queue.get(), timeout=30)
          yield f"data: {json.dumps(msg)}\n\n "
        except asyncio.TimeoutError:
          yield ": ping\n\n"
    finally:
      subscribers.discard(queue)
  return StreamingResponse(generator(), media_type="text/event-stream")



async def publish_sse(message: dict):
  for q in subscribers:
    await q.put(message)
  logging.info(f"published  message to {len(subscribers)}")

