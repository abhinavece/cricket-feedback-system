# Docker Deployment Guide

## 🐳 Docker Images

The AI Payment Parser Service provides two Docker images:

### Development Image (`Dockerfile`)
- **Purpose**: Development and testing
- **Size**: ~331MB
- **Features**: Full source code, debugging capabilities
- **Usage**: `docker build -t ai-payment-parser:dev .`

### Production Image (`Dockerfile.prod`)
- **Purpose**: Production deployment
- **Size**: ~280MB (optimized)
- **Features**: Multi-stage build, minimal footprint
- **Usage**: `docker build -f Dockerfile.prod -t ai-payment-parser:latest .`

## 🚀 Quick Start

### 1. Development Setup

```bash
# Clone repository
git clone <repository-url>
cd ai-service

# Set environment variables
export GOOGLE_AI_STUDIO_API_KEY="your-api-key"

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

### 2. Production Deployment

```bash
# Build production image
docker build -f Dockerfile.prod -t ai-payment-parser:latest .

# Run with environment variables
docker run -d \
  --name ai-payment-parser \
  -p 8010:8010 \
  -e GOOGLE_AI_STUDIO_API_KEY="your-api-key" \
  -e AI_SERVICE_ENABLED=true \
  -e DAILY_REQUEST_LIMIT=1000 \
  ai-payment-parser:latest
```

## 📋 Environment Variables

### Required Variables
```bash
GOOGLE_AI_STUDIO_API_KEY=your_google_ai_studio_api_key
```

### Optional Variables
```bash
AI_SERVICE_ENABLED=true                    # Enable/disable service
AI_PROVIDER=google_ai_studio             # AI provider to use
DAILY_REQUEST_LIMIT=500                   # Daily request quota
LOG_LEVEL=INFO                           # Logging level
MIN_CONFIDENCE_THRESHOLD=0.7             # Minimum confidence threshold
BACKEND_CALLBACK_URL=http://backend:5001 # Backend service URL
```

## 🔧 Docker Compose

### Development Compose (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  ai-payment-parser:
    build: .
    container_name: ai-payment-parser
    ports:
      - "8010:8010"
    environment:
      - AI_SERVICE_ENABLED=true
      - GOOGLE_AI_STUDIO_API_KEY=${GOOGLE_AI_STUDIO_API_KEY}
      - DAILY_REQUEST_LIMIT=500
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8010/"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ai-network

networks:
  ai-network:
    driver: bridge
```

### Production Compose (`docker-compose.prod.yml`)
```yaml
version: '3.8'

services:
  ai-payment-parser:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: ai-payment-parser-prod
    ports:
      - "8010:8010"
    environment:
      - AI_SERVICE_ENABLED=true
      - GOOGLE_AI_STUDIO_API_KEY=${GOOGLE_AI_STUDIO_API_KEY}
      - DAILY_REQUEST_LIMIT=1000
      - LOG_LEVEL=WARNING
    restart: always
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8010/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - ai-network

networks:
  ai-network:
    driver: bridge
```

## 🧪 Testing Docker Setup

### Automated Testing
```bash
# Run comprehensive Docker test
./test-docker.sh
```

### Manual Testing
```bash
# Build image
docker build -t ai-payment-parser:test .

# Run container
docker run -d --name test-container \
  -p 8010:8010 \
  -e AI_SERVICE_ENABLED=true \
  ai-payment-parser:test

# Test endpoints
curl http://localhost:8010/health
curl http://localhost:8010/status
curl http://localhost:8010/

# Test payment parsing
curl -X POST http://localhost:8010/parse-payment \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "...", "match_date": "2024-01-15T00:00:00Z"}'

# Cleanup
docker stop test-container
docker rm test-container
```

## 📊 Container Monitoring

### Health Checks
```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Detailed health status
docker inspect ai-payment-parser --format='{{json .State.Health}}'
```

### Resource Usage
```bash
# Real-time stats
docker stats ai-payment-parser

# One-time stats
docker stats --no-stream ai-payment-parser
```

