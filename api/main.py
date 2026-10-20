import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# Import routers
from modules.users.user_router import router as users_router


logging.basicConfig(
  level=logging.INFO,
  format="{asctime} - {levelname} - {message}",
  style='{',
  datefmt="%Y-%m-%d %H:%M:%S"
)

app = FastAPI(
  title="Penny",
  description="Penny API",
  version="1.0.0",
  contact={
    "name": "Prince Igwe",
    "url": "https://linkedin.com/in/prince-igwenagha",
  },
)

origins = [
  "http://localhost:3000",
  "http://localhost:3001",
]

app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


app.include_router(users_router)


@app.get("/")
def read_root():
  return {"Hello": "World"}
