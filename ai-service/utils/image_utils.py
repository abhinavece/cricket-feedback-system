"""
Image Utilities

Utility functions for image processing and hashing.
"""

import hashlib
import base64
from typing import Tuple


def generate_image_hash(image_base64: str) -> Tuple[str, bytes]:
    """
    Generate SHA-256 hash of image for deduplication.
    
    Args:
        image_base64: Base64 encoded image data
        
    Returns:
        Tuple of (hash_hex, image_bytes)
    """
    # Handle data URL format
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]
    
    # Decode base64
    image_bytes = base64.b64decode(image_base64)
    
    # Generate SHA-256 hash
    hash_obj = hashlib.sha256(image_bytes)
    hash_hex = hash_obj.hexdigest()
    
    return hash_hex, image_bytes


def validate_image_consistency(image_base64: str, expected_hash: str) -> bool:
    """
    Validate that image matches expected hash.
    
    Args:
        image_base64: Base64 encoded image data
        expected_hash: Expected SHA-256 hash
        
    Returns:
        True if hashes match, False otherwise
    """
    actual_hash, _ = generate_image_hash(image_base64)
    return actual_hash.lower() == expected_hash.lower()
