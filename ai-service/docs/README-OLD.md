# AI Payment Parser Service

A Python FastAPI microservice that parses UPI payment screenshots using Google AI Studio's free models.

## Features

- **Payment Screenshot Parsing**: Extracts amount, date, payer name, transaction ID from UPI screenshots
- **Non-Payment Detection**: Identifies when an image is not a payment screenshot
- **Date Validation**: Flags payments older than match date for admin review
- **Cost Guardrails**: Built-in kill switch and free model whitelist to prevent unexpected charges
- **Provider Abstraction**: Easily switch between AI providers (Google AI Studio, OpenRouter, etc.)
- **Static Schema**: Fixed response schema for reliable frontend integration

## Quick Start

### Prerequisites

- Python 3.11+
- Google AI Studio API Key (free at https://aistudio.google.com/)

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GOOGLE_AI_STUDIO_API_KEY="your-api-key"
export AI_SERVICE_ENABLED="true"

# Run the service
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Docker

```bash
# Build
docker build -t cricket-feedback-ai-service:latest .

# Run
docker run -p 8000:8000 \
  -e GOOGLE_AI_STUDIO_API_KEY="your-key" \
  cricket-feedback-ai-service:latest
```

## API Endpoints

### POST /parse-payment

Parse a payment screenshot.

**Request:**
```json
{
  "image_base64": "base64-encoded-image-data",
  "match_date": "2024-01-15T00:00:00Z"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "error_code": null,
  "error_message": null,
  "data": {
    "amount": 500.0,
    "currency": "INR",
    "payer_name": "John Doe",
    "payee_name": "Mavericks XI",
    "date": "2024-01-15",
    "time": "14:30:00",
    "transaction_status": "completed",
    "transaction_id": "UPI123456789",
    "payment_method": "UPI",
    "upi_id": "john@upi"
  },
  "metadata": {
    "confidence": 0.95,
    "is_payment_screenshot": true,
    "processing_time_ms": 2500,
    "provider": "google_ai_studio",
    "model": "gemini-1.5-flash",
    "requires_review": false,
    "review_reason": null
  }
}
```

### GET /health

Health check endpoint.

### GET /status

Get service status including daily request count.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_SERVICE_ENABLED` | `true` | Master kill switch |
| `AI_PROVIDER` | `google_ai_studio` | Active provider |
| `GOOGLE_AI_STUDIO_API_KEY` | - | API key from AI Studio |
| `DAILY_REQUEST_LIMIT` | `500` | Max requests per day |
| `MIN_CONFIDENCE_THRESHOLD` | `0.7` | Minimum confidence for auto-accept |
| `LOG_LEVEL` | `INFO` | Logging level |

## Cost Guardrails

The service has multiple layers of protection against unexpected charges:

1. **Free Model Whitelist**: Only models in `ALLOWED_FREE_MODELS` can be used
2. **Daily Request Limit**: Configurable daily cap (default 500)
3. **Billing Detection**: Blocks requests if billing headers are detected
4. **Master Kill Switch**: Disable the service instantly via environment variable

## Adding a New Provider

1. Create `providers/your_provider.py` implementing `AIProviderBase`
2. Add provider to `providers/__init__.py` PROVIDERS dict
3. Add free model IDs to `config.py` ALLOWED_FREE_MODELS
4. Set `AI_PROVIDER=your_provider` environment variable

Example:
```python
from providers.base import AIProviderBase

class YourProvider(AIProviderBase):
    def get_model_id(self) -> str:
        return "your-model-id:free"
    
    def get_provider_name(self) -> str:
        return "your_provider"
    
    def is_free_tier(self) -> bool:
        return True
    
    async def parse_payment_image(self, image_base64, match_date=None):
        # Implementation
        pass
    
    async def check_billing_status(self):
        return {"is_free": True, "cost": 0.0}
```

## Fallback Behavior

When parsing fails or requires review, the service returns `requires_review: true` with a reason:

- `not_payment_screenshot`: Image is not a payment screenshot
- `date_mismatch`: Payment date is older than match date
- `low_confidence`: AI confidence below threshold
- `validation_failed`: Amount is 0 or invalid
- `service_disabled`: Kill switch is active
- `service_error`: Service unavailable or error

The backend handles fallback by flagging the payment for admin manual entry.

## Project Structure

```
ai-service/
├── app.py                 # FastAPI application
├── config.py              # Configuration & environment
├── providers/
│   ├── __init__.py        # Provider factory
│   ├── base.py            # Abstract base class
│   └── google_ai_studio.py # Google AI Studio implementation
├── services/
│   ├── payment_parser.py  # Main parsing orchestration
│   ├── image_validator.py # Image validation
│   └── date_validator.py  # Date validation
├── models/
│   └── schemas.py         # Pydantic response schemas
├── Dockerfile
└── requirements.txt
```
