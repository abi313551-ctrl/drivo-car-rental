import os
import re
from pathlib import Path
from urllib.parse import quote_plus
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

BASE_DIR = Path(__file__).resolve().parent

# Load local .env files if present (server/.env or project root .env)
if (BASE_DIR / ".env").exists():
    load_dotenv(BASE_DIR / ".env")
elif (BASE_DIR.parent / ".env").exists():
    load_dotenv(BASE_DIR.parent / ".env")


def _clean_val(val: str) -> str:
    """Strip whitespace and surrounding single or double quotes."""
    if not val:
        return ""
    s = str(val).strip()
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1].strip()
    return s


def _get_env(*keys, default=""):
    """Return the first non-empty environment variable matching keys."""
    for k in keys:
        raw = os.getenv(k)
        if raw is not None:
            cleaned = _clean_val(raw)
            if cleaned:
                return cleaned
    return default


def _mask_url(url: str) -> str:
    """Mask credentials in connection URL for safe logging without exposing secrets."""
    return re.sub(r":([^/@:]+)@", ":***@", url)


def _normalize_db_url(url: str) -> str:
    """
    Ensure MySQL URLs use the PyMySQL driver (required when mysqlclient is not installed).
    Also ensures utf8mb4 encoding is configured.
    """
    url = url.strip()
    if url.startswith("mysql://"):
        url = "mysql+pymysql://" + url[len("mysql://"):]
    elif url.startswith("mysql2://"):
        url = "mysql+pymysql://" + url[len("mysql2://"):]

    if url.startswith("mysql+pymysql://") and "charset=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}charset=utf8mb4"
    return url


# Resolve environment settings with aliases for Railway & Render
DATABASE_URL = _get_env("DATABASE_URL", "MYSQL_URL", "MYSQL_PUBLIC_URL", "MYSQL_PRIVATE_URL", default="")
DB_HOST = _get_env("DB_HOST", "MYSQLHOST", "MYSQL_HOST", default="localhost")
DB_PORT = _get_env("DB_PORT", "MYSQLPORT", "MYSQL_PORT", default="3306")
DB_USER = _get_env("DB_USER", "MYSQLUSER", "MYSQL_USER", default="root")
DB_PASSWORD = _get_env("DB_PASSWORD", "MYSQLPASSWORD", "MYSQL_PASSWORD", "DATABASE_PASSWORD", "DB_PASS", default="")
DB_NAME = _get_env("DB_NAME", "MYSQLDATABASE", "MYSQL_DATABASE", default="drivo_db")

_is_render = _get_env("RENDER", default="").lower() in ("1", "true", "yes")
_is_prod = _get_env("ENVIRONMENT", default="").lower() in ("production", "prod")
# In Render or production environments, default SQLite fallback to False to guarantee Railway MySQL is strictly used
_default_fallback = "false" if (_is_render or _is_prod) else "true"
USE_SQLITE_FALLBACK = _get_env("USE_SQLITE_FALLBACK", default=_default_fallback).lower() in ("1", "true", "yes")


def _build_engine():
    # --- Priority 1: Full Database Connection URL (e.g. DATABASE_URL / MYSQL_URL) ---
    if DATABASE_URL:
        normalized_url = _normalize_db_url(DATABASE_URL)
        is_sqlite = normalized_url.startswith("sqlite")
        connect_args = {"check_same_thread": False} if is_sqlite else {"connect_timeout": 10}

        try:
            eng = create_engine(
                normalized_url,
                pool_pre_ping=not is_sqlite,
                pool_recycle=300 if not is_sqlite else -1,
                connect_args=connect_args,
            )
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            print(f"[DB] Connected using connection URL ({'SQLite' if is_sqlite else 'MySQL'}): {_mask_url(normalized_url)}")
            return eng, ("sqlite" if is_sqlite else "mysql")
        except Exception as exc:
            if not USE_SQLITE_FALLBACK:
                raise RuntimeError(
                    f"Database connection failed with provided connection URL ({exc.__class__.__name__}). "
                    f"Target: {_mask_url(normalized_url)}. Verify credentials and host reachability."
                ) from exc
            print(f"[DB] Connection failed for URL: {_mask_url(normalized_url)}: {exc}")

    # --- Priority 2: Discrete MySQL Environment Variables (Supports Railway & Standard names) ---
    is_remote_host = DB_HOST not in ("localhost", "127.0.0.1")
    if is_remote_host and not DB_PASSWORD:
        msg = (
            f"Remote database host is configured as '{DB_HOST}', but database password is empty. "
            "Please configure 'DB_PASSWORD' or 'MYSQLPASSWORD' in your Render environment variables."
        )
        if not USE_SQLITE_FALLBACK:
            raise RuntimeError(msg)
        print(f"[DB] Warning: {msg}")

    encoded_pw = quote_plus(DB_PASSWORD)
    auth = f"{DB_USER}:{encoded_pw}" if DB_PASSWORD else DB_USER
    db_url = f"mysql+pymysql://{auth}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

    try:
        # Step 1: Direct connection to target database (Standard for Railway MySQL)
        eng = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args={"connect_timeout": 10},
        )
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[DB] Connected to MySQL database '{DB_NAME}' at {DB_HOST}:{DB_PORT} (user: {DB_USER})")
        return eng, "mysql"
    except Exception as direct_exc:
        # Step 2: If database doesn't exist on local instance, attempt to create it
        is_unknown_db = "1049" in str(direct_exc) or "Unknown database" in str(direct_exc)
        if is_unknown_db and not is_remote_host:
            server_url = f"mysql+pymysql://{auth}@{DB_HOST}:{DB_PORT}"
            try:
                tmp_engine = create_engine(server_url, connect_args={"connect_timeout": 5})
                with tmp_engine.connect() as conn:
                    conn.execute(
                        text(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
                    )
                    conn.commit()
                tmp_engine.dispose()

                eng = create_engine(db_url, pool_pre_ping=True, pool_recycle=300)
                with eng.connect() as conn:
                    conn.execute(text("SELECT 1"))
                print(f"[DB] Created and connected to MySQL database '{DB_NAME}' at {DB_HOST}:{DB_PORT}")
                return eng, "mysql"
            except Exception:
                pass

        if not USE_SQLITE_FALLBACK:
            raise RuntimeError(
                f"MySQL connection to {DB_HOST}:{DB_PORT}/{DB_NAME} failed ({direct_exc}). "
                "Ensure DB_HOST/MYSQLHOST, DB_USER/MYSQLUSER, DB_PASSWORD/MYSQLPASSWORD, "
                "and DB_NAME/MYSQLDATABASE are set correctly in Render environment variables."
            ) from direct_exc

        sqlite_path = BASE_DIR / "drivo_fallback.db"
        fallback_url = _get_env("FALLBACK_SQLITE_URL", default=f"sqlite:///{sqlite_path.as_posix()}")
        print(
            f"[DB] MySQL unavailable ({direct_exc.__class__.__name__}). "
            f"Using SQLite fallback at '{sqlite_path.name}'."
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
