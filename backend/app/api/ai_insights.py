
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

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
    generate_mock_summary
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

        answer = generate_mock_summary(prepared_orders)

        return AIInsightsResponse(
            success=True,
            answer=answer,
            orders_analyzed=len(prepared_orders)
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate AI insights"
        )
