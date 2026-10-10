"""Application settings loaded from environment variables (and optional .env file)."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Application -------------------------------------------------------
    app_name: str = "Karobaar AI Backend"
    environment: str = "development"
    database_url: str = "sqlite:///./karobaar.db"
    uploads_dir_path: str = "uploads"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    auto_seed: bool = True

    # --- Supabase / Auth ---------------------------------------------------
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""
    require_auth: bool = False  # False = dev mode (merchant_id = "demo")

    # --- AI provider selection ---------------------------------------------
    ai_provider: str = "auto"
    groq_api_key: str = ""
    gemini_api_key: str = ""

    # --- Models -------------------------------------------------------------
    groq_text_model: str = "qwen/qwen3.8-27b"
    groq_audio_model: str = "whisper-large-v3-turbo"
    groq_vision_model: str = "groq/compound"
    groq_ping_model: str = "groq/compound-mini"
    gemini_model: str = "gemini-3.6-flash"
    ai_timeout_seconds: float = 60.0

    @property
    def uploads_dir(self) -> Path:
        path = Path(self.uploads_dir_path)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def cors_origins_list(self) -> list[str]:
        raw = self.cors_origins or ""
        origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
        return origins or ["*"]

    def provider_chain(self) -> list[str]:
        """Resolve the ordered provider chain. The Demo provider is always the floor."""
        mode = (self.ai_provider or "auto").strip().lower()
        if mode not in ("auto", "groq", "gemini", "demo"):
            mode = "auto"
        if mode == "demo":
            return ["demo"]
        chain: list[str] = []
        if mode in ("auto", "groq") and self.groq_api_key:
            chain.append("groq")
        if mode in ("auto", "gemini") and self.gemini_api_key:
            chain.append("gemini")
        chain.append("demo")
        return chain


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
