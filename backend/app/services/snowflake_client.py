"""Thin wrapper around snowflake-connector-python.

Uses a Programmatic Access Token (PAT) generated in Snowsight — see
.env.example. Do not hardcode credentials here.
"""

import snowflake.connector

from app.config import settings


def get_connection():
    return snowflake.connector.connect(
        account=settings.snowflake_account,
        user=settings.snowflake_user,
        password=settings.snowflake_pat,  # PAT used as password for token auth
        role=settings.snowflake_role,
        warehouse=settings.snowflake_warehouse,
        database=settings.snowflake_database,
        schema=settings.snowflake_schema,
    )


def run_query(sql: str, params: tuple = ()) -> list[dict]:
    conn = get_connection()
    try:
        cur = conn.cursor(snowflake.connector.DictCursor)
        cur.execute(sql, params)
        return cur.fetchall()
    finally:
        conn.close()


def execute_many(sql: str, seq_of_params: list[tuple]) -> None:
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.executemany(sql, seq_of_params)
        conn.commit()
    finally:
        conn.close()


def execute(sql: str, params: tuple = ()) -> int:
    """Run a single INSERT/UPDATE statement and return the affected row count."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
        return cur.rowcount
    finally:
        conn.close()
