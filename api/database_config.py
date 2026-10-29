import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Base class for all the models/tables defined for SQLAlchemy ORM
Base = declarative_base()  # this is what is imported in alembic/env.py

ENVIRONMENT=os.environ.get("ENVIRONMENT")


POSTGRES_USER = os.environ.get("DB_USERNAME")
POSTGRES_PASSWORD = os.environ.get("DB_PASSWORD")
POSTGRES_DB = os.environ.get("DB_NAME")
POSTGRES_HOST = os.environ.get("DB_HOST")
POSTGRES_PORT = os.environ.get("DB_PORT")

LOCAL_DB = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}/{POSTGRES_DB}"
)

REMOTE_DB= ( os.environ.get("REMOTE_DATABASE_URL") )

# DATABASE_URL = (
#     f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}/{POSTGRES_DB}"
# )

DATABASE_URL = REMOTE_DB if ENVIRONMENT == "production" else LOCAL_DB

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,  # keeping data loaded in memory after commit
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
