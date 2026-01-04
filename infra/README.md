# Mavericks XI Cricket Feedback System - Helm Deployment

This directory contains the Helm chart for deploying the Mavericks XI Cricket Feedback System to Kubernetes.

## 📁 Structure

```
infra/
├── helm/
│   └── cricket-feedback/
│       ├── Chart.yaml                 # Chart metadata
│       ├── values.yaml               # Default values
│       ├── values-development.yaml    # Development overrides
│       ├── values-production.yaml     # Production overrides
│       └── templates/
│           ├── _helpers.tpl           # Template helpers
│           ├── namespace.yaml         # Namespace
│           ├── secrets.yaml           # Kubernetes secrets
│           ├── backend-deployment.yaml # Backend deployment
│           ├── backend-service.yaml   # Backend service
│           ├── frontend-deployment.yaml # Frontend deployment
│           ├── frontend-service.yaml   # Frontend service
│           └── ingress.yaml           # Ingress configuration
├── deploy.sh                         # Deployment script
└── README.md                         # This file
```

## 🚀 Quick Start

### Prerequisites

- Kubernetes cluster (OCI OKE, minikube, etc.)
- Helm 3.x installed
- kubectl configured
- Docker registry access (OCI Container Registry)

### 1. Setup Namespace and Secrets

```bash
# Create namespace
kubectl create namespace cricket-feedback

# Create image pull secret for OCI
kubectl create secret docker-registry ocir-creds \
  --docker-server=phx.ocir.io \
  --docker-username=<oci-username> \
  --docker-password=<oci-auth-token> \
  --namespace=cricket-feedback
```

### 2. Deploy Using Script

```bash
# Deploy to development environment
./infra/deploy.sh development deploy

# Deploy to production environment
./infra/deploy.sh production deploy

# Check deployment status
./infra/deploy.sh development status

# View logs
./infra/deploy.sh development logs backend
./infra/deploy.sh development logs frontend
./infra/deploy.sh development logs mongodb
```

### 3. Deploy Using Helm Commands

```bash
# Add Bitnami repository for MongoDB
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install/upgrade to development
helm upgrade --install cricket-feedback ./infra/helm/cricket-feedback \
  --namespace cricket-feedback \
  --create-namespace \
  --values ./infra/helm/cricket-feedback/values.yaml \
  --values ./infra/helm/cricket-feedback/values-development.yaml

# Install/upgrade to production
helm upgrade --install cricket-feedback ./infra/helm/cricket-feedback \
  --namespace cricket-feedback \
  --create-namespace \
  --values ./infra/helm/cricket-feedback/values.yaml \
  --values ./infra/helm/cricket-feedback/values-production.yaml
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `PORT` | Backend port | `5001` |
| `MONGODB_URI` | MongoDB connection string | From secret |
| `JWT_SECRET` | JWT signing secret | From secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From secret |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From secret |
| `ADMIN_PASSWORD` | Admin dashboard password | From secret |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp API access token | From secret |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number ID | From secret |

### Secrets Management

The chart uses Kubernetes secrets for sensitive data. Update the values in `values.yaml` or use `--set`:

```bash
# Override secrets during deployment
helm upgrade --install cricket-feedback ./infra/helm/cricket-feedback \
  --namespace cricket-feedback \
  --set secrets.data.mongodb-uri="base64-encoded-mongo-uri" \
  --set secrets.data.jwt-secret="base64-encoded-jwt-secret" \
  --set secrets.data.google-client-id="base64-encoded-google-client-id"
```

### Image Configuration

```yaml
backend:
  image:
    registry: phx.ocir.io
    repository: axkw6whnjncs/cricket-feedback-backend
    tag: "v15"

frontend:
  image:
    registry: phx.ocir.io
    repository: axkw6whnjncs/cricket-feedback-frontend
    tag: "v10"
```

## 🌐 Accessing the Application

After deployment, access the application via the configured ingress host:

- **Development**: `http://129.153.86.8.sslip.io`
- **Production**: `https://cricket.mavericksxi.com`

### API Endpoints

- Frontend: `http://<ingress-host>/`
- Backend API: `http://<ingress-host>/api/`
- Health Check: `http://<ingress-host>/api/health`

## 🔧 Management Commands

### Scale Deployments

```bash
# Scale backend
kubectl scale deployment cricket-feedback-backend --replicas=3 -n cricket-feedback

# Scale frontend
kubectl scale deployment cricket-feedback-frontend --replicas=2 -n cricket-feedback
```

### Rolling Updates

```bash
# Update backend image
helm upgrade cricket-feedback ./infra/helm/cricket-feedback \
  --namespace cricket-feedback \
  --set backend.image.tag="v16" \
  --values ./infra/helm/cricket-feedback/values-development.yaml

# Update frontend image
helm upgrade cricket-feedback ./infra/helm/cricket-feedback \
  --namespace cricket-feedback \
  --set frontend.image.tag="v11" \
  --values ./infra/helm/cricket-feedback/values-development.yaml
```

### Debugging

```bash
# Check pods
kubectl get pods -n cricket-feedback

# Check services
kubectl get services -n cricket-feedback

# Check ingress
kubectl get ingress -n cricket-feedback

# Describe pod
kubectl describe pod <pod-name> -n cricket-feedback

# Port forward for local testing
kubectl port-forward service/cricket-feedback-backend-service 5001:5001 -n cricket-feedback
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production
on:
  push:
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure kubectl
        uses: azure/k8s-set-context@v1
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
      
      - name: Deploy with Helm
        run: |
          ./infra/deploy.sh production deploy
```

## 📊 Monitoring

### Health Checks

The application includes health checks:

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: http
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: http
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Logging

```bash
# View all logs
kubectl logs -n cricket-feedback -l app.kubernetes.io/instance=cricket-feedback

# View specific component logs
kubectl logs -n cricket-feedback -l app.kubernetes.io/name=cricket-feedback-backend --tail=100 -f
```

## 🔒 Security Considerations

1. **Secrets Management**: Use sealed secrets or external secret management
2. **Network Policies**: Implement network policies for pod communication
3. **RBAC**: Configure proper role-based access control
4. **TLS**: Enable TLS for production deployments
5. **Image Security**: Use signed images and vulnerability scanning

## 🚨 Troubleshooting

### Common Issues

1. **Image Pull Errors**: Check image pull secrets and registry access
2. **MongoDB Connection**: Verify MongoDB URI and credentials
3. **Ingress Issues**: Check ingress controller and DNS configuration
4. **Resource Limits**: Adjust CPU/memory limits if needed

### Reset Deployment

```bash
# Uninstall completely
./infra/deploy.sh development uninstall

# Clean up PVCs (optional)
kubectl delete pvc --all -n cricket-feedback

# Reinstall
./infra/deploy.sh development deploy
```

## 📝 Development

### Local Development with Minikube

```bash
# Start minikube
minikube start

# Enable ingress
minikube addons enable ingress

# Deploy
./infra/deploy.sh development deploy

# Get ingress IP
minikube ip
```

### Testing Changes

```bash
# Dry run deployment
helm upgrade --install cricket-feedback ./infra/helm/cricket-feedback \
  --namespace cricket-feedback \
  --dry-run --debug \
  --values ./infra/helm/cricket-feedback/values-development.yaml

# Template rendering
helm template cricket-feedback ./infra/helm/cricket-feedback \
  --values ./infra/helm/cricket-feedback/values-development.yaml
```

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review Kubernetes events: `kubectl get events -n cricket-feedback`
- Verify Helm release: `helm status cricket-feedback -n cricket-feedback`
