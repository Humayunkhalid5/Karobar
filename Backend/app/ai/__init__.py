"""AI layer: providers are isolated behind the FallbackAdapter."""
from app.ai.adapter import FallbackAdapter, get_adapter, reset_adapter

__all__ = ["FallbackAdapter", "get_adapter", "reset_adapter"]
