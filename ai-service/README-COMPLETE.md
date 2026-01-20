# AI Payment Parser Service

## Overview

The AI Payment Parser Service is a FastAPI-based microservice that extracts payment information from screenshot images using advanced AI models. It supports multiple payment methods (UPI, NEFT, IMPS) and provides structured data with confidence scores and detailed metadata.

## 🚀 Features

### Core Capabilities
- **Multi-Model Support**: Google AI Studio with Gemma-3-27B-IT (default), Gemini 2.0 Flash, and other free-tier models
- **Payment Method Detection**: UPI, NEFT, IMPS, and other payment methods
- **High Accuracy**: 95%+ confidence scores with advanced reasoning models
- **Image Deduplication**: SHA-256 hashing to prevent duplicate processing
- **Cost Guardrails**: Free-tier only models with daily limits and usage tracking
- **Comprehensive Validation**: Image format, size, and content validation

### Advanced Features
- **Model Cost Transparency**: Clear indication of free vs paid model usage
- **Processing Metadata**: Detailed timing, model information, and confidence scores
- **Error Handling**: Structured error responses with specific error codes
- **Review Workflow**: Automatic flagging for admin review when needed
- **Date Validation**: Match date validation for cricket payment contexts

## 📋 API Documentation

### Base URL
```
http://localhost:8010
```

### Endpoints

#### 1. Parse Payment Screenshot

**Endpoint**: `POST /parse-payment`

**Description**: Extract payment information from a base64-encoded screenshot image.

**Request Body**:
```json
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...", // Base64 encoded image
  "match_date": "2024-01-15T00:00:00Z" // Optional: Match date for validation
}
```

**Response Format**:
```json
{
  "success": true,
  "error_code": null,
  "error_message": null,
  "data": {
    "amount": 1000.0,
    "currency": "INR",
    "payer_name": "John Doe",
    "payee_name": "SUDIPTO KUMAR BHATTACHARJEE",
    "date": "2025-11-08",
    "time": "13:24:00",
    "transaction_status": "completed",
    "transaction_id": "567735198192",
    "payment_method": "UPI",
    "upi_id": "example@upi"
  },
  "metadata": {
    "confidence": 0.95,
    "is_payment_screenshot": true,
    "processing_time_ms": 11283,
    "provider": "google_ai_studio",
    "model": "gemma-3-27b-it",
    "model_cost_tier": "free",
    "image_hash": "9e297d97ca055f06c6e615d38dbb4c8b0bb5889a4aaa21733d50b12b3717de35",
    "requires_review": false,
    "review_reason": null
  }
}
```

#### 2. Health Check

**Endpoint**: `GET /`

