from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "")
GOOGLE_CLOUD_SQL_CONNECTION_NAME = os.getenv("GOOGLE_CLOUD_SQL_CONNECTION_NAME")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "business_intelligence")

connect_args = {}
engine_kwargs = {}

# Determine which DB to use
if GOOGLE_CLOUD_SQL_CONNECTION_NAME and DB_PASSWORD:
    DATABASE_URL = f"postgresql+pg8000://{DB_USER}:{DB_PASSWORD}@/{DB_NAME}"
    connect_args = {"unix_sock": f"/cloudsql/{GOOGLE_CLOUD_SQL_CONNECTION_NAME}/.s.PGSQL.5432"}
    logger.info(f"Using Google Cloud SQL: {GOOGLE_CLOUD_SQL_CONNECTION_NAME}")

elif DATABASE_URL:
    # Strip sslmode/channel_binding query params as pg8000 uses ssl_context differently
    base_url = DATABASE_URL.split("?")[0]
    
    # Normalize scheme to pg8000
    if base_url.startswith("postgres://"):
        base_url = base_url.replace("postgres://", "postgresql+pg8000://", 1)
    elif base_url.startswith("postgresql://"):
        base_url = base_url.replace("postgresql://", "postgresql+pg8000://", 1)
    elif base_url.startswith("postgresql+psycopg2://"):
        base_url = base_url.replace("postgresql+psycopg2://", "postgresql+pg8000://", 1)

    DATABASE_URL = base_url

    # pg8000 uses ssl_context for SSL
    if "neon.tech" in DATABASE_URL:
        import ssl
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        connect_args = {"ssl_context": ssl_ctx}
        logger.info("Using Neon Database (pg8000 + SSL)")
    else:
        logger.info("Using PostgreSQL database (pg8000)")

else:
    DATABASE_URL = "sqlite:///./sql_app.db"
    connect_args = {"check_same_thread": False}
    logger.warning("FORCED SQLITE FOR STABILITY TEST")

# Engine settings
if "sqlite" in DATABASE_URL:
    engine_kwargs = {
        "connect_args": connect_args,
        "echo": False,
    }
else:
    engine_kwargs = {
        "connect_args": connect_args,
        "pool_pre_ping": True,
        "pool_recycle": 120,
        "pool_size": 20,
        "max_overflow": 40,
        "pool_use_lifo": True,
        "echo": False,
    }

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection():
    """Check if database connection is working"""
    try:
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("Database connection check: SUCCESS")
        return True
    except Exception as e:
        logger.error(f"Database connection check: FAILED - {e}")
        return False


def init_database():
    """Initialize database tables"""
    try:
        logger.info("Initializing database tables...")
        from models import Base as ModelBase
        ModelBase.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {e}")
        return False
