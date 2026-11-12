import logging
import time
from app.api.auth import router as auth_router
from fastapi import FastAPI, Depends, Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.dependencies import get_current_user
from app.models.user import User
from app.config import settings
from app.database import get_db
from app.api.restaurant import router as restaurant_router
from app.api.menu_item import router as menu_item_router
from app.api.order import router as order_router
from app.api.review import router as review_router
from app.api.return_request import router as return_request_router
from app.api.statistics import router as statistics_router
from app.api.ai_insights import router as ai_insights_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("campusbite")


app = FastAPI(
    title=settings.APP_NAME,
    description="Restaurant Ordering and Delivery Platform",
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)
#authenticate router register
app.include_router(
    auth_router,
    prefix="/api/v1"
)

#restaurant router register
app.include_router(
    restaurant_router,
    prefix="/api/v1"
)

#menu item router register
app.include_router(
    menu_item_router,
    prefix="/api/v1"
)

#order router register
app.include_router(order_router, prefix="/api/v1")

#review router register
app.include_router(review_router, prefix="/api/v1")

#return request router register
app.include_router(return_request_router, prefix="/api/v1")

#statistics router register
app.include_router(statistics_router, prefix="/api/v1")

# AI insights router register
app.include_router(ai_insights_router, prefix="/api/v1")

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.perf_counter()

    response = await call_next(request)

    process_time = (time.perf_counter() - start_time) * 1000

    logger.info(
        "%s %s completed in %.2f ms",
        request.method,
        request.url.path,
        process_time
    )

    response.headers["X-Process-Time"] = str(process_time)

    return response


# Handle HTTP exceptions
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException
):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail)
            }
        }
    )


# Handle request validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):
    errors = [
        {
            "location": error["loc"],
            "message": error["msg"],
            "type": error["type"]
        }
        for error in exc.errors()
    ]

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": errors
            }
        }
    )


# Handle unexpected server errors
@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request,
    exc: Exception
):
    logger.exception(
        "Unexpected error on %s %s",
        request.method,
        request.url.path
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred"
            }
        }
    )


@app.get("/")
def home():
    return {
        "message": "Welcome to CampusBite API",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/health/database")
def database_health_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected"
    }

#Current user
@app.get("/api/v1/auth/me")
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role
    }
