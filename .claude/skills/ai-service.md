# AI Service Development Skill

## Capability
Develop Python FastAPI services for AI-powered features like payment screenshot parsing.

## Tech Stack
- Python with FastAPI
- Google AI Studio (Gemini)
- Pydantic for validation
- Docker containerization

## File Locations
- Main app: `ai-service/app.py`
- Config: `ai-service/config.py`
- Models: `ai-service/models/schemas.py`
- Providers: `ai-service/providers/`
- Services: `ai-service/services/`

## Project Structure
```
ai-service/
├── app.py                 # FastAPI application
├── config.py              # Configuration management
├── models/
│   ├── __init__.py
│   └── schemas.py         # Pydantic schemas
├── providers/
│   ├── __init__.py
│   ├── base.py            # Abstract provider
│   └── google_ai_studio.py # Google implementation
├── services/
│   ├── __init__.py
│   ├── payment_parser.py  # Main parsing service
│   ├── image_validator.py # Image validation
│   └── date_validator.py  # Date validation
└── utils/
    └── image_utils.py     # Image utilities
```

## Creating a New Service

### Step 1: Define Schema
```python
# ai-service/models/schemas.py
from pydantic import BaseModel, Field
from typing import Optional

class NewFeatureRequest(BaseModel):
    """Request model for new feature."""
    input_data: str = Field(..., description="Input data")
    options: Optional[dict] = Field(default=None)

class NewFeatureResponse(BaseModel):
    """Response model for new feature."""
    success: bool
    result: Optional[str] = None
    error_message: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
```

### Step 2: Create Service
```python
# ai-service/services/new_service.py
"""
New Feature Service

Description of what this service does.
"""

import logging
from typing import Optional, Tuple

from models.schemas import NewFeatureRequest, NewFeatureResponse

logger = logging.getLogger(__name__)


class NewFeatureService:
    """
    Service for processing new feature requests.
    
    Attributes:
        config: Service configuration
    """
    
    def __init__(self, config: Optional[dict] = None):
        """
        Initialize the service.
        
        Args:
            config: Optional configuration override
        """
        self.config = config or {}
    
    async def process(
        self,
        request: NewFeatureRequest
    ) -> NewFeatureResponse:
        """
        Process a new feature request.
        
        Args:
            request: The feature request
            
        Returns:
            NewFeatureResponse with results
        """
        try:
            # 1. Validate input
            is_valid, error = self._validate(request.input_data)
            if not is_valid:
                return NewFeatureResponse(
                    success=False,
                    error_message=error
                )
            
            # 2. Process
            result = await self._process_data(request.input_data)
            
            # 3. Return response
            return NewFeatureResponse(
                success=True,
                result=result,
                metadata={"processed": True}
            )
            
        except Exception as e:
            logger.error(f"Error processing request: {e}", exc_info=True)
            return NewFeatureResponse(
                success=False,
                error_message=str(e)
            )
    
    def _validate(self, data: str) -> Tuple[bool, Optional[str]]:
        """Validate input data."""
        if not data:
            return False, "Input data is required"
        return True, None
    
    async def _process_data(self, data: str) -> str:
        """Process the data."""
        # Implementation
        return f"Processed: {data}"
```

### Step 3: Add Endpoint
```python
# ai-service/app.py
from services.new_service import NewFeatureService
from models.schemas import NewFeatureRequest, NewFeatureResponse

new_service = NewFeatureService()

@app.post("/new-feature", response_model=NewFeatureResponse)
async def process_new_feature(request: NewFeatureRequest):
    """
    Process a new feature request.
    
    Args:
        request: The feature request
        
    Returns:
        NewFeatureResponse with results
    """
    return await new_service.process(request)
```

## Provider Pattern

For AI providers, use the abstract base class:

```python
# ai-service/providers/base.py
from abc import ABC, abstractmethod

class AIProviderBase(ABC):
    """Abstract base for AI providers."""
    
    @abstractmethod
    async def parse_payment_image(
        self,
        image_base64: str,
        match_date: str
    ) -> dict:
        """Parse a payment image."""
        pass
    
    @abstractmethod
    def is_free_tier(self) -> bool:
        """Check if using free tier."""
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Get provider name."""
        pass
```

## Configuration

```python
# ai-service/config.py
import os

# Master kill switch
AI_SERVICE_ENABLED = os.getenv("AI_SERVICE_ENABLED", "true").lower() == "true"

# Provider configuration
AI_PROVIDER = os.getenv("AI_PROVIDER", "google_ai_studio")
GOOGLE_AI_STUDIO_API_KEY = os.getenv("GOOGLE_AI_STUDIO_API_KEY", "")

# Cost guardrails
DAILY_REQUEST_LIMIT = int(os.getenv("DAILY_REQUEST_LIMIT", "500"))
MIN_CONFIDENCE_THRESHOLD = float(os.getenv("MIN_CONFIDENCE_THRESHOLD", "0.7"))

# Allowed free models
ALLOWED_FREE_MODELS = {
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
}
```

## Type Hints Required

Always use type hints:

```python
from typing import Optional, Tuple, List, Dict, Any

def process_data(
    input_data: str,
    options: Optional[Dict[str, Any]] = None
) -> Tuple[bool, Optional[str]]:
    """
    Process input data.
    
    Args:
        input_data: The data to process
        options: Optional processing options
        
    Returns:
        Tuple of (success, error_message)
    """
    pass
```

## Error Handling

```python
try:
    result = await process()
except ValidationError as e:
    logger.warning(f"Validation failed: {e}")
    return ErrorResponse(error="validation_failed", message=str(e))
except AIProviderError as e:
    logger.error(f"AI provider error: {e}")
    return ErrorResponse(error="ai_failed", message=str(e))
except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
    return ErrorResponse(error="internal_error", message="An unexpected error occurred")
```

## Testing

```python
# ai-service/tests/test_service.py
import pytest
from services.new_service import NewFeatureService
from models.schemas import NewFeatureRequest

@pytest.fixture
def service():
    return NewFeatureService()

@pytest.mark.asyncio
async def test_process_valid_input(service):
    request = NewFeatureRequest(input_data="test")
    response = await service.process(request)
    assert response.success is True

@pytest.mark.asyncio
async def test_process_empty_input(service):
    request = NewFeatureRequest(input_data="")
    response = await service.process(request)
    assert response.success is False
```
