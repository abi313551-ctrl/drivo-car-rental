import os
from pathlib import Path
from urllib.parse import quote_plus
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "drivo_db")

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
USE_SQLITE_FALLBACK = os.getenv("USE_SQLITE_FALLBACK", "true").lower() in ("1", "true", "yes")


def _build_engine():
    # 1. Explicit DATABASE_URL override (supports mysql+pymysql://... or sqlite:///...)
    if DATABASE_URL:
        is_sqlite = DATABASE_URL.startswith("sqlite")
        connect_args = {"check_same_thread": False} if is_sqlite else {}
        eng = create_engine(DATABASE_URL, pool_pre_ping=not is_sqlite, connect_args=connect_args)
        print(f"[DB] Connected using explicit DATABASE_URL ({'SQLite' if is_sqlite else 'MySQL'})")
        return eng, ("sqlite" if is_sqlite else "mysql")

    # 2. Build MySQL connection URL from environment variables
    encoded_pw = quote_plus(DB_PASSWORD)
    auth = f"{DB_USER}:{encoded_pw}" if DB_PASSWORD else DB_USER
    server_url = f"mysql+pymysql://{auth}@{DB_HOST}:{DB_PORT}"
    db_url = f"{server_url}/{DB_NAME}?charset=utf8mb4"

    try:
        tmp_engine = create_engine(server_url, connect_args={"connect_timeout": 3})
        with tmp_engine.connect() as conn:
            conn.execute(
                text(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            )
            conn.commit()
        tmp_engine.dispose()

        eng = create_engine(db_url, pool_pre_ping=True)
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[DB] Connected to MySQL database '{DB_NAME}' at {DB_HOST}:{DB_PORT}")
        return eng, "mysql"
    except Exception as exc:
        if not USE_SQLITE_FALLBACK:
            raise RuntimeError(
                f"MySQL connection failed ({exc}) and USE_SQLITE_FALLBACK is disabled. "
                "Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME in server/.env."
            ) from exc

        sqlite_path = BASE_DIR / "drivo_fallback.db"
        fallback_url = os.getenv("FALLBACK_SQLITE_URL", f"sqlite:///{sqlite_path.as_posix()}")
        print(
            f"[DB] MySQL unavailable or unconfigured ({exc.__class__.__name__}). "
            f"Using SQLite fallback at '{sqlite_path.name}'. Set MySQL credentials in server/.env to use MySQL."
        )
        return create_engine(fallback_url, connect_args={"check_same_thread": False}), "sqlite"


engine, ACTIVE_DB_BACKEND = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
