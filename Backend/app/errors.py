"""Domain exceptions mapped to HTTP responses in app.main."""
from __future__ import annotations


class KarobaarError(Exception):
    """Base class for all Karobaar domain errors."""


class NotFoundError(KarobaarError):
    """Requested resource does not exist. -> 404"""


class DomainValidationError(KarobaarError):
    """Business-rule violation on user input. -> 422"""


class AIUnavailableError(KarobaarError):
    """Every provider in the chain failed. -> 503"""
