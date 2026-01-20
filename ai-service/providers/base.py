"""
Abstract Base Class for AI Providers

All AI providers must implement this interface.
This ensures consistent behavior and easy provider switching.
"""

from abc import ABC, abstractmethod
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class AIProviderBase(ABC):
    """
    Abstract base class for AI providers.
    
    To implement a new provider:
    1. Inherit from this class
    2. Implement all abstract methods
    3. Add to providers/__init__.py PROVIDERS dict
    """
    
    @abstractmethod
    def get_model_id(self) -> str:
        """
        Get the model identifier being used.
        
        Returns:
            str: Model ID (e.g., "gemini-1.5-flash")
        """
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """
        Get the provider name.
        
        Returns:
            str: Provider name (e.g., "google_ai_studio")
        """
        pass
    
    @abstractmethod
    def is_free_tier(self) -> bool:
        """
        Check if the current model is free tier.
        
        Returns:
            bool: True if free tier, False otherwise
        """
        pass
    
    @abstractmethod
    async def parse_payment_image(
        self,
        image_base64: str,
        match_date: Optional[str] = None
    ) -> dict:
        """
        Parse a payment screenshot and extract structured data.
        
        Args:
            image_base64: Base64 encoded image
            match_date: Optional match date for validation
            
        Returns:
            dict: Parsed payment data with structure:
                {
                    "is_payment_screenshot": bool,
                    "confidence": float,
                    "amount": float,
                    "currency": str,
                    "payer_name": str,
                    "payee_name": str,
                    "date": str,
                    "time": str,
                    "transaction_status": str,
                    "transaction_id": str,
                    "payment_method": str,
                    "upi_id": str,
                    "raw_response": str  # For debugging
                }
        """
        pass
    
    @abstractmethod
    async def check_billing_status(self) -> dict:
        """
        Check if any billing/costs have been incurred.
        
        Returns:
            dict: {
                "is_free": bool,
                "cost": float,
                "details": str
            }
        """
        pass
    
    def get_payment_extraction_prompt(self) -> str:
        """
        Get the prompt for payment extraction.
        Override in subclass for provider-specific prompts.
        
        Returns:
            str: Prompt text
        """
        return """You are analyzing an image. First determine if this is a UPI/bank payment screenshot.

If this is NOT a payment screenshot (e.g., selfie, document, random image, chat screenshot), respond with ONLY this JSON:
{"is_payment_screenshot": false, "detected_type": "describe what the image is"}

If this IS a payment screenshot, extract the following information and respond with ONLY valid JSON (no markdown, no explanation):
{
    "is_payment_screenshot": true,
    "amount": <number - the payment amount, use 0 if not found>,
    "currency": "INR",
    "payer_name": "<string - name of person who paid, empty string if not found>",
    "payee_name": "<string - name of recipient, empty string if not found>",
    "date": "<string in YYYY-MM-DD format, empty string if not found>",
    "time": "<string in HH:MM:SS format, empty string if not found>",
    "transaction_status": "<completed|failed|pending|unknown>",
    "transaction_id": "<string - UPI ref or transaction ID, empty string if not found>",
    "payment_method": "<UPI|NEFT|IMPS|unknown>",
    "upi_id": "<string - UPI ID if visible, empty string if not found>",
    "confidence": <number between 0 and 1 indicating how confident you are>
}

Important rules:
1. Return ONLY the JSON object, no other text
2. All string fields should be empty strings "" if not found, never null
3. Amount should be 0 if not clearly visible
4. Date must be in YYYY-MM-DD format
5. Time must be in HH:MM:SS format (use 00:00:00 if only date is visible)
6. Be conservative with confidence - if anything is unclear, lower the confidence"""
