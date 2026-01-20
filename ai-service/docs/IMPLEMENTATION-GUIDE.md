# Implementation Guide - AI Payment Parser Service

## Architecture Overview

The AI Payment Parser Service is built with a modular, production-ready architecture that emphasizes reliability, cost control, and maintainability.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │───▶│   FastAPI       │───▶│  Google AI      │
│  (Frontend)     │    │   Service       │    │   Studio        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Validation     │
                       │   Layer          │
                       │  - Image Check   │
                       │  - Cost Guard    │
                       │  - Rate Limit    │
                       └─────────────────┘
```

## 📁 Project Structure

```
ai-service/
├── app.py                          # FastAPI application entry point
├── config.py                       # Configuration and environment variables
├── requirements.txt                # Python dependencies
├── .env                           # Environment variables (not committed)
├── Dockerfile                     # Container configuration
├── models/                        # Pydantic data models
│   └── schemas.py                # Request/response schemas
├── providers/                     # AI provider implementations
│   ├── base.py                   # Abstract base provider
│   └── google_ai_studio.py       # Google AI Studio provider
├── services/                      # Business logic services
│   ├── payment_parser.py         # Main payment parsing service
│   ├── image_validator.py        # Image validation service
│   └── date_validator.py         # Date validation service
├── utils/                        # Utility functions
│   └── image_utils.py            # Image hashing and processing
└── docs/                         # Documentation
    ├── API-DOCUMENTATION.md      # Detailed API specs
    └── IMPLEMENTATION-GUIDE.md   # This file
```

## 🔧 Core Components

### 1. FastAPI Application (`app.py`)

**Responsibilities**:
- HTTP request handling
- Environment setup
- CORS configuration
- Health check endpoints
- Request routing

**Key Features**:
- Automatic environment loading from `.env`
- Graceful startup/shutdown
- Structured logging
- Error handling middleware

### 2. Configuration Management (`config.py`)

**Responsibilities**:
- Environment variable management
- Cost guardrails enforcement
- Request counting and limits
- Model whitelist management

**Key Features**:
- Free-model-only enforcement
- Daily request tracking
- Master kill switch
- Configurable thresholds

### 3. Data Models (`models/schemas.py`)

**Responsibilities**:
- Request/response validation
- API contract definition
- Type safety
- Serialization/deserialization

**Key Features**:
- Fixed response format (contract)
- Comprehensive field validation
- Factory methods for responses
- Detailed metadata structure

### 4. AI Providers (`providers/`)

**Base Provider (`providers/base.py`)**:
- Abstract interface for AI providers
- Common functionality
- Standardized response format

**Google AI Studio (`providers/google_ai_studio.py`)**:
- Google Generative AI integration
- Model fallback logic
- Vision processing
- Cost tier detection

### 5. Business Services (`services/`)

**Payment Parser (`services/payment_parser.py`)**:
- Orchestration of all components
- Request lifecycle management
- Error handling and recovery
- Response formatting

**Image Validator (`services/image_validator.py`)**:
- Image format validation
- Size and dimension checks
- Basic content verification
- Error reporting

**Date Validator (`services/date_validator.py`)**:
- Payment date validation
- Match date comparison
- Business rule enforcement

### 6. Utilities (`utils/`)

**Image Utils (`utils/image_utils.py`)**:
- SHA-256 hashing for deduplication
- Base64 encoding/decoding
- Image format detection
- Consistency validation

## 🔄 Request Flow

### 1. Request Reception
```
Client → FastAPI → PaymentParserService
```

### 2. Validation Pipeline
```
PaymentParserService → ImageValidator → CostGuardrails → RateLimiting
```

### 3. AI Processing
```
PaymentParserService → GoogleAIStudioProvider → Google AI API
```

### 4. Response Formation
```
AI Result → PaymentParserService → Response Formatting → Client
```

## 🛡️ Security & Safety Layers

### 1. Cost Guardrails
```python
# Only free models allowed
ALLOWED_FREE_MODELS = {
    "gemma-3-27b-it",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    # ... other free models
}

# Request blocking
def should_block_request(model_id: str) -> tuple[bool, str]:
    if not is_model_allowed(model_id):
        return True, "model_not_free"
    if not is_within_daily_limit():
        return True, "daily_limit_exceeded"
    return False, None
```

### 2. Image Validation
```python
# Format and size validation
class ImageValidator:
    SUPPORTED_FORMATS = {"JPEG", "PNG", "GIF", "WEBP"}
    MIN_WIDTH, MIN_HEIGHT = 100, 100
    MAX_WIDTH, MAX_HEIGHT = 4096, 4096
    MAX_FILE_SIZE_MB = 10
```

### 3. Rate Limiting
```python
# Daily request tracking
def increment_request_count() -> int:
    today = date.today().isoformat()
    if _request_counter["date"] != today:
        _request_counter["date"] = today
        _request_counter["count"] = 0
    _request_counter["count"] += 1
    return _request_counter["count"]
```

## 🤖 AI Model Integration

### Model Selection Strategy
```python
# Priority order with fallbacks
models_to_try = [
    "gemma-3-27b-it",        # Best reasoning
    "gemini-2.0-flash-exp",  # Fast processing
    "gemini-1.5-flash",      # Reliable fallback
    "gemini-1.5-pro",        # High accuracy
]
```

### Content Generation
```python
# New Google AI Studio API
contents = [
    types.Content(
        parts=[
            types.Part.from_text(text=prompt),
            types.Part.from_bytes(
                data=image_bytes,
                mime_type="image/png"
            )
        ]
    )
]

