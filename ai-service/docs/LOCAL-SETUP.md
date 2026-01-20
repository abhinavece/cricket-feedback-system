# Running AI Service Locally

## Quick Start

### Option 1: Using the Script (Recommended)

```bash
cd ai-service
./run-local.sh
```

The script will:
- Create a virtual environment if needed
- Install dependencies
- Set environment variables
- Start the service on http://localhost:8000

### Option 2: Manual Setup

1. **Create virtual environment:**
```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set environment variables:**
```bash
export GOOGLE_AI_STUDIO_API_KEY="AIzaSyCDhD-bx8zcbdPPcTmtaKOz3wdBFQP4-tE"
export AI_SERVICE_ENABLED="true"
export AI_PROVIDER="google_ai_studio"
export DAILY_REQUEST_LIMIT="500"
export MIN_CONFIDENCE_THRESHOLD="0.7"
export LOG_LEVEL="INFO"
```

4. **Run the service:**
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Using .env File

1. Copy the example file:
```bash
cp .env.example .env
```

2. Edit `.env` with your values:
```bash
GOOGLE_AI_STUDIO_API_KEY=AIzaSyCDhD-bx8zcbdPPcTmtaKOz3wdBFQP4-tE
AI_SERVICE_ENABLED=true
AI_PROVIDER=google_ai_studio
```

3. Load and run:
```bash
export $(cat .env | xargs)
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Testing the Service

### Health Check
```bash
curl http://localhost:8000/health
```

### Status
```bash
curl http://localhost:8000/status
```

### Parse Payment Screenshot
```bash
# Convert image to base64 first
IMAGE_BASE64=$(base64 -i path/to/payment-screenshot.jpg)

curl -X POST http://localhost:8000/parse-payment \
  -H "Content-Type: application/json" \
  -d "{
    \"image_base64\": \"${IMAGE_BASE64}\",
    \"match_date\": \"2024-01-15T00:00:00Z\"
  }"
```

### API Documentation
Visit http://localhost:8000/docs for interactive API documentation.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_SERVICE_ENABLED` | `true` | Master kill switch |
| `AI_PROVIDER` | `google_ai_studio` | AI provider to use |
| `GOOGLE_AI_STUDIO_API_KEY` | - | **Required** - API key from Google AI Studio |
| `DAILY_REQUEST_LIMIT` | `500` | Max requests per day |
| `MIN_CONFIDENCE_THRESHOLD` | `0.7` | Minimum confidence (0.0-1.0) |
| `LOG_LEVEL` | `INFO` | Logging level |
| `BACKEND_CALLBACK_URL` | `http://localhost:5001` | Backend service URL |

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Module Not Found
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### API Key Issues
- Verify your API key is correct
- Check if the key has proper permissions
- Ensure you're using a free tier model

### Connection Refused
- Make sure the service is running
- Check if firewall is blocking port 8000
- Verify the service started without errors
