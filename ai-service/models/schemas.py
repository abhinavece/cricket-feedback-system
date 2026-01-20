"""
Pydantic Models for AI Service

IMPORTANT: This schema is a CONTRACT with the UI.
The structure MUST remain static - only values change.
Never add/remove fields without coordinating with frontend.
"""

from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


class PaymentData(BaseModel):
    """
    Payment data extracted from screenshot.
    
    CONTRACT: All fields are always present.
    Empty string for missing text fields, 0.0 for missing numbers.
    """
    amount: float = Field(default=0.0, description="Payment amount")
    currency: str = Field(default="INR", description="Currency code")
    payer_name: str = Field(default="", description="Name of the person who paid")
    payee_name: str = Field(default="", description="Name of the recipient")
    date: str = Field(default="", description="Payment date in YYYY-MM-DD format")
    time: str = Field(default="", description="Payment time in HH:MM:SS format")
    transaction_status: Literal["completed", "failed", "pending", "unknown"] = Field(
        default="unknown",
        description="Transaction status"
    )
    transaction_id: str = Field(default="", description="UPI/Transaction reference ID")
    payment_method: Literal["UPI", "NEFT", "IMPS", "unknown"] = Field(
        default="unknown",
        description="Payment method used"
    )
    upi_id: str = Field(default="", description="UPI ID if available")


class ResponseMetadata(BaseModel):
    """
    Metadata about the parsing operation.
    
    CONTRACT: All fields are always present.
    """
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence score 0-1"
    )
    is_payment_screenshot: bool = Field(
        default=False,
        description="Whether the image was identified as a payment screenshot"
    )
    processing_time_ms: int = Field(
        default=0,
        description="Time taken to process in milliseconds"
    )
    provider: str = Field(
        default="",
        description="AI provider used"
    )
    model: str = Field(
        default="",
        description="Model used for parsing"
    )
    model_cost_tier: Literal["free", "paid", "unknown"] = Field(
        default="unknown",
        description="Whether the model call was free or paid"
    )
    image_hash: str = Field(
        default="",
        description="SHA-256 hash of the image for deduplication"
    )
    requires_review: bool = Field(
        default=False,
        description="Whether admin review is required"
    )
    review_reason: Optional[Literal[
        "low_confidence",
        "date_mismatch", 
        "ai_uncertain",
        "not_payment_screenshot",
        "validation_failed",
        "service_error",
        "service_disabled",
        "daily_limit_exceeded",
        "model_not_free"
    ]] = Field(
        default=None,
        description="Reason for requiring review"
    )


class ParsePaymentResponse(BaseModel):
    """
    Main response schema for payment parsing.
    
    CONTRACT: This exact structure is expected by the UI.
    Never modify field names or remove fields.
    """
    success: bool = Field(
        default=False,
        description="Whether parsing was successful"
    )
    error_code: Optional[Literal[
        "not_payment_screenshot",
        "payment_date_invalid",
        "ai_failed",
        "validation_failed",
        "service_disabled",
        "service_error",
        "daily_limit_exceeded",
        "model_not_free",
        "invalid_image"
    ]] = Field(
        default=None,
        description="Error code if success is false"
    )
    error_message: Optional[str] = Field(
        default=None,
        description="Human-readable error message"
    )
    data: PaymentData = Field(
        default_factory=PaymentData,
        description="Extracted payment data"
    )
    metadata: ResponseMetadata = Field(
        default_factory=ResponseMetadata,
        description="Processing metadata"
    )

    @classmethod
    def error_response(
        cls,
        error_code: str,
        error_message: str,
        review_reason: str = None,
        provider: str = "",
        model: str = "",
        model_cost_tier: str = "unknown",
        image_hash: str = "",
        processing_time_ms: int = 0,
        is_payment_screenshot: bool = False
    ) -> "ParsePaymentResponse":
        """Factory method for creating error responses."""
        return cls(
            success=False,
            error_code=error_code,
            error_message=error_message,
            data=PaymentData(),
            metadata=ResponseMetadata(
                confidence=0.0,
                is_payment_screenshot=is_payment_screenshot,
                processing_time_ms=processing_time_ms,
                provider=provider,
                model=model,
                model_cost_tier=model_cost_tier,
                image_hash=image_hash,
                requires_review=True,
                review_reason=review_reason or error_code
            )
        )

    @classmethod
    def success_response(
        cls,
        data: PaymentData,
        confidence: float,
        provider: str,
        model: str,
        model_cost_tier: str,
        image_hash: str,
        processing_time_ms: int,
        requires_review: bool = False,
        review_reason: str = None
    ) -> "ParsePaymentResponse":
        """Factory method for creating success responses."""
        return cls(
            success=True,
            error_code=None,
            error_message=None,
            data=data,
            metadata=ResponseMetadata(
                confidence=confidence,
                is_payment_screenshot=True,
                processing_time_ms=processing_time_ms,
                provider=provider,
                model=model,
                model_cost_tier=model_cost_tier,
                image_hash=image_hash,
                requires_review=requires_review,
                review_reason=review_reason
            )
        )


class ParsePaymentRequest(BaseModel):
    """Request schema for payment parsing."""
    image_base64: str = Field(
        ...,
        description="Base64 encoded image data"
    )
    match_date: Optional[str] = Field(
        default=None,
        description="Match date in ISO format for validation"
    )


class HealthResponse(BaseModel):
    """Health check response."""
    status: Literal["healthy", "unhealthy"] = "healthy"
    service: str = "ai-service"
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class StatusResponse(BaseModel):
    """Service status response."""
    enabled: bool
    provider: str
    daily_limit: int
    requests_today: int
    requests_remaining: int
    min_confidence_threshold: float
