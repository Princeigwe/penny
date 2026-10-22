from agentic_workflows.ai_layer import ai
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from database_config import get_db

from .enums.gender import Gender
from .models.user_model import User


async def create_user(
    first_name: str,
    last_name: str,
    email: str,
    password: str,
    gender: Gender,
    db: Session = Depends(get_db),
):
    try:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists"
            )

        new_user = User(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            gender=gender,
        )
        db.add(new_user)
        db.commit()
        return new_user
    except HTTPException as e:
        print(e)


async def talk_to_agent(human_msg: str, user_thread_id: str):
    ai_response = await ai.invoke(human_msg, user_thread_id)
    return {"user_id": user_thread_id, "message": human_msg, "penny": ai_response}
