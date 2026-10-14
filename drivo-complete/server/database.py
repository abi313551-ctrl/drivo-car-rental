import os
from urllib.parse import quote_plus
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "drivo_db")

DATABASE_URL = os.getenv("DATABASE_URL")

def _build_engine():
    if DATABASE_URL:
        return create_engine(DATABASE_URL, pool_pre_ping=True)

    encoded_pw = quote_plus(DB_PASSWORD)
    auth = f"{DB_USER}:{encoded_pw}" if DB_PASSWORD else DB_USER
    server_url = f"mysql+pymysql://{auth}@{DB_HOST}:{DB_PORT}"
    db_url = f"{server_url}/{DB_NAME}?charset=utf8mb4"

    try:
        # Ensure database exists in MySQL if credentials are valid
        tmp_engine = create_engine(server_url, connect_args={"connect_timeout": 3})
        with tmp_engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            conn.commit()
        tmp_engine.dispose()
        engine = create_engine(db_url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[DB] Connected to MySQL database '{DB_NAME}' at {DB_HOST}:{DB_PORT}")
        return engine
    except Exception as exc:
        # If MySQL server is not running or requires a different password not yet set in .env,
        # fallback to SQLite so the API remains immediately runnable while keeping full MySQL support.
        fallback_url = os.getenv("FALLBACK_SQLITE_URL", "sqlite:///./drivo_fallback.db")
        print(f"[DB] MySQL connection failed ({exc}). Falling back to '{fallback_url}'. Configure server/.env for MySQL.")
        return create_engine(fallback_url, connect_args={"check_same_thread": False})

engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
