"""
Google AI Studio Provider

Implementation for Google's Generative AI (Gemini) models.
Uses the free tier models only.
"""

import json
import base64
import logging
from typing import Optional

import google.genai as genai
from google.genai import types

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
    # Using Gemma-3-27B-IT for better reasoning and multilingual support
    DEFAULT_MODEL = "gemma-3-27b-it"
    
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
            self._client = genai.Client(api_key=GOOGLE_AI_STUDIO_API_KEY)
        else:
            logger.warning("GOOGLE_AI_STUDIO_API_KEY not set")
            self._client = None
    
    def get_model_id(self) -> str:
        return self._model_id
    
    def get_provider_name(self) -> str:
        return "google_ai_studio"
    
    def is_free_tier(self) -> bool:
        return is_model_allowed(self._model_id)
    
    def _get_working_model(self, model_id: str):
        """Get a specific model instance."""
        try:
            return genai.GenerativeModel(model_id)
        except Exception as e:
            logger.warning(f"Model {model_id} instantiation failed: {e}")
            return None
    
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
        # Prepare image data once
        try:
            # Decode base64 to get image bytes
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            image_bytes = base64.b64decode(image_base64)
            
            # Detect image type from magic bytes
            mime_type = "image/jpeg"  # default
            if image_bytes.startswith(b'\x89PNG'):
                mime_type = "image/png"
            elif image_bytes.startswith(b'\xFF\xD8\xFF'):
                mime_type = "image/jpeg"
            elif image_bytes.startswith(b'GIF'):
                mime_type = "image/gif"
            elif image_bytes.startswith(b'WEBP', 8):
                mime_type = "image/webp"
            
            image_part = {
                "mime_type": mime_type,
                "data": image_bytes
            }
        except Exception as e:
            logger.error(f"Error preparing image data: {e}")
            return {
                "error": f"Image preparation failed: {str(e)}",
                "is_payment_screenshot": False,
                "confidence": 0.0,
            }

        # List of models to try in order
        models_to_try = [self._model_id]
        
        # Add fallbacks - Updated model names for new Google Gen AI API
        fallbacks = [
            "gemma-3-27b-it", # Try Gemma first
            "gemini-2.0-flash-exp",
            "gemini-2.0-flash", 
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash", # Fallback to older
            "gemini-1.5-pro",
        ]
        
        # Dedup preserving order
        for fb in fallbacks:
            if fb not in models_to_try:
                models_to_try.append(fb)
        
        last_error = None
        
        for model_id in models_to_try:
            # Check if allowed (skip if not free and we only want free)
            if not is_model_allowed(model_id):
                continue
                
            logger.info(f"Attempting to use model: {model_id}")
            
            try:
                # Update current model ID for status checks
                self._model_id = model_id
                
                # Get prompt
                prompt = self.get_payment_extraction_prompt()
                
                # Generate content
                response = await self._generate_content_with_model(model_id, prompt, image_part)
                
                # If we got here, it worked!
                logger.info(f"✅ Success with model: {model_id}")
                return self._parse_ai_response(response)
                
            except Exception as e:
                logger.warning(f"❌ Model {model_id} failed: {e}")
                last_error = e
                # Continue to next model
        
        # If all failed
        return {
            "error": f"All models failed. Last error: {str(last_error)}",
            "is_payment_screenshot": False,
            "confidence": 0.0,
        }
    
    async def _generate_content_with_model(self, model_id: str, prompt: str, image_part: dict) -> str:
        """
        Generate content using a specific Gemini model with new API.
        """
        try:
            # Prepare content parts for new API
            contents = [
                types.Content(
                    parts=[
                        types.Part.from_text(text=prompt),
                        types.Part.from_bytes(
                            data=image_part["data"],
                            mime_type=image_part["mime_type"]
                        )
                    ]
                )
            ]
            
            # Generate content using new API
            response = self._client.models.generate_content(
                model=model_id,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=1024,
                )
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"Error generating content with {model_id}: {e}")
            raise
    
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
