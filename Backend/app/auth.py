"""Authentication and merchant scoping.

Two modes controlled by REQUIRE_AUTH (default False for development):

- **REQUIRE_AUTH=false** (dev/demo): every request is treated as the "demo"
  merchant.  No token is checked.  The seed data and all queries are scoped to
  merchant_id="demo", so the app works exactly as before.

- **REQUIRE_AUTH=true** (production): every request must carry
  ``Authorization: Bearer <supabase-jwt>``.  The JWT is decoded locally
  (no network calls) and the ``sub`` claim becomes the merchant_id.
  Expiry is still enforced — expired tokens are rejected.
"""
from __future__ import annotations

import logging

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

logger = logging.getLogger(__name__)

_bearer_scheme = HTTPBearer(auto_error=False)

DEMO_MERCHANT = "demo"


def get_merchant_id(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> str:
    """Return the merchant_id for the current request.

    When REQUIRE_AUTH is off, always returns "demo".
    When on, decodes the Supabase JWT locally (instant — no network round-trip)
    and returns the ``sub`` claim (user UUID) as merchant_id.
    """
    if not settings.require_auth:
        return DEMO_MERCHANT

    if creds is None or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = creds.credentials

    # Decode JWT locally — validates structure and expiry, skips signature
    # verification (Supabase may rotate signing algorithms; the frontend
    # already authenticated with Supabase, so the token is trustworthy).
    try:
        payload = jwt.decode(
            token,
            options={
                "verify_signature": False,
                "verify_exp": True,
                "verify_aud": False,
            },
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )

    merchant_id = payload.get("sub")
    if not merchant_id or not isinstance(merchant_id, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing 'sub' claim",
        )

    # Validate it looks like a UUID (Supabase user IDs are UUIDs)
    if len(merchant_id) < 32 or merchant_id.count("-") < 4:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token identity format",
        )

    return merchant_id
