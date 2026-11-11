
from pydantic import BaseModel, Field


class AIQuestionRequest(BaseModel):
    question: str = Field(
        min_length=3,
        max_length=500
    )


class AIInsightsResponse(BaseModel):
    success: bool
    answer: str
    orders_analyzed: int
