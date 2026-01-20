"""
Payment Parser Service

Main service that orchestrates payment screenshot parsing.
Handles validation, AI provider calls, and response formatting.
"""

import time
import logging
from typing import Optional

from models.schemas import (
    ParsePaymentResponse,
    PaymentData,
    ResponseMetadata,
)
from providers import get_provider, AIProviderBase
from services.image_validator import ImageValidator
from services.date_validator import DateValidator
from utils.image_utils import generate_image_hash
from config import (
    AI_SERVICE_ENABLED,
    should_block_request,
    increment_request_count,
    get_request_count,
    MIN_CONFIDENCE_THRESHOLD,
    DAILY_REQUEST_LIMIT,
)

logger = logging.getLogger(__name__)


class PaymentParserService:
    """
    Main service for parsing payment screenshots.
    
    Orchestrates:
    1. Image validation
    2. Cost guardrails check
    3. AI provider call
    4. Date validation
    5. Response formatting
    """
    
    def __init__(self, provider: AIProviderBase = None):
        """
        Initialize the payment parser service.
        
        Args:
            provider: Optional AI provider override
        """
        self._provider = provider
    
    @property
    def provider(self) -> AIProviderBase:
        """Get or create the AI provider."""
        if self._provider is None:
            self._provider = get_provider()
        return self._provider
    
    async def parse_payment_screenshot(
        self,
        image_base64: str,
        match_date: Optional[str] = None
    ) -> ParsePaymentResponse:
        """
        Parse a payment screenshot and return structured data.
        
        Args:
            image_base64: Base64 encoded image
            match_date: Optional match date for validation
            
        Returns:
            ParsePaymentResponse with extracted data or error
        """
        start_time = time.time()
        provider_name = ""
        model_id = ""
        
        try:
            # Get provider info early for error responses
            provider_name = self.provider.get_provider_name()
            model_id = self.provider.get_model_id()
            
            # Generate image hash for deduplication
            image_hash, _ = generate_image_hash(image_base64)
            
            # Determine model cost tier
            model_cost_tier = "free" if self.provider.is_free_tier() else "paid"
            
            # 1. Check master kill switch
            if not AI_SERVICE_ENABLED:
                return self._error_response(
                    "service_disabled",
                    "AI service is disabled",
                    provider_name,
                    model_id,
                    model_cost_tier,
                    image_hash,
                    start_time
                )
            
            # 2. Check cost guardrails
            should_block, block_reason = should_block_request(model_id)
            if should_block:
                return self._error_response(
                    block_reason,
                    f"Request blocked: {block_reason}",
                    provider_name,
                    model_id,
                    model_cost_tier,
                    image_hash,
                    start_time
                )
            
            # 3. Validate image
            is_valid, validation_error = ImageValidator.validate(image_base64)
            if not is_valid:
                return self._error_response(
                    "invalid_image",
                    validation_error,
                    provider_name,
                    model_id,
                    model_cost_tier,
                    image_hash,
                    start_time
                )
            
            # 4. Increment request counter
            increment_request_count()
            logger.info(f"Request #{get_request_count()}/{DAILY_REQUEST_LIMIT} - Processing image")
            
            # 5. Call AI provider
            ai_result = await self.provider.parse_payment_image(image_base64, match_date)
            
            # 6. Check for AI errors
            if "error" in ai_result and ai_result.get("error"):
                return self._error_response(
                    "ai_failed",
                    f"AI processing failed: {ai_result['error']}",
                    provider_name,
                    model_id,
                    model_cost_tier,
                    image_hash,
                    start_time
                )
            
            # 7. Check if it's a payment screenshot
            if not ai_result.get("is_payment_screenshot", False):
                detected_type = ai_result.get("detected_type", "unknown")
                return ParsePaymentResponse(
                    success=False,
                    error_code="not_payment_screenshot",
                    error_message=f"Image is not a payment screenshot. Detected: {detected_type}",
                    data=PaymentData(),
                    metadata=ResponseMetadata(
                        confidence=0.0,
                        is_payment_screenshot=False,
                        processing_time_ms=self._get_elapsed_ms(start_time),
                        provider=provider_name,
                        model=model_id,
                        model_cost_tier=model_cost_tier,
                        image_hash=image_hash,
                        requires_review=True,
                        review_reason="not_payment_screenshot"
                    )
                )
            
            # 8. Build payment data
            payment_data = PaymentData(
                amount=float(ai_result.get("amount", 0)),
                currency=str(ai_result.get("currency", "INR")),
                payer_name=str(ai_result.get("payer_name", "")),
                payee_name=str(ai_result.get("payee_name", "")),
                date=str(ai_result.get("date", "")),
                time=str(ai_result.get("time", "")),
                transaction_status=self._normalize_status(ai_result.get("transaction_status")),
                transaction_id=str(ai_result.get("transaction_id", "")),
                payment_method=self._normalize_payment_method(ai_result.get("payment_method")),
                upi_id=str(ai_result.get("upi_id", ""))
            )
            
            confidence = float(ai_result.get("confidence", 0.0))
            requires_review = False
            review_reason = None
            
            # 9. Validate amount
            if payment_data.amount <= 0:
                requires_review = True
                review_reason = "validation_failed"
                logger.warning("Amount is 0 or negative - flagging for review")
            
            # 10. Validate date against match date
            if match_date and payment_data.date:
                date_valid, date_reason = DateValidator.validate_payment_date(
                    payment_data.date,
                    match_date
                )
                if not date_valid:
                    requires_review = True
                    review_reason = date_reason
                    logger.warning(f"Date validation failed: {date_reason}")
            
            # 11. Check confidence threshold
            if confidence < MIN_CONFIDENCE_THRESHOLD:
                requires_review = True
                if not review_reason:
                    review_reason = "low_confidence"
                logger.warning(f"Low confidence: {confidence}")
            
            # 12. Build response
            processing_time_ms = self._get_elapsed_ms(start_time)
            
            return ParsePaymentResponse(
                success=True,
                error_code=None,
                error_message=None,
                data=payment_data,
                metadata=ResponseMetadata(
                    confidence=confidence,
                    is_payment_screenshot=True,
                    processing_time_ms=processing_time_ms,
                    provider=provider_name,
                    model=model_id,
                    model_cost_tier=model_cost_tier,
                    image_hash=image_hash,
                    requires_review=requires_review,
                    review_reason=review_reason
                )
            )
            
        except Exception as e:
            logger.error(f"Unexpected error in payment parsing: {e}", exc_info=True)
            return self._error_response(
                "service_error",
                f"Unexpected error: {str(e)}",
                provider_name,
                model_id,
                model_cost_tier,
                image_hash,
                start_time
            )
    
    def _error_response(
        self,
        error_code: str,
        error_message: str,
        provider: str,
        model: str,
        model_cost_tier: str,
        image_hash: str,
        start_time: float
    ) -> ParsePaymentResponse:
        """Create an error response."""
        # Map error codes to valid review_reason values
        error_to_review_reason = {
            "ai_failed": "ai_uncertain",
            "invalid_image": "validation_failed",
            "payment_date_invalid": "date_mismatch",
            "not_payment_screenshot": "not_payment_screenshot",
            "validation_failed": "validation_failed",
            "service_error": "service_error",
            "service_disabled": "service_disabled",
            "daily_limit_exceeded": "service_disabled",
            "model_not_free": "service_disabled",
        }
        
        review_reason = error_to_review_reason.get(error_code, "service_error")
        
        return ParsePaymentResponse(
            success=False,
            error_code=error_code,
            error_message=error_message,
            data=PaymentData(),
            metadata=ResponseMetadata(
                confidence=0.0,
                is_payment_screenshot=False,
                processing_time_ms=self._get_elapsed_ms(start_time),
                provider=provider,
                model=model,
                model_cost_tier=model_cost_tier,
                image_hash=image_hash,
                requires_review=True,
                review_reason=review_reason
            )
        )
    
    def _get_elapsed_ms(self, start_time: float) -> int:
        """Get elapsed time in milliseconds."""
        return int((time.time() - start_time) * 1000)
    
    def _normalize_status(self, status: str) -> str:
        """Normalize transaction status to allowed values."""
        if not status:
            return "unknown"
        status_lower = status.lower().strip()
        if status_lower in ("completed", "success", "successful", "done"):
            return "completed"
        elif status_lower in ("failed", "failure", "rejected"):
            return "failed"
        elif status_lower in ("pending", "processing", "in progress"):
            return "pending"
        return "unknown"
    
    def _normalize_payment_method(self, method: str) -> str:
        """Normalize payment method to allowed values."""
        if not method:
            return "unknown"
        method_upper = method.upper().strip()
        if method_upper in ("UPI", "BHIM", "GPAY", "PHONEPE", "PAYTM"):
            return "UPI"
        elif method_upper == "NEFT":
            return "NEFT"
        elif method_upper == "IMPS":
            return "IMPS"
        return "unknown"
