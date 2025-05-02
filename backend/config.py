import os
from datetime import timedelta
from dotenv import load_dotenv
from app.utils import fix_postgres_url

load_dotenv()

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-please-change")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///development.db"
    )

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "TEST_DATABASE_URL", "sqlite:///test.db"
    )

class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = fix_postgres_url(os.environ.get("DATABASE_URL"))
    DEBUG = False
    TESTING = False

config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
