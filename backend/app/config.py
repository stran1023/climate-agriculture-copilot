from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    snowflake_account: str = ""
    snowflake_user: str = ""
    snowflake_role: str = ""
    snowflake_warehouse: str = ""
    snowflake_database: str = ""
    snowflake_schema: str = ""
    snowflake_pat: str = ""

    open_meteo_base_url: str = "https://api.open-meteo.com/v1"

    backend_port: int = 8000
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