response = client.models.generate_content(
    model=model_id,
    contents=contents,
    config=types.GenerateContentConfig(
        temperature=0.1,
        max_output_tokens=1024,
    )
)
```

## 📊 Response Format Contract

### Fixed Structure
The response format is **guaranteed** to remain consistent:

```json
{
  "success": boolean,
  "error_code": string|null,
  "error_message": string|null,
  "data": {
    "amount": float,
    "currency": string,
    "payer_name": string,
    "payee_name": string,
    "date": string,
    "time": string,
    "transaction_status": enum,
    "transaction_id": string,
    "payment_method": enum,
    "upi_id": string
  },
  "metadata": {
    "confidence": float,
    "is_payment_screenshot": boolean,
    "processing_time_ms": int,
    "provider": string,
    "model": string,
    "model_cost_tier": enum,
    "image_hash": string,
    "requires_review": boolean,
    "review_reason": enum
  }
}
```

### Field Guarantees
- **All fields always present** - no null field omission
- **Consistent types** - type safety enforced by Pydantic
- **Default values** - empty strings for text, 0.0 for numbers
- **Enum constraints** - limited to predefined values

## 🔧 Deployment Architecture

### Local Development
```bash
# 1. Setup environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with API keys

# 3. Start service
python -m uvicorn app:app --host 0.0.0.0 --port 8010 --reload
```

### Docker Deployment
```dockerfile
# Multi-stage build
FROM python:3.12-slim as base
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8010

CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8010"]
```

### Production Considerations
- **Health checks**: `/` endpoint for load balancers
- **Graceful shutdown**: Handle SIGTERM/SIGINT
- **Logging**: Structured JSON logs
- **Metrics**: Request counting, timing, error rates
- **Scaling**: Stateless design supports horizontal scaling

## 🧪 Testing Strategy

### Unit Tests
```python
# Test individual components
def test_image_validator():
    # Test valid image
    is_valid, error = ImageValidator.validate(valid_image_b64)
    assert is_valid == True
    assert error is None
    
    # Test invalid image
    is_valid, error = ImageValidator.validate(invalid_image_b64)
    assert is_valid == False
    assert error is not None
```

### Integration Tests
```python
# Test full request flow
def test_payment_parsing():
    response = client.post('/parse-payment', json={
        'image_base64': test_image_b64,
        'match_date': '2024-01-15T00:00:00Z'
    })
    
    assert response.status_code == 200
    result = response.json()
    assert 'success' in result
    assert 'data' in result
    assert 'metadata' in result
```

### Load Tests
```python
# Test concurrent requests
async def test_concurrent_requests():
    tasks = []
    for i in range(50):
        task = make_request(i)
        tasks.append(task)
    
    results = await asyncio.gather(*tasks)
    
    # Analyze results
    success_rate = sum(1 for r in results if r['success']) / len(results)
    assert success_rate > 0.95  # 95% success rate
```

## 📈 Performance Optimization

### Response Time Optimization
1. **Model Selection**: Fast models first, fallback to slower ones
2. **Image Processing**: Efficient base64 handling
3. **Validation**: Early rejection of invalid images
4. **Caching**: Hash-based deduplication

### Memory Management
1. **Image Processing**: Stream-based processing
2. **Request Handling**: Async/await pattern
3. **Resource Cleanup**: Explicit resource management

### Cost Optimization
1. **Free Models Only**: Whitelist approach
2. **Fallback Logic**: Try multiple models
3. **Request Limits**: Daily quotas
4. **Early Validation**: Reject invalid requests before AI

## 🔍 Monitoring & Observability

### Key Metrics
- **Request Rate**: Requests per second/minute
- **Response Times**: P50, P95, P99 latencies
- **Error Rates**: By error code and type
- **Model Usage**: Which models are being used
- **Confidence Scores**: Distribution of confidence levels

### Health Indicators
- **Service Availability**: Health check status
- **Model Availability**: AI service connectivity
- **Rate Limit Status**: Daily quota usage
- **Error Patterns**: Common failure modes

### Logging Strategy
```python
# Structured logging
logger.info(
    "Payment parsing completed",
    extra={
        "request_id": request_id,
        "model_used": model_id,
        "confidence": confidence,
        "processing_time_ms": processing_time,
        "success": success
    }
)
```

## 🚀 Future Enhancements

### Planned Features
1. **Multiple AI Providers**: OpenAI, Anthropic, local models
2. **Advanced Deduplication**: Perceptual hashing
3. **Batch Processing**: Multiple images in one request
4. **Streaming Responses**: Real-time processing updates
5. **Custom Models**: Fine-tuned models for specific use cases

### Scalability Improvements
1. **Caching Layer**: Redis for response caching
2. **Queue System**: Async processing for large images
3. **Load Balancing**: Multiple service instances
4. **Database Integration**: Persistent request tracking

### Security Enhancements
1. **API Authentication**: JWT-based auth
2. **Request Signing**: HMAC verification
3. **Rate Limiting**: Per-client limits
4. **Audit Logging**: Comprehensive request tracking

---

This implementation provides a production-ready, scalable, and maintainable AI payment parsing service with comprehensive error handling, cost controls, and monitoring capabilities.

**Version**: 1.0.0  
**Last Updated**: January 2026
