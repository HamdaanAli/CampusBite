
import json

from groq import Groq

from app.config import settings
from app.services.order_service import get_customer_orders


def get_customer_order_history(
    db,
    customer_id: int
):
    return get_customer_orders(
        db=db,
        customer_id=customer_id
    )


def prepare_order_data(orders):
    prepared_orders = []

    for order in orders:
        prepared_orders.append({
            "restaurant": order.restaurant.name,
            "order_date": order.created_at.isoformat(),
            "items": [
                {
                    "name": item.item_name,
                    "quantity": item.quantity,
                    "unit_price": float(item.unit_price),
                    "subtotal": float(item.subtotal)
                }
                for item in order.order_items
            ],
            "total_amount": float(order.total_amount),
            "status": order.status,
            "payment_status": order.payment_status
        })

    return prepared_orders


def generate_ai_answer(question, prepared_orders):
    if not settings.GROQ_API_KEY:
        raise ValueError("Groq API key is not configured")

    client = Groq(
        api_key=settings.GROQ_API_KEY,
        max_retries=0,
        timeout=30.0
    )

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": (
                       "You are CampusBite's order insights assistant. "
                        "Answer customer questions using only the supplied "
                        "order history. Do not invent orders, amounts, dates, "
                        "or statuses. If information is unavailable, say so "
                        "clearly. Keep answers concise and easy to understand. "
                        "All monetary amounts are in Indian Rupees (INR). "
                        "Always use the ₹ symbol for money. Never use the $ symbol "
                        "or convert amounts into another currency."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Customer question: {question}\n\n"
                        "Customer order history:\n"
                        f"{json.dumps(prepared_orders, ensure_ascii=False)}"
                    )
                }
            ],
            temperature=0.3,
            max_completion_tokens=800
        )

        answer = (
            response.choices[0].message.content or ""
        ).strip()

        if not answer:
            raise RuntimeError("Groq returned an empty response")

        return answer

    finally:
        client.close()
