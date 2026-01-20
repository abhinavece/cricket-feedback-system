# API Documentation - AI Payment Parser Service

## Overview

This document provides detailed API specifications for the AI Payment Parser Service, including request/response formats, error handling, and integration guidelines.

## Base URL
```
http://localhost:8010
```

## Authentication

Currently, the service does not require authentication headers. However, rate limiting is implemented via daily request quotas.

## Endpoints

### 1. Parse Payment Screenshot

#### Endpoint Details
- **URL**: `POST /parse-payment`
- **Content-Type**: `application/json`
- **Description**: Extracts payment information from base64-encoded screenshot images using AI models.

#### Request Schema

```json
{
  "image_base64": "string (required)",
  "match_date": "string (optional, ISO format)"
}
```

**Field Descriptions**:
- `image_base64`: Base64 encoded image data (without data URL prefix)
- `match_date`: Optional match date for validation in ISO 8601 format (e.g., "2024-01-15T00:00:00Z")

#### Response Schema

**Success Response (HTTP 200)**:
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

**Error Response (HTTP 200)**:
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

#### Data Field Specifications

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `amount` | float | ≥ 0.0 | Payment amount in specified currency |
| `currency` | string | 3-letter code | ISO 4217 currency code (default: INR) |
| `payer_name` | string | max 255 chars | Name of person who made the payment |
| `payee_name` | string | max 255 chars | Name of payment recipient |
| `date` | string | YYYY-MM-DD | Payment date |
| `time` | string | HH:MM:SS | Payment time in 24-hour format |
| `transaction_status` | enum | completed/failed/pending/unknown | Transaction status |
| `transaction_id` | string | max 100 chars | UPI transaction ID or reference |
| `payment_method` | enum | UPI/NEFT/IMPS/unknown | Payment method used |
| `upi_id` | string | max 50 chars | UPI ID if available |

#### Metadata Field Specifications

| Field | Type | Description |
|-------|------|-------------|
| `confidence` | float | AI confidence score (0.0-1.0) |
| `is_payment_screenshot` | boolean | Whether AI identified this as a payment screenshot |
| `processing_time_ms` | int | Total processing time in milliseconds |
| `provider` | string | AI provider name (e.g., "google_ai_studio") |
| `model` | string | Specific AI model used (e.g., "gemma-3-27b-it") |
| `model_cost_tier` | enum | "free" / "paid" / "unknown" |
| `image_hash` | string | SHA-256 hash of image for deduplication |
| `requires_review` | boolean | Whether human review is recommended |
| `review_reason` | enum | Reason for review requirement |

### 2. Health Check

#### Endpoint Details
- **URL**: `GET /`
- **Description**: Service health check for load balancers and monitoring

#### Response Schema
```json
{
  "status": "healthy",
  "service": "ai-service",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Service Status

#### Endpoint Details
- **URL**: `GET /status`
- **Description**: Detailed service status including usage statistics

#### Response Schema
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

## Error Codes

| Error Code | HTTP Status | Description | Common Causes |
|------------|-------------|-------------|---------------|
| `invalid_image` | 200 | Image validation failed | Unsupported format, corrupted file, size limits |
| `not_payment_screenshot` | 200 | Image not identified as payment | Non-payment image, unclear screenshot |
| `ai_failed` | 200 | AI processing failed | Model unavailable, API issues |
| `service_disabled` | 200 | Service is disabled | Master kill switch, configuration |
| `daily_limit_exceeded` | 200 | Daily request limit exceeded | Quota exhausted |
| `model_not_free` | 200 | Model not in free tier | Paid model requested |
| `validation_failed` | 200 | Extracted data validation failed | Invalid amount, date issues |
| `service_error` | 200 | Unexpected service error | Internal server error |

## Image Requirements

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WEBP (.webp)

### Size Constraints
- **Minimum dimensions**: 100x100 pixels
- **Maximum dimensions**: 4096x4096 pixels
- **Maximum file size**: 10MB
- **Aspect ratio**: No strict limits, but extreme ratios may trigger warnings

### Quality Guidelines
- Clear, readable text
- Complete payment information visible
- Minimal glare or reflection
- No excessive cropping of payment details

## Rate Limiting

### Daily Quotas
- **Default limit**: 500 requests per day
- **Reset time**: Midnight UTC
- **Enforcement**: Hard block when limit exceeded

### Usage Tracking
- Request counting per day
- Remaining requests in status endpoint
- Automatic reset at midnight

## Model Information

### Available Models

| Model | Context Window | Languages | Specialization | Cost Tier |
|-------|---------------|-----------|----------------|-----------|
| `gemma-3-27b-it` | 128K tokens | 140+ | Multimodal reasoning | Free |
| `gemini-2.0-flash-exp` | 1M tokens | 50+ | Fast processing | Free |
| `gemini-1.5-flash` | 1M tokens | 50+ | General purpose | Free |
| `gemini-1.5-pro` | 2M tokens | 50+ | High accuracy | Free |

### Model Selection Strategy
1. **Primary**: `gemma-3-27b-it` (best reasoning)
2. **Fallback**: `gemini-2.0-flash-exp` (speed)
3. **Final**: `gemini-1.5-flash` (reliability)

## Integration Examples

### Python Integration

```python
import base64
import requests
import hashlib

