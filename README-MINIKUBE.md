# 🚀 Minikube Local Kubernetes Setup

## 📋 Overview

This guide will help you deploy the Cricket Feedback System on Minikube, which provides a local Kubernetes environment for testing before deploying to production.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   MongoDB       │
│   (Nginx)       │────│   (Node.js)     │────│   Database      │
│   Port: 80      │    │   Port: 5001    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Ingress       │
                    │   (nginx)       │
                    │   Port: 80      │
                    └─────────────────┘
```

## 🛠️ Prerequisites

### Required Software
1. **Minikube**: Local Kubernetes cluster
   ```bash
   # macOS
   brew install minikube
   
   # Linux
   curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube
   
   # Windows
   choco install minikube
   ```

2. **kubectl**: Kubernetes CLI
   ```bash
   # macOS
   brew install kubectl
   
   # Linux
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   
   # Windows
   choco install kubernetes-cli
   ```

3. **Docker**: Container runtime
   ```bash
   # macOS/Windows: Install Docker Desktop
   # Linux: Install Docker Engine
   ```

### System Requirements
- **CPU**: 2+ cores
- **Memory**: 4GB+ RAM
- **Disk**: 8GB+ free space
- **OS**: macOS, Linux, or Windows

## 🚀 Quick Start

### 1. Setup Secrets
```bash
# Update with your actual credentials
cd k8s
./update-secrets.sh
```

### 2. Deploy to Minikube
```bash
# Run the setup script
./minikube-setup.sh
```

### 3. Access the Application
- **Frontend**: http://cricket-feedback.local
- **Backend API**: http://cricket-feedback.local/api
- **Minikube Dashboard**: `minikube dashboard`

## 📁 Kubernetes Manifests

### 📦 Deployments
- **mongodb-deployment.yaml**: MongoDB database
- **backend-deployment.yaml**: Node.js API server
- **frontend-deployment.yaml**: React frontend with Nginx

### 🔧 Configuration
- **secrets.yaml**: Environment variables and secrets
- **mongodb-configmap.yaml**: Database initialization script
- **mongodb-pvc.yaml**: Persistent storage for MongoDB

### 🌐 Networking
- **mongodb-deployment.yaml**: Internal MongoDB service
- **backend-deployment.yaml**: Internal backend service
- **frontend-deployment.yaml**: LoadBalancer for frontend
- **ingress.yaml**: External access routing

## 🛠️ Detailed Setup

### 1. Start Minikube
```bash
# Start with sufficient resources
minikube start --driver=docker --cpus=2 --memory=4096 --disk-size=8g

# Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server
```

### 2. Build Docker Images
```bash
# Set Docker environment to Minikube
eval $(minikube docker-env)

# Build images
docker build -t cricket-feedback-backend:latest ./backend/
docker build -t cricket-feedback-frontend:latest ./frontend/
```

### 3. Deploy Components
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy secrets
kubectl apply -f k8s/secrets.yaml

# Deploy database
kubectl apply -f k8s/mongodb-configmap.yaml
kubectl apply -f k8s/mongodb-pvc.yaml
kubectl apply -f k8s/mongodb-deployment.yaml

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Create ingress
kubectl apply -f k8s/ingress.yaml
```

### 4. Configure Local DNS
```bash
# Add to /etc/hosts (requires sudo)
echo "$(minikube ip) cricket-feedback.local" | sudo tee -a /etc/hosts
```

## 🔍 Monitoring & Debugging

### Check Deployment Status
```bash
# View all pods
kubectl get pods -n cricket-feedback

# View services
kubectl get services -n cricket-feedback

# View ingress
kubectl get ingress -n cricket-feedback

# Real-time monitoring
./k8s/monitoring.sh
```

### View Logs
```bash
# Backend logs
kubectl logs -f deployment/backend -n cricket-feedback

# Frontend logs
kubectl logs -f deployment/frontend -n cricket-feedback

# MongoDB logs
kubectl logs -f deployment/mongodb -n cricket-feedback
```

### Debug Commands
```bash
# Access MongoDB shell
kubectl exec -it deployment/mongodb -n cricket-feedback -- mongo

# Port forward to local
kubectl port-forward service/frontend-service 8080:80 -n cricket-feedback

# Scale deployments
kubectl scale deployment backend --replicas=2 -n cricket-feedback

# Restart deployments
kubectl rollout restart deployment/backend -n cricket-feedback
```

