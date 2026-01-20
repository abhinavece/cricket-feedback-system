# Kubernetes Secrets Setup Guide

This guide explains how to set up the required secrets for the Cricket Feedback System deployment.

## Overview

The system requires several secrets for different components:

| Secret Name | Used By | Contains |
|-------------|---------|----------|
| `cricket-secrets` | Backend | MongoDB URI, JWT, Google OAuth, Admin credentials, WhatsApp config |
| `whatsapp-credentials` | Backend | WhatsApp Access Token |
| `ai-service-secrets` | AI Service | Google AI Studio API Key |
| `ocir-creds` | All | OCI Container Registry credentials |

## Creating Secrets Manually

### 1. OCI Container Registry Credentials

```bash
kubectl create secret docker-registry ocir-creds \
  --namespace=cricket-feedback \
  --docker-server=phx.ocir.io \
  --docker-username='axkw6whnjncs/oracleidentitycloudservice/<your-email>' \
  --docker-password='<your-auth-token>' \
  --docker-email='<your-email>'
```

### 2. Cricket Secrets (Main Application)

```bash
kubectl create secret generic cricket-secrets \
  --namespace=cricket-feedback \
  --from-literal=mongodb-uri='mongodb+srv://<user>:<pass>@<cluster>/<db>' \
  --from-literal=jwt-secret='<your-jwt-secret>' \
  --from-literal=google-client-id='<your-google-client-id>' \
  --from-literal=google-client-secret='<your-google-client-secret>' \
  --from-literal=admin-password='<your-admin-password>' \
  --from-literal=whatsapp-phone-number-id='<your-whatsapp-phone-id>' \
  --from-literal=whatsapp-verify-token='<your-whatsapp-verify-token>'
```

### 3. WhatsApp Credentials

```bash
kubectl create secret generic whatsapp-credentials \
  --namespace=cricket-feedback \
  --from-literal=WHATSAPP_ACCESS_TOKEN='<your-whatsapp-access-token>'
```

### 4. AI Service Secrets

```bash
kubectl create secret generic ai-service-secrets \
  --namespace=cricket-feedback \
  --from-literal=google-ai-studio-api-key='<your-google-ai-studio-api-key>'
```

## Verifying Secrets

```bash
# List all secrets in the namespace
kubectl get secrets -n cricket-feedback

# Verify specific secret exists
kubectl get secret cricket-secrets -n cricket-feedback
kubectl get secret whatsapp-credentials -n cricket-feedback
kubectl get secret ai-service-secrets -n cricket-feedback
kubectl get secret ocir-creds -n cricket-feedback
```

## Updating Secrets

To update an existing secret:

```bash
# Delete and recreate
kubectl delete secret ai-service-secrets -n cricket-feedback
kubectl create secret generic ai-service-secrets \
  --namespace=cricket-feedback \
  --from-literal=google-ai-studio-api-key='<new-api-key>'

# Or patch existing
kubectl patch secret ai-service-secrets -n cricket-feedback \
  --type='json' \
  -p='[{"op": "replace", "path": "/data/google-ai-studio-api-key", "value": "'$(echo -n '<new-api-key>' | base64)'"}]'
```

## GitHub Actions Secrets

The following secrets must be configured in GitHub repository settings:

| Secret Name | Description |
|-------------|-------------|
| `OCI_USERNAME` | OCI registry username (`axkw6whnjncs/oracleidentitycloudservice/<email>`) |
| `OCI_PASSWORD` | OCI auth token |
| `KUBECONFIG` | Base64-encoded kubeconfig for cluster access |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (for frontend build) |

### Encoding Kubeconfig

```bash
# Get your kubeconfig and encode it
cat ~/.kube/config | base64 -w 0
```

## Helm-Managed Secrets (Optional)

If you want Helm to manage secrets, enable them in `values.yaml`:

```yaml
secrets:
  enabled: true
  jwtSecret: "your-jwt-secret"
  googleClientId: "your-google-client-id"
  googleClientSecret: "your-google-client-secret"
  superAdminKey: "your-admin-key"
  whatsappAccessToken: "your-whatsapp-token"
  googleAIStudioAPIKey: "your-ai-studio-key"
```

⚠️ **Warning**: Avoid committing secrets to version control. Use external secret management in production.

## Troubleshooting

### Secret Not Found Error

```
Error: secret "ai-service-secrets" not found
```

**Solution**: Create the secret manually before deploying.

### Image Pull Error

```
Failed to pull image: unauthorized
```

**Solution**: Verify `ocir-creds` secret is correct and referenced in deployment.

### Environment Variable Not Set

Check if the secret key matches:
```bash
kubectl get secret ai-service-secrets -n cricket-feedback -o jsonpath='{.data}'
```

## Security Best Practices

1. **Never commit secrets** to version control
2. **Rotate secrets regularly**, especially API keys
3. **Use RBAC** to limit access to secrets
4. **Consider External Secrets Operator** for production
5. **Encrypt etcd** for secrets at rest
