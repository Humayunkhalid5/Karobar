"""Pydantic API contracts — the single source of truth for response shapes."""
from app.schemas.ask import AskRequest, AskResponse
from app.schemas.capture import DraftEvent, ExtractTextRequest, TranscriptResponse
from app.schemas.customers import CustomerDetailResponse, CustomerListResponse, CustomerOut
from app.schemas.dashboard import DashboardResponse, TopDebtor, TrendPoint
from app.schemas.events import (
    EventCreate,
    EventListResponse,
    EventOut,
    EventUpdate,
    EventType,
    PaymentStatus,
    SourceType,
    VerificationStatus,
)
from app.schemas.evidence import MonthSalesPoint, PassportResponse
from app.schemas.financing import (
    MatchedRequirement,
    MissingRequirement,
    ProgramReadiness,
    ProgramSummary,
    Requirement,
)
from app.schemas.reminders import ReminderRequest, ReminderResponse

__all__ = [
    "AskRequest",
    "AskResponse",
    "CustomerDetailResponse",
    "CustomerListResponse",
    "CustomerOut",
    "DashboardResponse",
    "DraftEvent",
    "EventCreate",
    "EventListResponse",
    "EventOut",
    "EventUpdate",
    "EventType",
    "ExtractTextRequest",
    "MatchedRequirement",
    "MissingRequirement",
    "MonthSalesPoint",
    "PassportResponse",
    "PaymentStatus",
    "ProgramReadiness",
    "ProgramSummary",
    "ReminderRequest",
    "ReminderResponse",
    "Requirement",
    "SourceType",
    "TopDebtor",
    "TranscriptResponse",
    "TrendPoint",
    "VerificationStatus",
]