class PaymentParserClient:
    def __init__(self, base_url="http://localhost:8010"):
        self.base_url = base_url
        self.processed_hashes = set()
    
    def parse_payment_image(self, image_path, match_date=None):
        """
        Parse payment screenshot with deduplication.
        
        Args:
            image_path: Path to image file
            match_date: Optional match date for validation
            
        Returns:
            dict: Parsed payment data or error
        """
        # Read and encode image
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
            image_b64 = base64.b64encode(image_bytes).decode()
        
        # Check deduplication
        image_hash = hashlib.sha256(image_bytes).hexdigest()
        if image_hash in self.processed_hashes:
            return {
                "success": False,
                "error": "Image already processed",
                "image_hash": image_hash
            }
        
        # Make API request
        payload = {
            "image_base64": image_b64,
            "match_date": match_date
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/parse-payment",
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Track processed image
            if result.get('success'):
                self.processed_hashes.add(image_hash)
            
            return result
            
        except requests.RequestException as e:
            return {
                "success": False,
                "error": f"API request failed: {str(e)}"
            }

# Usage example
client = PaymentParserClient()
result = client.parse_payment_image("payment_screenshot.png", "2024-01-15T00:00:00Z")

if result['success']:
    print(f"Payment of {result['data']['amount']} {result['data']['currency']} detected")
    print(f"Payee: {result['data']['payee_name']}")
    print(f"Confidence: {result['metadata']['confidence']}")
else:
    print(f"Error: {result.get('error_message', 'Unknown error')}")
```

### JavaScript/Node.js Integration

```javascript
const fs = require('fs');
const axios = require('axios');

class PaymentParserClient {
    constructor(baseUrl = 'http://localhost:8010') {
        this.baseUrl = baseUrl;
        this.processedHashes = new Set();
    }
    
    async parsePaymentImage(imagePath, matchDate = null) {
        try {
            // Read and encode image
            const imageBytes = fs.readFileSync(imagePath);
            const imageB64 = imageBytes.toString('base64');
            
            // Check deduplication (simplified)
            const crypto = require('crypto');
            const imageHash = crypto.createHash('sha256').update(imageBytes).digest('hex');
            
            if (this.processedHashes.has(imageHash)) {
                return {
                    success: false,
                    error: "Image already processed",
                    image_hash: imageHash
                };
            }
            
            // Make API request
            const payload = {
                image_base64: imageB64,
                match_date: matchDate
            };
            
            const response = await axios.post(`${this.baseUrl}/parse-payment`, payload, {
                timeout: 30000
            });
            
            const result = response.data;
            
            // Track processed image
            if (result.success) {
                this.processedHashes.add(imageHash);
            }
            
            return result;
            
        } catch (error) {
            return {
                success: false,
                error: `API request failed: ${error.message}`
            };
        }
    }
}

// Usage example
const client = new PaymentParserClient();

client.parsePaymentImage('payment_screenshot.png', '2024-01-15T00:00:00Z')
    .then(result => {
        if (result.success) {
            console.log(`Payment of ${result.data.amount} ${result.data.currency} detected`);
            console.log(`Payee: ${result.data.payee_name}`);
            console.log(`Confidence: ${result.metadata.confidence}`);
        } else {
            console.log(`Error: ${result.error_message || 'Unknown error'}`);
        }
    })
    .catch(error => console.error('Client error:', error));
```

### cURL Integration

```bash
#!/bin/bash

# Function to parse payment screenshot
parse_payment() {
    local image_path="$1"
    local match_date="$2"
    
    # Encode image
    local image_b64=$(base64 -i "$image_path")
    
    # Make API request
    local response=$(curl -s -X POST http://localhost:8010/parse-payment \
        -H "Content-Type: application/json" \
        -d "{
            \"image_base64\": \"${image_b64}\",
            \"match_date\": \"${match_date}\"
        }")
    
    # Parse JSON response
    echo "$response" | jq '.'
    
    # Extract key information
    local success=$(echo "$response" | jq -r '.success')
    local amount=$(echo "$response" | jq -r '.data.amount')
    local payee=$(echo "$response" | jq -r '.data.payee_name')
    local confidence=$(echo "$response" | jq -r '.metadata.confidence')
    local model=$(echo "$response" | jq -r '.metadata.model')
    
    if [ "$success" = "true" ]; then
        echo "✅ Payment parsed successfully!"
        echo "💰 Amount: $amount"
        echo "👤 Payee: $payee"
        echo "🎯 Confidence: $confidence"
        echo "🤖 Model: $model"
    else
        local error=$(echo "$response" | jq -r '.error_message')
        echo "❌ Error: $error"
    fi
}

# Usage
parse_payment "payment_screenshot.png" "2024-01-15T00:00:00Z"
```

## Testing

### Unit Testing Example

```python
import pytest
import base64
from io import BytesIO
from PIL import Image

class TestPaymentParser:
    def setup_method(self):
        """Setup test client"""
        self.client = PaymentParserClient()
    
    def create_test_image(self, text="Test Payment"):
        """Create a test image for testing"""
        img = Image.new('RGB', (400, 200), color='white')
        
        # Add text (simplified)
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        draw.text((10, 10), text, fill='black')
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode()
    
    def test_valid_payment_image(self):
        """Test parsing a valid payment image"""
        image_b64 = self.create_test_image("₹1000 paid to John Doe")
        
        response = requests.post('http://localhost:8010/parse-payment', json={
            'image_base64': image_b64,
            'match_date': '2024-01-15T00:00:00Z'
        })
        
        assert response.status_code == 200
        result = response.json()
        assert 'success' in result
        assert 'data' in result
        assert 'metadata' in result
    
    def test_invalid_image_format(self):
        """Test with invalid image data"""
        response = requests.post('http://localhost:8010/parse-payment', json={
            'image_base64': 'invalid_base64_data',
            'match_date': '2024-01-15T00:00:00Z'
        })
        
        assert response.status_code == 200
        result = response.json()
        assert result['success'] == False
        assert result['error_code'] == 'invalid_image'
```

### Load Testing

```python
import asyncio
import aiohttp
import time
from concurrent.futures import ThreadPoolExecutor

async def load_test(num_requests=100, concurrent=10):
    """Perform load testing on the API"""
    
    # Read test image once
    with open('test_payment.png', 'rb') as f:
        image_b64 = base64.b64encode(f.read()).decode()
    
    async def make_request(session, request_id):
        start_time = time.time()
        try:
            async with session.post('http://localhost:8010/parse-payment', json={
                'image_base64': image_b64,
                'match_date': '2024-01-15T00:00:00Z'
            }) as response:
                result = await response.json()
                end_time = time.time()
                return {
                    'request_id': request_id,
                    'success': result.get('success', False),
                    'response_time': (end_time - start_time) * 1000,
                    'confidence': result.get('metadata', {}).get('confidence', 0)
                }
        except Exception as e:
            end_time = time.time()
            return {
                'request_id': request_id,
                'success': False,
                'response_time': (end_time - start_time) * 1000,
                'error': str(e)
            }
    
    # Run concurrent requests
    connector = aiohttp.TCPConnector(limit=concurrent)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = []
        for i in range(num_requests):
            task = make_request(session, i)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        
        # Analyze results
        successful = sum(1 for r in results if r['success'])
        avg_response_time = sum(r['response_time'] for r in results) / len(results)
        avg_confidence = sum(r.get('confidence', 0) for r in results if r['success']) / successful if successful > 0 else 0
        
        print(f"Load Test Results:")
        print(f"  Total requests: {num_requests}")
        print(f"  Successful: {successful} ({successful/num_requests*100:.1f}%)")
        print(f"  Average response time: {avg_response_time:.0f}ms")
        print(f"  Average confidence: {avg_confidence:.2f}")

# Run load test
asyncio.run(load_test(num_requests=50, concurrent=5))
```

## Monitoring & Observability

### Health Check Implementation

```python
import time
from datetime import datetime, date

class HealthMonitor:
    def __init__(self):
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
        self.response_times = []
    
    def record_request(self, success, response_time):
        """Record request metrics"""
        self.request_count += 1
        if not success:
            self.error_count += 1
        self.response_times.append(response_time)
        
        # Keep only last 1000 response times
        if len(self.response_times) > 1000:
            self.response_times = self.response_times[-1000:]
    
    def get_health_status(self):
        """Get comprehensive health status"""
        uptime = time.time() - self.start_time
        avg_response_time = sum(self.response_times) / len(self.response_times) if self.response_times else 0
        error_rate = self.error_count / self.request_count if self.request_count > 0 else 0
        
        return {
            'status': 'healthy' if error_rate < 0.1 else 'degraded',
            'uptime_seconds': uptime,
            'requests_total': self.request_count,
            'requests_today': self.request_count,  # Simplified
            'error_rate': error_rate,
            'avg_response_time_ms': avg_response_time * 1000,
            'last_request': datetime.utcnow().isoformat()
        }
```

## Security Considerations

### Input Validation
- Base64 validation and sanitization
- Image format verification
- File size enforcement
- Content type checking

### Rate Limiting
- Daily request quotas
- Per-client tracking (if implemented)
- Automatic blocking on abuse

### Data Privacy
- No persistent storage of images
- Hash-only deduplication
- Secure API key management
- Request logging without sensitive data

---

**API Version**: 1.0.0  
**Last Updated**: January 2026  
**Service**: AI Payment Parser Service
