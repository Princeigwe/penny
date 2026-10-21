from ..enums.user_intent import User_Intent
from pydantic import BaseModel, Field


class Coordinator_Classifier_Output(BaseModel):
  intent: User_Intent = Field(..., description="The user's primary intent")