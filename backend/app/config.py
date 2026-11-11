from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "CampusBite API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database settings
    POSTGRES_HOST: str
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str

    # JWT settings
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30


        # OpenAI settings
    OPENAI_API_KEY: str | None = None

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8"
    )


settings = Settings()