"""
Google AI Studio Provider

Implementation for Google's Generative AI (Gemini) models.
Uses the free tier models only.
"""

import json
import base64
import logging
from typing import Optional

import google.generativeai as genai

from .base import AIProviderBase
from config import (
    GOOGLE_AI_STUDIO_API_KEY,
    ALLOWED_FREE_MODELS,
    is_model_allowed,
)

logger = logging.getLogger(__name__)


class GoogleAIStudioProvider(AIProviderBase):
    """
    Google AI Studio provider using Gemini models.
    
    Uses gemini-1.5-flash by default (free tier).
    """
    
    # Default model - must be in ALLOWED_FREE_MODELS
    DEFAULT_MODEL = "gemini-1.5-flash"
    
    def __init__(self, model_id: str = None):
        """
        Initialize the Google AI Studio provider.
        
        Args:
            model_id: Optional model override (must be in free list)
        """
        self._model_id = model_id or self.DEFAULT_MODEL
        
        # Validate model is in free list
        if not is_model_allowed(self._model_id):
            logger.warning(
                f"Model {self._model_id} not in free list, "
                f"falling back to {self.DEFAULT_MODEL}"
            )
            self._model_id = self.DEFAULT_MODEL
        
        # Configure the API
        if GOOGLE_AI_STUDIO_API_KEY:
            genai.configure(api_key=GOOGLE_AI_STUDIO_API_KEY)
            self._model = genai.GenerativeModel(self._model_id)
        else:
            logger.warning("GOOGLE_AI_STUDIO_API_KEY not set")
            self._model = None
    
    def get_model_id(self) -> str:
        return self._model_id
    
    def get_provider_name(self) -> str:
        return "google_ai_studio"
    
    def is_free_tier(self) -> bool:
        return is_model_allowed(self._model_id)
    
    async def parse_payment_image(
        self,
        image_base64: str,
        match_date: Optional[str] = None
    ) -> dict:
        """
        Parse payment screenshot using Gemini vision.
        
        Args:
            image_base64: Base64 encoded image
            match_date: Optional match date for validation
            
        Returns:
            dict: Parsed payment data
        """
        if not self._model:
            return {
                "error": "API not configured",
                "is_payment_screenshot": False,
                "confidence": 0.0,
            }
        
        try:
            # Decode base64 to get image bytes
            # Handle data URL format if present
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            
            image_bytes = base64.b64decode(image_base64)
            
            # Create image part for Gemini
            image_part = {
                "mime_type": "image/jpeg",  # Gemini handles most formats
                "data": image_bytes
            }
            
            # Get prompt
            prompt = self.get_payment_extraction_prompt()
            
            # Generate content
            response = await self._generate_content_async(prompt, image_part)
            
            # Parse the response
            return self._parse_ai_response(response)
            
        except Exception as e:
            logger.error(f"Error parsing payment image: {e}")
            return {
                "error": str(e),
                "is_payment_screenshot": False,
                "confidence": 0.0,
            }
    
    async def _generate_content_async(self, prompt: str, image_part: dict) -> str:
        """
        Generate content using Gemini model.
        
        Uses sync method wrapped since google-generativeai doesn't have native async.
        """
        import asyncio
        
        def sync_generate():
            response = self._model.generate_content(
                [prompt, image_part],
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,  # Low temperature for consistent output
                    max_output_tokens=1024,
                ),
                safety_settings={
                    "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
                    "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
                    "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
                    "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
                }
            )
            return response.text
        
        # Run in thread pool to not block
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, sync_generate)
    
    def _parse_ai_response(self, response_text: str) -> dict:
        """
        Parse the AI response text into structured data.
        
        Args:
            response_text: Raw text from AI model
            
        Returns:
            dict: Parsed data
        """
        try:
            # Clean up response - remove markdown code blocks if present
            text = response_text.strip()
            if text.startswith("```"):
                # Remove opening ```json or ```
                lines = text.split("\n")
                text = "\n".join(lines[1:])
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            # Parse JSON
            data = json.loads(text)
            
            # Ensure all required fields exist with defaults
            return {
                "is_payment_screenshot": data.get("is_payment_screenshot", False),
                "confidence": float(data.get("confidence", 0.0)),
                "amount": float(data.get("amount", 0)),
                "currency": str(data.get("currency", "INR")),
                "payer_name": str(data.get("payer_name", "")),
                "payee_name": str(data.get("payee_name", "")),
                "date": str(data.get("date", "")),
                "time": str(data.get("time", "")),
                "transaction_status": str(data.get("transaction_status", "unknown")),
                "transaction_id": str(data.get("transaction_id", "")),
                "payment_method": str(data.get("payment_method", "unknown")),
                "upi_id": str(data.get("upi_id", "")),
                "detected_type": data.get("detected_type", ""),
                "raw_response": response_text,
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Response was: {response_text[:500]}")
            return {
                "error": f"JSON parse error: {e}",
                "is_payment_screenshot": False,
                "confidence": 0.0,
                "raw_response": response_text,
            }
    
    async def check_billing_status(self) -> dict:
        """
        Check billing status for Google AI Studio.
        
        Note: Google AI Studio free tier doesn't have a billing API.
        We rely on using only free models.
        """
        return {
            "is_free": self.is_free_tier(),
            "cost": 0.0,
            "details": f"Using model {self._model_id} (free tier)" if self.is_free_tier() else "Model may incur costs"
        }
