"""
Image Validator Service

Validates images before sending to AI provider.
Performs basic checks to catch obvious non-payment images early.
"""

import base64
import logging
from io import BytesIO
from typing import Tuple, Optional

from PIL import Image

logger = logging.getLogger(__name__)


class ImageValidator:
    """
    Validates images for basic requirements before AI processing.
    """
    
    # Supported image formats
    SUPPORTED_FORMATS = {"JPEG", "PNG", "GIF", "WEBP"}
    
    # Size limits
    MIN_WIDTH = 100
    MIN_HEIGHT = 100
    MAX_WIDTH = 4096
    MAX_HEIGHT = 4096
    MAX_FILE_SIZE_MB = 10
    
    @classmethod
    def validate(cls, image_base64: str) -> Tuple[bool, Optional[str]]:
        """
        Validate image for processing.
        
        Args:
            image_base64: Base64 encoded image data
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Handle data URL format
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            
            # Decode base64
            try:
                image_bytes = base64.b64decode(image_base64)
            except Exception as e:
                return False, f"Invalid base64 encoding: {e}"
            
            # Check file size
            size_mb = len(image_bytes) / (1024 * 1024)
            if size_mb > cls.MAX_FILE_SIZE_MB:
                return False, f"Image too large: {size_mb:.1f}MB (max {cls.MAX_FILE_SIZE_MB}MB)"
            
            # Open and validate with PIL
            try:
                image = Image.open(BytesIO(image_bytes))
            except Exception as e:
                return False, f"Cannot open image: {e}"
            
            # Check format
            if image.format not in cls.SUPPORTED_FORMATS:
                return False, f"Unsupported format: {image.format}. Supported: {cls.SUPPORTED_FORMATS}"
            
            # Check dimensions
            width, height = image.size
            
            if width < cls.MIN_WIDTH or height < cls.MIN_HEIGHT:
                return False, f"Image too small: {width}x{height} (min {cls.MIN_WIDTH}x{cls.MIN_HEIGHT})"
            
            if width > cls.MAX_WIDTH or height > cls.MAX_HEIGHT:
                return False, f"Image too large: {width}x{height} (max {cls.MAX_WIDTH}x{cls.MAX_HEIGHT})"
            
            # Basic aspect ratio check (payment screenshots are usually portrait or slightly square)
            aspect_ratio = width / height
            if aspect_ratio > 3 or aspect_ratio < 0.3:
                logger.warning(f"Unusual aspect ratio: {aspect_ratio:.2f}")
                # Don't fail, just warn - some screenshots might be panoramic
            
            return True, None
            
        except Exception as e:
            logger.error(f"Image validation error: {e}")
            return False, f"Validation error: {e}"
    
    @classmethod
    def get_image_info(cls, image_base64: str) -> dict:
        """
        Get information about the image.
        
        Args:
            image_base64: Base64 encoded image data
            
        Returns:
            dict with image information
        """
        try:
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            
            image_bytes = base64.b64decode(image_base64)
            image = Image.open(BytesIO(image_bytes))
            
            return {
                "format": image.format,
                "width": image.size[0],
                "height": image.size[1],
                "mode": image.mode,
                "size_bytes": len(image_bytes),
                "size_mb": round(len(image_bytes) / (1024 * 1024), 2),
            }
        except Exception as e:
            return {
                "error": str(e)
            }