## 🧪 Testing

### Health Checks
```bash
# Backend health
curl http://cricket-feedback.local/api/health

# Frontend access
open http://cricket-feedback.local
```

### Database Access
```bash
# Connect to MongoDB
kubectl exec -it deployment/mongodb -n cricket-feedback -- mongo

# Switch to database
use cricket-feedback

# View collections
show collections

# Check users
db.users.find().limit(5)
```

## 🔧 Configuration

### Environment Variables
Update `k8s/secrets.yaml` with your actual values:

```yaml
data:
  jwt-secret: <base64-encoded-jwt-secret>
  google-client-id: <base64-encoded-google-client-id>
  google-client-secret: <base64-encoded-google-client-secret>
  super-admin-key: <base64-encoded-super-admin-key>
```

### Resource Limits
- **MongoDB**: 512Mi memory, 500m CPU
- **Backend**: 512Mi memory, 500m CPU
- **Frontend**: 256Mi memory, 200m CPU

### Storage
- **MongoDB**: 1Gi persistent volume
- **Type**: standard (Minikube default)

## 🧹 Cleanup

### Remove Deployment
```bash
# Run cleanup script
./k8s/minikube-cleanup.sh

# Or manual cleanup
kubectl delete namespace cricket-feedback
minikube stop
```

### Complete Reset
```bash
# Delete entire Minikube cluster
minikube delete

# Remove /etc/hosts entry
sudo sed -i '' '/cricket-feedback.local/d' /etc/hosts
```

## 🚨 Troubleshooting

### Common Issues

1. **Minikube won't start**
   ```bash
   # Check virtualization
   egrep -c '(vmx|svm)' /proc/cpuinfo
   
   # Try different driver
   minikube start --driver=virtualbox
   ```

2. **Pods stuck in Pending**
   ```bash
   # Check resource usage
   kubectl describe pod <pod-name> -n cricket-feedback
   
   # Check nodes
   kubectl top nodes
   ```

3. **Ingress not working**
   ```bash
   # Check ingress controller
   kubectl get pods -n ingress-nginx
   
   # Check ingress rules
   kubectl describe ingress cricket-feedback-ingress -n cricket-feedback
   ```

4. **Database connection failed**
   ```bash
   # Check MongoDB logs
   kubectl logs deployment/mongodb -n cricket-feedback
   
   # Test connection
   kubectl exec -it deployment/backend -n cricket-feedback -- curl mongodb-service:27017
   ```

### Performance Issues

1. **High memory usage**
   ```bash
   # Check resource usage
   kubectl top pods -n cricket-feedback
   
   # Increase limits
   kubectl edit deployment backend -n cricket-feedback
   ```

2. **Slow response times**
   ```bash
   # Check network
   kubectl exec -it deployment/frontend -n cricket-feedback -- curl -w "@curl-format.txt" backend-service:5001/api/health
   ```

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale backend
kubectl scale deployment backend --replicas=3 -n cricket-feedback

# Scale frontend
kubectl scale deployment frontend --replicas=2 -n cricket-feedback
```

### Vertical Scaling
```bash
# Edit resource limits
kubectl edit deployment backend -n cricket-feedback
```

## 🔄 Development Workflow

### Local Development
```bash
# 1. Make code changes
# 2. Rebuild Docker images
docker build -t cricket-feedback-backend:latest ./backend/
docker build -t cricket-feedback-frontend:latest ./frontend/

# 3. Restart deployments
kubectl rollout restart deployment/backend -n cricket-feedback
kubectl rollout restart deployment/frontend -n cricket-feedback
```

### Hot Reload (Development)
```bash
# Port forward for local development
kubectl port-forward service/backend-service 5001:5001 -n cricket-feedback

# Run backend locally
cd backend
npm install
npm run dev
```

## 🎯 Next Steps

1. **Test all features** in the Minikube environment
2. **Monitor resource usage** and optimize
3. **Test scaling** and failover scenarios
4. **Validate security** configurations
5. **Deploy to production** (GCP/AWS/etc.)

## 📞 Help & Support

- **Minikube Docs**: https://minikube.sigs.k8s.io/docs/
- **Kubernetes Docs**: https://kubernetes.io/docs/
- **Docker Docs**: https://docs.docker.com/

---

**🎉 Your Cricket Feedback System is now running on Minikube!**

Access it at: **http://cricket-feedback.local** 🚀