**Response**:
```json
{
  "status": "healthy",
  "service": "ai-service",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 3. Service Status

**Endpoint**: `GET /status`

**Response**:
```json
{
  "enabled": true,
  "provider": "google_ai_studio",
  "daily_limit": 500,
  "requests_today": 45,
  "requests_remaining": 455,
  "min_confidence_threshold": 0.7
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the service root:

```bash
# Service Configuration
AI_SERVICE_ENABLED=true
AI_PROVIDER=google_ai_studio
LOG_LEVEL=INFO

# Google AI Studio
GOOGLE_AI_STUDIO_API_KEY=your_api_key_here

# Rate Limiting
DAILY_REQUEST_LIMIT=500

# Backend Callback (for integration)
BACKEND_CALLBACK_URL=http://backend-service:5001

# Validation Thresholds
MIN_CONFIDENCE_THRESHOLD=0.7
```

### Model Configuration

The service supports these free-tier models:

| Model | Context | Capabilities | Use Case |
|-------|---------|-------------|----------|
| `gemma-3-27b-it` | 128K tokens | Multimodal, 140+ languages | **Default** - Best reasoning |
| `gemini-2.0-flash-exp` | 1M tokens | Fast processing | Quick processing |
| `gemini-1.5-flash` | 1M tokens | Reliable workhorse | Fallback option |
| `gemini-1.5-pro` | 2M tokens | Higher accuracy | Complex scenarios |

## 📊 Response Format Details

### Data Fields (Always Present)

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `amount` | float | Payment amount | 0.0 |
| `currency` | string | Currency code | "INR" |
| `payer_name` | string | Person who paid | "" |
| `payee_name` | string | Recipient name | "" |
| `date` | string | Payment date (YYYY-MM-DD) | "" |
| `time` | string | Payment time (HH:MM:SS) | "" |
| `transaction_status` | enum | completed/failed/pending/unknown | "unknown" |
| `transaction_id` | string | UPI/Transaction reference | "" |
| `payment_method` | enum | UPI/NEFT/IMPS/unknown | "unknown" |
| `upi_id` | string | UPI ID if available | "" |

### Metadata Fields (Always Present)

| Field | Type | Description |
|-------|------|-------------|
| `confidence` | float | AI confidence score (0.0-1.0) |
| `is_payment_screenshot` | boolean | Whether image was identified as payment |
| `processing_time_ms` | int | Processing time in milliseconds |
| `provider` | string | AI provider used |
| `model` | string | Specific model used |
| `model_cost_tier` | enum | "free" / "paid" / "unknown" |
| `image_hash` | string | SHA-256 hash for deduplication |
| `requires_review` | boolean | Whether admin review is needed |
| `review_reason` | enum | Reason for review requirement |

## 🛡️ Error Handling

### Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `invalid_image` | Image format/size validation failed | 200 |
| `not_payment_screenshot` | Image not identified as payment screenshot | 200 |
| `ai_failed` | AI processing failed | 200 |
| `service_disabled` | AI service disabled | 200 |
| `daily_limit_exceeded` | Daily request limit exceeded | 200 |
| `model_not_free` | Model not in free tier | 200 |
| `validation_failed` | Payment data validation failed | 200 |
| `service_error` | Unexpected service error | 200 |

### Error Response Format

```json
{
  "success": false,
  "error_code": "invalid_image",
  "error_message": "Cannot open image: cannot identify image file",
  "data": {
    "amount": 0.0,
    "currency": "INR",
    "payer_name": "",
    "payee_name": "",
    "date": "",
    "time": "",
    "transaction_status": "unknown",
    "transaction_id": "",
    "payment_method": "unknown",
    "upi_id": ""
  },
  "metadata": {
    "confidence": 0.0,
    "is_payment_screenshot": false,
    "processing_time_ms": 45,
    "provider": "google_ai_studio",
    "model": "gemma-3-27b-it",
    "model_cost_tier": "free",
    "image_hash": "9e297d97ca055f06c6e615d38dbb4c8b0bb5889a4aaa21733d50b12b3717de35",
    "requires_review": true,
    "review_reason": "validation_failed"
  }
}
```

## 🔒 Security & Cost Controls

### Free-Model-Only Policy
- Only whitelisted free-tier models are allowed
- Automatic fallback to free models if paid model specified
- Cost guardrails prevent unexpected charges

### Rate Limiting
- Daily request limits (default: 500)
- Request counting and tracking
- Automatic blocking when limits exceeded

### Image Validation
- Supported formats: JPEG, PNG, GIF, WEBP
- Size limits: 100x100 to 4096x4096 pixels
- Maximum file size: 10MB
- Aspect ratio validation

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t ai-payment-parser .
```

### Run Container
```bash
docker run -p 8010:8010 \
  -e GOOGLE_AI_STUDIO_API_KEY=your_key \
  -e DAILY_REQUEST_LIMIT=500 \
  ai-payment-parser
```

### Docker Compose
```yaml
version: '3.8'
services:
  ai-service:
    build: .
    ports:
      - "8010:8010"
    environment:
      - GOOGLE_AI_STUDIO_API_KEY=${GOOGLE_AI_STUDIO_API_KEY}
      - DAILY_REQUEST_LIMIT=500
      - AI_SERVICE_ENABLED=true
    restart: unless-stopped
```

## 🧪 Testing

### Local Development Setup

1. **Install Dependencies**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Start Service**
```bash
python -m uvicorn app:app --host 0.0.0.0 --port 8010 --reload
```

### Test with Python

```python
import base64
import requests
import json

# Read and encode image
with open('payment_screenshot.png', 'rb') as f:
    image_b64 = base64.b64encode(f.read()).decode()

# Make request
response = requests.post('http://localhost:8010/parse-payment', json={
    'image_base64': image_b64,
    'match_date': '2024-01-15T00:00:00Z'
})

result = response.json()
print(f"Success: {result['success']}")
print(f"Amount: {result['data']['amount']} {result['data']['currency']}")
print(f"Model: {result['metadata']['model']}")
print(f"Confidence: {result['metadata']['confidence']}")
```

### Test with curl

```bash
# Encode image
IMAGE_BASE64=$(base64 -i payment_screenshot.png)

# Make request
curl -X POST http://localhost:8010/parse-payment \
  -H "Content-Type: application/json" \
  -d "{
    \"image_base64\": \"${IMAGE_BASE64}\",
    \"match_date\": \"2024-01-15T00:00:00Z\"
  }"
