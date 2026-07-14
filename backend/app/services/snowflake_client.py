"""Thin wrapper around snowflake-connector-python.

Uses a Programmatic Access Token (PAT) generated in Snowsight — see
.env.example. Do not hardcode credentials here.

Connections are reused per-thread rather than opened fresh for every
query. A single Snowflake connection handshake (auth + session init +
warehouse resume) is expensive -- FastAPI runs sync route handlers in a
thread pool, so a thread-local connection lets one request's multiple
queries (e.g. /dashboard/summary's 4 queries) share one handshake, and
lets threadpool threads keep reusing their connection across requests
over the server's lifetime, instead of paying that cost on every single
query.
"""

import threading

import snowflake.connector

from app.config import settings

_local = threading.local()


def _new_connection():
    return snowflake.connector.connect(
        account=settings.snowflake_account,
        user=settings.snowflake_user,
        password=settings.snowflake_pat,  # PAT used as password for token auth
        role=settings.snowflake_role,
        warehouse=settings.snowflake_warehouse,
        database=settings.snowflake_database,
        schema=settings.snowflake_schema,
    )


def get_connection():
    """Return this thread's reused connection, creating (or replacing a
    closed) one lazily. Not safe to share a single connection across
    threads -- each thread gets its own via threading.local()."""
    conn = getattr(_local, "conn", None)
    if conn is None or conn.is_closed():
        conn = _new_connection()
        _local.conn = conn
    return conn


def run_query(sql: str, params: tuple = ()) -> list[dict]:
    conn = get_connection()
    cur = conn.cursor(snowflake.connector.DictCursor)
    cur.execute(sql, params)
    return cur.fetchall()


def execute_many(sql: str, seq_of_params: list[tuple]) -> None:
    conn = get_connection()
    cur = conn.cursor()
    cur.executemany(sql, seq_of_params)
    conn.commit()


def execute(sql: str, params: tuple = ()) -> int:
    """Run a single INSERT/UPDATE statement and return the affected row count."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(sql, params)
    conn.commit()
    return cur.rowcount
