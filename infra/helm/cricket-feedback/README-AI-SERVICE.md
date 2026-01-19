# AI Service Helm Chart Configuration

The AI Service has been added to the Helm chart for easy deployment alongside the backend and frontend services.

## Configuration

### Basic Configuration

The AI service is configured in `values.yaml`:

```yaml
aiService:
  enabled: true
  image:
    registry: phx.ocir.io
    repository: axkw6whnjncs/cricket-feedback-ai-service
    tag: "v1"
    pullPolicy: IfNotPresent
  replicaCount: 1
  service:
    type: ClusterIP
    port: 8000
    targetPort: 8000
```

### Environment Variables

Key environment variables:

- `AI_SERVICE_ENABLED`: Master kill switch (default: "true")
- `AI_PROVIDER`: AI provider to use (default: "google_ai_studio")
- `GOOGLE_AI_STUDIO_API_KEY`: API key from Google AI Studio (from secret)
- `DAILY_REQUEST_LIMIT`: Max requests per day (default: "500")
- `MIN_CONFIDENCE_THRESHOLD`: Minimum confidence for auto-accept (default: "0.7")

### Secrets

The AI service requires a secret `ai-service-secrets` with the Google AI Studio API key:

```bash
# Create the secret manually
kubectl create secret generic ai-service-secrets \
  --from-literal=google-ai-studio-api-key=YOUR_API_KEY \
  -n cricket-feedback

# Or use Helm secrets (if enabled)
helm upgrade --install cricket-feedback ./infra/helm/cricket-feedback \
  --set secrets.enabled=true \
  --set secrets.googleAIStudioAPIKey=YOUR_API_KEY \
  -f values-production.yaml
```

### Backend Integration

The backend automatically gets the `AI_SERVICE_URL` environment variable set to point to the AI service when `aiService.enabled` is true. The URL is dynamically generated based on the Helm release name.

## Deployment

### Development

```bash
helm upgrade --install cricket-feedback ./infra/helm/cricket-feedback \
  -f values-development.yaml \
  -n cricket-feedback
```

### Production

```bash
helm upgrade --install cricket-feedback ./infra/helm/cricket-feedback \
  -f values-production.yaml \
  -n cricket-feedback \
  --set secrets.googleAIStudioAPIKey=YOUR_API_KEY
```

## Disabling the AI Service

To disable the AI service:

```yaml
aiService:
  enabled: false
```

When disabled, the backend will fall back to manual admin entry for payment screenshots.

## Updating the AI Service

To update the AI service image:

```bash
helm upgrade cricket-feedback ./infra/helm/cricket-feedback \
  -f values-production.yaml \
  --set aiService.image.tag=v2 \
  -n cricket-feedback
```

## Monitoring

Check AI service status:

```bash
# Get pods
kubectl get pods -l app=cricket-feedback-ai-service -n cricket-feedback

# View logs
kubectl logs -f deployment/cricket-feedback-ai-service -n cricket-feedback

# Check service status
kubectl exec -it deployment/cricket-feedback-ai-service -n cricket-feedback -- curl http://localhost:8000/status
```

## Troubleshooting

### AI Service Not Starting

1. Check if the secret exists:
   ```bash
   kubectl get secret ai-service-secrets -n cricket-feedback
   ```

2. Verify the API key is set:
   ```bash
   kubectl get secret ai-service-secrets -n cricket-feedback -o jsonpath='{.data.google-ai-studio-api-key}' | base64 -d
   ```

3. Check pod logs:
   ```bash
   kubectl logs deployment/cricket-feedback-ai-service -n cricket-feedback
   ```

### Backend Can't Connect to AI Service

1. Verify the service exists:
   ```bash
   kubectl get svc -n cricket-feedback | grep ai-service
   ```

2. Check the AI_SERVICE_URL in backend:
   ```bash
   kubectl exec deployment/cricket-feedback-backend -n cricket-feedback -- env | grep AI_SERVICE_URL
   ```

3. Test connectivity from backend pod:
   ```bash
   kubectl exec deployment/cricket-feedback-backend -n cricket-feedback -- curl http://cricket-feedback-ai-service:8000/health
   ```