```

## 🔄 Integration Examples

### Cricket Payment System Integration

```python
class CricketPaymentProcessor:
    def __init__(self):
        self.ai_service_url = "http://localhost:8010"
        self.processed_hashes = set()  # Deduplication cache
    
    def process_payment_screenshot(self, image_path, match_date):
        # Check deduplication
        with open(image_path, 'rb') as f:
            image_b64 = base64.b64encode(f.read()).decode()
        
        # Generate hash for deduplication
        image_hash = hashlib.sha256(base64.b64decode(image_b64)).hexdigest()
        
        if image_hash in self.processed_hashes:
            return {"error": "Image already processed"}
        
        # Call AI service
        response = requests.post(f"{self.ai_service_url}/parse-payment", json={
            'image_base64': image_b64,
            'match_date': match_date
        })
        
        result = response.json()
        
        if result['success']:
            self.processed_hashes.add(image_hash)
            return {
                "payment_valid": True,
                "amount": result['data']['amount'],
                "payee": result['data']['payee_name'],
                "transaction_id": result['data']['transaction_id'],
                "confidence": result['metadata']['confidence']
            }
        else:
            return {
                "payment_valid": False,
                "error": result['error_message'],
                "requires_review": result['metadata']['requires_review']
            }
```

## 📈 Monitoring & Analytics

### Service Health Monitoring
- Health check endpoint: `GET /`
- Service status endpoint: `GET /status`
- Request counting and daily limits
- Processing time tracking

### Usage Analytics
- Model usage statistics
- Confidence score distributions
- Error rate tracking
- Processing performance metrics

## 🔧 Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify Google AI Studio API key is valid
   - Check that key has sufficient scopes
   - Ensure key is properly set in environment

2. **Image Validation Failed**
   - Check image format (JPEG, PNG, GIF, WEBP supported)
   - Verify image size (100x100 to 4096x4096 pixels)
   - Ensure file size is under 10MB

3. **Low Confidence Scores**
   - Ensure image is clear and readable
   - Check that screenshot shows complete payment information
   - Try different models if available

4. **Service Disabled**
   - Check `AI_SERVICE_ENABLED` environment variable
   - Verify daily limits haven't been exceeded
   - Check service logs for errors

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=DEBUG python -m uvicorn app:app --host 0.0.0.0 --port 8010 --reload
```

## 📝 License

This service is part of the Cricket Feedback System. See project license for details.

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation for API changes
4. Ensure all responses maintain the fixed contract format

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Model**: Gemma-3-27B-IT (default)
