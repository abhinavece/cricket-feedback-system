"""
AI Service Configuration

Environment-based configuration with strong cost guardrails.
"""

import os
from typing import Set
from datetime import datetime, date

# =============================================================================
# MASTER KILL SWITCH
# =============================================================================
AI_SERVICE_ENABLED = os.getenv("AI_SERVICE_ENABLED", "true").lower() == "true"

# =============================================================================
# PROVIDER CONFIGURATION
# =============================================================================
AI_PROVIDER = os.getenv("AI_PROVIDER", "google_ai_studio")

# Google AI Studio
GOOGLE_AI_STUDIO_API_KEY = os.getenv("GOOGLE_AI_STUDIO_API_KEY", "")

# OpenRouter (future)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# =============================================================================
# COST GUARDRAILS - CRITICAL
# =============================================================================

# WHITELIST of FREE models ONLY - any model not in this list will be BLOCKED
ALLOWED_FREE_MODELS: Set[str] = {
    # Google AI Studio free models (Gemini) - Updated for new API
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-pro",
    "gemini-pro-vision",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    # Gemma models (if available)
    "gemma-3-27b-it",
    "google/gemma-3-27b-it:free",
    "google/gemma-2-9b-it:free",
    # OpenRouter free models
    "meta-llama/llama-3.2-11b-vision-instruct:free",
    "meta-llama/llama-3.2-90b-vision-instruct:free",
    "google/gemma-2-9b-it:free",
}

# Daily request limit (even for free tier - prevent abuse)
DAILY_REQUEST_LIMIT = int(os.getenv("DAILY_REQUEST_LIMIT", "500"))

# Request counter storage (in-memory for simplicity, reset on restart)
_request_counter = {
    "date": date.today().isoformat(),
    "count": 0
}

def get_request_count() -> int:
    """Get current request count, resetting if day changed."""
    today = date.today().isoformat()
    if _request_counter["date"] != today:
        _request_counter["date"] = today
        _request_counter["count"] = 0
    return _request_counter["count"]

def increment_request_count() -> int:
    """Increment and return new count."""
    today = date.today().isoformat()
    if _request_counter["date"] != today:
        _request_counter["date"] = today
        _request_counter["count"] = 0
    _request_counter["count"] += 1
    return _request_counter["count"]

def is_within_daily_limit() -> bool:
    """Check if we're within daily request limit."""
    return get_request_count() < DAILY_REQUEST_LIMIT

# =============================================================================
# VALIDATION THRESHOLDS
# =============================================================================
MIN_CONFIDENCE_THRESHOLD = float(os.getenv("MIN_CONFIDENCE_THRESHOLD", "0.7"))

# =============================================================================
# SERVICE URLS
# =============================================================================
BACKEND_CALLBACK_URL = os.getenv("BACKEND_CALLBACK_URL", "http://backend-service:5001")

# =============================================================================
# LOGGING
# =============================================================================
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def is_model_allowed(model_id: str) -> bool:
    """Check if model is in the FREE whitelist."""
    return model_id in ALLOWED_FREE_MODELS

def should_block_request(model_id: str, response_headers: dict = None) -> tuple[bool, str | None]:
    """
    Check if request should be blocked based on cost guardrails.
    
    Returns:
        tuple: (should_block, reason)
    """
    # Check master kill switch
    if not AI_SERVICE_ENABLED:
        return True, "service_disabled"
    
    # Check model whitelist
    if not is_model_allowed(model_id):
        return True, "model_not_free"
    
    # Check daily limit
    if not is_within_daily_limit():
        return True, "daily_limit_exceeded"
    
    # Check for billing indicators in response (if available)
    if response_headers:
        billing_indicators = [
            "x-billing-charged",
            "x-cost",
            "x-usage-cost",
        ]
        for indicator in billing_indicators:
            if indicator.lower() in {k.lower() for k in response_headers.keys()}:
                return True, "billing_detected"
    
    return False, None

def get_service_status() -> dict:
    """Get current service status for health checks."""
    return {
        "enabled": AI_SERVICE_ENABLED,
        "provider": AI_PROVIDER,
        "daily_limit": DAILY_REQUEST_LIMIT,
        "requests_today": get_request_count(),
        "requests_remaining": max(0, DAILY_REQUEST_LIMIT - get_request_count()),
        "min_confidence_threshold": MIN_CONFIDENCE_THRESHOLD,
    }
