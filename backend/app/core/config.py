from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "sqlite+pysqlite:///./gramshiksha.db"
    supabase_url: str = ""
    jwt_audience: str = "authenticated"
    cors_origins: str = "https://gramshiksha-ai.vercel.app,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    @property
    def allowed_origins(self) -> list[str]:
        default_origins = [
            "https://gramshiksha-ai.vercel.app",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:4173",
            "http://127.0.0.1:4173",
        ]
        configured = [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip() and origin.strip() != "*"]
        
        seen = set()
        origins = []
        for orig in default_origins + configured:
            clean = orig.rstrip("/")
            if clean and clean not in seen and clean != "*":
                seen.add(clean)
                origins.append(clean)
        return origins

settings = Settings()

