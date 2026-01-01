# 🚀 Cricket Feedback System - GCP Deployment Guide

## 📋 Overview

This guide will help you deploy the Cricket Feedback System on Google Cloud Platform (GCP) using the free tier.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   MongoDB Atlas │
│   (Nginx)       │────│   (Node.js)     │────│   (Database)    │
│   Port: 80      │    │   Port: 5001    │    │   Free Tier     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Google OAuth   │
                    │  Authentication │
                    └─────────────────┘
```

## 🆓 Free Tier Limits (GCP)

| Service | Free Tier Limit | Cost After Limit |
|---------|----------------|------------------|
| App Engine | 28 instance-hours/day | ~$0.05/hour |
| Cloud Build | 120 build-minutes/day | ~$0.008/minute |
| Cloud Storage | 5GB standard | ~$0.026/GB/month |
| Egress | 1GB/day | ~$0.12/GB |
| MongoDB Atlas | 512MB storage | Free forever |

## 🛠️ Prerequisites

1. **GCP Account**: Create a free account at https://console.cloud.google.com
2. **gcloud CLI**: Install and authenticate
   ```bash
   curl https://sdk.cloud.google.com | bash
   gcloud auth login
   ```
3. **MongoDB Atlas**: Free account at https://www.mongodb.com/cloud/atlas
4. **Google OAuth**: Get credentials at https://console.cloud.google.com/apis/credentials

## 📦 Quick Deploy

### 1. Clone and Setup
```bash
git clone <your-repo>
cd survey-project
cp .env.example .env
# Edit .env with your credentials
```

### 2. Run Deployment Script
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Manual Steps
The script will guide you through:
- Creating GCP project
- Enabling APIs
- Setting up MongoDB Atlas
- Deploying the application

## 🔧 Configuration

### Environment Variables

Set these in GCP Console → App Engine → Settings → Environment Variables:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/cricket-feedback

# Backend
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SUPER_ADMIN_KEY=super-admin-setup-key-2024

# Frontend
REACT_APP_API_URL=https://your-project.appspot.com/api
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create new OAuth 2.0 Client ID
3. Add authorized JavaScript origins:
   - `https://your-project.appspot.com`
   - `http://localhost:3000` (for local development)
4. Add authorized redirect URIs:
   - `https://your-project.appspot.com`

### MongoDB Atlas Setup

1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create new cluster (M0 free tier)
3. Create database user
4. Add your IP to whitelist (0.0.0.0/0 for GCP)
5. Get connection string

## 🚀 Deployment Methods

### Method 1: App Engine (Recommended)
```bash
# Deploy to App Engine
gcloud app deploy gcp-deploy/app.yaml --project=your-project-id
```

### Method 2: Cloud Run
```bash
# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/your-project-id/cricket-feedback
gcloud run deploy cricket-feedback --image gcr.io/your-project-id/cricket-feedback --platform managed
```

### Method 3: Local Docker
```bash
# Test locally
docker-compose up -d

# Build for production
docker build -f gcp-deploy/Dockerfile -t cricket-feedback .
```

## 📊 Monitoring & Costs

### Monitoring Commands
```bash
# Check app status
gcloud app logs tail -s default

# Monitor costs
gcloud billing accounts list

# Check usage
gcloud app services describe default
```

### Cost Optimization Tips

1. **Minimize Build Time**: Use Cloud Build cache
2. **Scale Down**: Use F1 instance class for low traffic
3. **Optimize Images**: Use multi-stage builds
4. **Monitor Egress**: Keep data transfer under 1GB/day

## 🔒 Security

1. **Environment Variables**: Never commit secrets to git
2. **HTTPS**: App Engine provides automatic SSL
3. **Firewall**: Use GCP firewall rules
4. **IAM**: Use least privilege principle

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails**: Check Dockerfile and dependencies
2. **Database Connection**: Verify MongoDB Atlas whitelist
3. **OAuth Error**: Check redirect URIs and origins
4. **404 Errors**: Verify API routing in nginx.conf

### Debug Commands
```bash
# Check logs
gcloud app logs tail -s default

# SSH into instance
gcloud app instances ssh

# Check health
curl https://your-project.appspot.com/api/health
```

## 📈 Scaling

### When to Scale Up
- Daily active users > 100
- Response time > 2 seconds
- Memory usage > 70%

### Scaling Options
```yaml
# In app.yaml
automatic_scaling:
  min_num_instances: 1
  max_num_instances: 10
  cpu_utilization:
    target_utilization: 0.65
```

## 🔄 Updates

### Deploy Updates
```bash
# Deploy new version
gcloud app deploy --version=v2

# Promote to production
gcloud app services set-traffic default --splits=v2=1

# Rollback if needed
gcloud app services set-traffic default --splits=v1=1
```

## 💡 Pro Tips

1. **Use Custom Domain**: Set up custom domain with SSL
2. **CDN**: Use Cloud CDN for static assets
3. **Backups**: Enable automated backups
4. **Alerts**: Set up budget alerts
5. **Monitoring**: Use Cloud Monitoring

## 📞 Support

- **GCP Documentation**: https://cloud.google.com/docs
- **MongoDB Atlas**: https://docs.mongodb.com/atlas
- **Google OAuth**: https://developers.google.com/identity

## 🎉 Success!

Your Cricket Feedback System is now live on GCP! 🚀

**URL**: https://your-project.appspot.com
**Admin**: https://your-project.appspot.com/admin
**Cost**: ~$0/month (within free tier)
