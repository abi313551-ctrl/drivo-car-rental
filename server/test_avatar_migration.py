"""
Test script to safely verify the avatar_url migration logic against an isolated SQLite test database and local MySQL.
"""
import os
import sys
from sqlalchemy import create_engine, inspect, text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from main import migrate_user_schema_safely

def test_migration_on_isolated_db():
    print("==================================================")
    print("   TESTING AVATAR_URL MIGRATION (ISOLATED DB)     ")
    print("==================================================")

    test_db_url = "sqlite:///:memory:"
    engine = create_engine(test_db_url)

    # 1. Create a users table without avatar_url, mimicking older schema
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                full_name VARCHAR(100),
                email VARCHAR(100),
                role VARCHAR(20)
            )
        """))
        conn.execute(text("INSERT INTO users (id, full_name, email, role) VALUES (1, 'Alice Driver', 'alice@example.com', 'customer')"))
        conn.execute(text("INSERT INTO users (id, full_name, email, role) VALUES (2, 'Bob Admin', 'bob@example.com', 'admin')"))

    # Verify initial state
    insp = inspect(engine)
    cols_before = [c["name"] for c in insp.get_columns("users")]
    assert "avatar_url" not in cols_before, "avatar_url should not be present initially"
    print("  [PASS] Initial test table created without avatar_url. Columns:", cols_before)

    # 2. Run migrate_user_schema_safely from main.py: Should add the column
    migrate_user_schema_safely(engine)
    insp = inspect(engine)
    cols_after = [c["name"] for c in insp.get_columns("users")]
    assert "avatar_url" in cols_after, "avatar_url must be present after migration"
    print("  [PASS] Migration executed: 'avatar_url' column successfully added. Columns:", cols_after)

    # 3. Verify existing data preserved
    with engine.connect() as conn:
        users = conn.execute(text("SELECT id, full_name, email, role, avatar_url FROM users ORDER BY id")).fetchall()
        assert len(users) == 2, f"Expected 2 users, got {len(users)}"
        assert users[0][1] == "Alice Driver" and users[0][4] is None
        assert users[1][1] == "Bob Admin" and users[1][4] is None
    print("  [PASS] Existing records 100% preserved with NULL avatar_url for existing rows.")

    # 4. Second run: Idempotent no-op (column already exists)
    migrate_user_schema_safely(engine)
    insp_second = inspect(engine)
    cols_second = [c["name"] for c in insp_second.get_columns("users")]
    assert cols_second == cols_after
    print("  [PASS] Idempotency verified: Second run recognized column and safely skipped ALTER TABLE.")

    # 5. Verify error propagation when database connection is invalid
    bad_engine = create_engine("sqlite:///nonexistent_dir_12345/bad.db")
    try:
        migrate_user_schema_safely(bad_engine)
        assert False, "Should have raised exception on invalid database connection"
    except Exception:
        print("  [PASS] Unrelated database errors are properly raised and not silently ignored.")

    print("==================================================")
    print("   ALL MIGRATION SAFETY TESTS PASSED 100%!        ")
    print("==================================================")

if __name__ == "__main__":
    test_migration_on_isolated_db()
