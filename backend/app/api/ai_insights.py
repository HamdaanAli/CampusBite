import logging
logger = logging.getLogger(__name__)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from google import genai
from groq import (
    RateLimitError,
    APITimeoutError,
    APIConnectionError,
    APIStatusError
)

from app.database import get_db
from app.models.user import User
from app.core.dependencies import require_roles
from app.schemas.ai_insights import (
    AIQuestionRequest,
    AIInsightsResponse
)
from app.services.ai_insights_service import (
    get_customer_order_history,
    prepare_order_data,
    generate_ai_answer
)

router = APIRouter(
    prefix="/ai-insights",
    tags=["AI Insights"]
)

@router.post(
    "/ask",
    response_model=AIInsightsResponse
)

def ask_ai_insights(
    request_data: AIQuestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("CUSTOMER"))
):
    try:
        orders = get_customer_order_history(
            db=db,
            customer_id=current_user.id
        )

        prepared_orders = prepare_order_data(orders)

        answer = generate_ai_answer(
            question=request_data.question,
            prepared_orders=prepared_orders
        )

        return AIInsightsResponse(
            success=True,
            answer=answer,
            orders_analyzed=len(prepared_orders)
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Groq API key is not configured"
        )

    except RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Groq API rate limit reached. Please try again later."
        )

    except APITimeoutError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Groq request timed out. Please try again later."
        )

    except APIConnectionError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not connect to Groq service"
        )

    except APIStatusError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Groq service returned an error"
        )

    except Exception:
        logger.exception("AI insights generation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate AI insights"
        )