### Logs
```bash
# Follow logs
docker logs -f ai-payment-parser

# Last 100 lines
docker logs --tail 100 ai-payment-parser

# Logs with timestamps
docker logs -t ai-payment-parser
```

## 🔒 Security Considerations

### Non-Root User
The container runs as `appuser` (non-root) for security:
```dockerfile
RUN adduser --disabled-password --gecos '' appuser
USER appuser
```

### Minimal Attack Surface
- **Base Image**: Python 3.12-slim (minimal OS)
- **Installed Packages**: Only essential dependencies
- **No Shell Access**: Container runs application directly

### Secrets Management
```bash
# Use Docker secrets (Swarm mode)
echo "your-api-key" | docker secret create google_ai_key -

# Use environment files
docker run --env-file .env ai-payment-parser:latest
```

## 🚀 Production Deployment

### 1. Single Host Deployment
```bash
# Pull image
docker pull your-registry/ai-payment-parser:latest

# Run with production settings
docker run -d \
  --name ai-payment-parser \
  --restart=always \
  -p 8010:8010 \
  --env-file .env.prod \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  your-registry/ai-payment-parser:latest
```

### 2. Docker Swarm Deployment
```yaml
# deploy.yml
version: '3.8'

services:
  ai-payment-parser:
    image: your-registry/ai-payment-parser:latest
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    ports:
      - "8010:8010"
    secrets:
      - google_ai_key
    environment:
      - AI_SERVICE_ENABLED=true
      - DAILY_REQUEST_LIMIT=1000

secrets:
  google_ai_key:
    external: true
```

Deploy with:
```bash
docker stack deploy -c deploy.yml ai-payment-stack
```

### 3. Kubernetes Deployment
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-payment-parser
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-payment-parser
  template:
    metadata:
      labels:
        app: ai-payment-parser
    spec:
      containers:
      - name: ai-payment-parser
        image: your-registry/ai-payment-parser:latest
        ports:
        - containerPort: 8010
        env:
        - name: GOOGLE_AI_STUDIO_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: google-api-key
        - name: AI_SERVICE_ENABLED
          value: "true"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 8010
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 8010
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ai-payment-parser-service
spec:
  selector:
    app: ai-payment-parser
  ports:
  - port: 8010
    targetPort: 8010
  type: ClusterIP
```

## 🔧 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker logs ai-payment-parser

# Common causes:
# - Missing API key
# - Port already in use
# - Insufficient memory
```

#### Health Check Failing
```bash
# Test health endpoint manually
docker exec ai-payment-parser curl -f http://localhost:8010/

# Check if service is listening
docker exec ai-payment-parser netstat -tlnp
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats ai-payment-parser

# Check for memory leaks
docker exec ai-payment-parser ps aux
```

### Debug Commands
```bash
# Enter container for debugging
docker exec -it ai-payment-parser /bin/bash

# Check Python processes
docker exec ai-payment-parser ps aux | grep python

# Test API from inside container
docker exec ai-payment-parser curl http://localhost:8010/health
```

## 📈 Performance Optimization

### Image Size Optimization
- **Multi-stage builds**: Separate build and runtime environments
- **Minimal base images**: Use slim variants
- **Layer caching**: Copy requirements first
- **.dockerignore**: Exclude unnecessary files

### Runtime Optimization
- **Worker processes**: Use multiple workers for CPU-bound tasks
- **Memory limits**: Set appropriate memory constraints
- **Health checks**: Implement proper health monitoring
- **Graceful shutdown**: Handle SIGTERM properly

### Resource Limits
```yaml
# docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
    reservations:
      memory: 256M
      cpus: '0.25'
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker image
      run: |
        docker build -f Dockerfile.prod -t ai-payment-parser:${{ github.sha }} .
        docker tag ai-payment-parser:${{ github.sha }} ai-payment-parser:latest
    
    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push ai-payment-parser:${{ github.sha }}
        docker push ai-payment-parser:latest
```

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Docker**: Production Ready
