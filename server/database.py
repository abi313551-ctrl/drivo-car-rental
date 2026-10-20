import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL, make_url
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


def _safe_int_port(port_val, default=3306):
    """Safely convert a port value to an integer."""
    if not port_val:
        return default
    try:
        return int(str(port_val).strip())
    except (ValueError, TypeError):
        return default


def _normalize_db_url(url_str: str) -> str:
    """
    Ensure MySQL URLs use the PyMySQL driver (required when mysqlclient is not installed).
    Also ensures utf8mb4 encoding is configured.
    """
    url_str = url_str.strip()
    if url_str.startswith("mysql://"):
        url_str = "mysql+pymysql://" + url_str[len("mysql://"):]
    elif url_str.startswith("mysql2://"):
        url_str = "mysql+pymysql://" + url_str[len("mysql2://"):]

    if url_str.startswith("mysql+pymysql://") and "charset=" not in url_str:
        sep = "&" if "?" in url_str else "?"
        url_str = f"{url_str}{sep}charset=utf8mb4"
    return url_str


# Resolve environment settings with aliases for Railway & Render
RAW_DATABASE_URL = _get_env("DATABASE_URL", "MYSQL_URL", "MYSQL_PUBLIC_URL", "MYSQL_PRIVATE_URL", default="")
DB_HOST = _get_env("DB_HOST", "MYSQLHOST", "MYSQL_HOST", default="localhost")
DB_PORT = _get_env("DB_PORT", "MYSQLPORT", "MYSQL_PORT", default="3306")
DB_USER = _get_env("DB_USER", "MYSQLUSER", "MYSQL_USER", default="root")
DB_PASSWORD = _get_env("DB_PASSWORD", "MYSQLPASSWORD", "MYSQL_PASSWORD", "DATABASE_PASSWORD", "DB_PASS", default="")
DB_NAME = _get_env("DB_NAME", "MYSQLDATABASE", "MYSQL_DATABASE", default="drivo_db")
DATABASE_URL = RAW_DATABASE_URL

_is_render = _get_env("RENDER", default="").lower() in ("1", "true", "yes")
_is_prod = _get_env("ENVIRONMENT", default="").lower() in ("production", "prod")
# In Render or production environments, default SQLite fallback to False to guarantee Railway MySQL is strictly used
_default_fallback = "false" if (_is_render or _is_prod) else "true"
USE_SQLITE_FALLBACK = _get_env("USE_SQLITE_FALLBACK", default=_default_fallback).lower() in ("1", "true", "yes")


def _build_engine():
    target_url = None
    is_sqlite = False

    # 1. Check if a full connection URL was provided (must contain '://')
    has_full_url = bool(RAW_DATABASE_URL and ("://" in RAW_DATABASE_URL))

    if has_full_url:
        normalized_url = _normalize_db_url(RAW_DATABASE_URL)
        is_sqlite = normalized_url.startswith("sqlite")
        try:
            target_url = make_url(normalized_url)
        except Exception as parse_err:
            print(f"[DB Warning] Could not parse DATABASE_URL as a URL object ({parse_err}). Falling back to discrete variables.")
            target_url = None

    # 2. If no full URL object, build using discrete environment variables via URL.create()
    if target_url is None:
        host_candidate = DB_HOST
        # If RAW_DATABASE_URL was provided as just a host string (e.g. 'sakura.proxy.rlwy.net:58552' without '://')
        if RAW_DATABASE_URL and not has_full_url and host_candidate in ("localhost", "127.0.0.1", ""):
            host_candidate = RAW_DATABASE_URL
            print(f"[DB Notice] DATABASE_URL '{RAW_DATABASE_URL}' does not contain '://'. Recognized as database host.")

        clean_host = host_candidate.strip()
        clean_port = _safe_int_port(DB_PORT, default=3306)

        # Handle host strings containing port (e.g. 'sakura.proxy.rlwy.net:58552')
        if ":" in clean_host and not clean_host.startswith("["):
            parts = clean_host.split(":", 1)
            clean_host = parts[0].strip()
            parsed_port = _safe_int_port(parts[1].strip(), default=None)
            if parsed_port:
                clean_port = parsed_port

        # Safe diagnostics (NO secrets/passwords are ever printed)
        print(
            f"[DB Config] Target: {clean_host}:{clean_port}/{DB_NAME} | "
            f"User: {DB_USER} | Password: {'[SET]' if DB_PASSWORD else '[MISSING]'} | "
            f"Fallback: {'ENABLED' if USE_SQLITE_FALLBACK else 'DISABLED (Strict MySQL)'}"
        )

        is_remote_host = clean_host not in ("localhost", "127.0.0.1")
        if is_remote_host and not DB_PASSWORD:
            msg = (
                f"Remote MySQL host is configured as '{clean_host}:{clean_port}', but database password is empty. "
                "Please configure 'DB_PASSWORD' or 'MYSQLPASSWORD' in your Render environment variables."
            )
            if not USE_SQLITE_FALLBACK:
                raise RuntimeError(msg)
            print(f"[DB Warning] {msg}")

        # Build URL using SQLAlchemy URL.create() for safe parameter and credential handling
        target_url = URL.create(
            drivername="mysql+pymysql",
            username=DB_USER,
            password=DB_PASSWORD if DB_PASSWORD else None,
            host=clean_host,
            port=clean_port,
            database=DB_NAME,
            query={"charset": "utf8mb4"},
        )

    # Establish connection engine with connection pool recycling
    connect_args = {"check_same_thread": False} if is_sqlite else {"connect_timeout": 10}
    masked_url = target_url.render_as_string(hide_password=True)

    try:
        eng = create_engine(
            target_url,
            pool_pre_ping=not is_sqlite,
            pool_recycle=300 if not is_sqlite else -1,
            connect_args=connect_args,
        )
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[DB] Connected successfully ({'SQLite' if is_sqlite else 'MySQL'}): {masked_url}")
        return eng, ("sqlite" if is_sqlite else "mysql")
    except Exception as direct_exc:
        # If database doesn't exist on local instance, attempt to create it
        is_unknown_db = "1049" in str(direct_exc) or "Unknown database" in str(direct_exc)
        is_local = (getattr(target_url, "host", "") or "") in ("localhost", "127.0.0.1")

        if is_unknown_db and is_local and not is_sqlite:
            try:
                root_url = URL.create(
                    drivername="mysql+pymysql",
                    username=target_url.username,
                    password=target_url.password,
                    host=target_url.host,
                    port=target_url.port,
                )
                tmp_engine = create_engine(root_url, connect_args={"connect_timeout": 5})
                with tmp_engine.connect() as conn:
                    conn.execute(
                        text(f"CREATE DATABASE IF NOT EXISTS `{target_url.database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
                    )
                    conn.commit()
                tmp_engine.dispose()

                eng = create_engine(target_url, pool_pre_ping=True, pool_recycle=300)
                with eng.connect() as conn:
                    conn.execute(text("SELECT 1"))
                print(f"[DB] Created and connected to MySQL database '{target_url.database}' at {target_url.host}")
                return eng, "mysql"
            except Exception:
                pass

        if not USE_SQLITE_FALLBACK:
            raise RuntimeError(
                f"MySQL connection failed ({direct_exc}). "
                f"Target: {masked_url}. "
                "Verify your Railway MySQL credentials in Render environment variables."
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
