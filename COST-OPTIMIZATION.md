# 💰 GCP Free Tier Cost Optimization Guide

## 🆓 Free Tier Limits Breakdown

| Service | Free Limit | Monthly Cost After | Usage Tips |
|---------|------------|-------------------|------------|
| **App Engine** | 28 instance-hours/day | ~$45/month | Use F1 instances, scale down |
| **Cloud Build** | 120 build-minutes/day | ~$24/month | Optimize builds, use cache |
| **Cloud Storage** | 5GB standard | ~$0.13/month | Compress assets, clean old builds |
| **Network Egress** | 1GB/day | ~$3.65/month | Minimize API calls, use CDN |
| **MongoDB Atlas** | 512MB storage | FREE forever | Optimize queries, index properly |

## 🎯 Target: $0/Month Deployment

### ✅ What's Covered by Free Tier
- Small application (< 100 users/day)
- 1-2 deployments per week
- Basic CRUD operations
- Static file serving

### ⚠️ What Costs Money
- High traffic (> 100 users/day)
- Large file uploads/downloads
- Frequent deployments
- Background jobs

## 🛠️ Cost Optimization Strategies

### 1. **App Engine Optimization**

```yaml
# Use smallest instance class
instance_class: F1  # 0.6 vCPU, 0.6GB RAM

# Conservative auto-scaling
automatic_scaling:
  min_num_instances: 0  # Scale to 0 when not used
  max_num_instances: 2  # Limit max instances
  cpu_utilization:
    target_utilization: 0.8  # Higher threshold

# Request timeout
automatic_scaling:
  max_concurrent_requests: 10
```

### 2. **Build Optimization**

```dockerfile
# Multi-stage builds to reduce image size
FROM node:18-alpine as build
# ... build steps ...

FROM node:18-alpine
COPY --from=build /app/dist ./dist
# Only copy what's needed
```

### 3. **Database Optimization**

```javascript
// Use indexes effectively
db.feedbacks.createIndex({ "createdAt": -1 });
db.users.createIndex({ "email": 1 });

// Limit data transfer
// Only fetch needed fields
db.users.find({}, { name: 1, email: 1, role: 1 });

// Pagination for large datasets
const page = 1;
const limit = 20;
db.feedbacks.find().skip((page - 1) * limit).limit(limit);
```

### 4. **Frontend Optimization**

```javascript
// Lazy load components
const AdminDashboard = React.lazy(() => import('./AdminDashboard'));

// Code splitting
import('./heavy-component').then(module => {
  // Use component
});

// Optimize bundle size
// Remove unused dependencies
// Use tree shaking
```

## 📊 Usage Monitoring

### Set Up Budget Alerts
```bash
# Create budget alert
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Cricket Feedback Budget" \
  --budget-amount=10USD

# Set alert threshold
gcloud billing budgets update \
  --billing-account=BILLING_ACCOUNT_ID \
  --budget=BUDGET_ID \
  --threshold-rule=percent=90
```

### Monitor Usage
```bash
# Check App Engine usage
gcloud app services describe default

# Check build usage
gcloud builds list --limit=10

# Check storage usage
gsutil du -sh gs://your-project.appspot.com
```

## 🔧 Specific Optimizations

### 1. **Reduce Build Time**
```bash
# Use .dockerignore
node_modules
.git
*.log

# Leverage build cache
gcloud builds submit --tag gcr.io/project/app --timeout=600
```

### 2. **Minimize Network Usage**
```javascript
// Implement caching
const cache = new Map();
function getCachedData(key) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  // Fetch data
  const data = await fetchData(key);
  cache.set(key, data);
  return data;
}

// Batch API calls
const batchRequests = requests.map(req => 
  fetch(req.url, req.options)
);
const responses = await Promise.all(batchRequests);
```

### 3. **Optimize Images**
```javascript
// Use WebP format
<img src="image.webp" alt="..." />

// Lazy load images
<img loading="lazy" src="image.jpg" alt="..." />

// Responsive images
<img src="image-small.jpg" 
     srcset="image-medium.jpg 1000w, image-large.jpg 2000w"
     alt="..." />
```

## 📈 Scaling Strategy

### Phase 1: Free Tier (0-50 users)
- F1 instance
- MongoDB Atlas M0
- Manual deployments
- Basic monitoring

### Phase 2: Growth Phase (50-200 users)
- F2 instances (if needed)
- Implement caching
- Automated deployments
- Enhanced monitoring

### Phase 3: Production Phase (200+ users)
- Consider paid plan
- Load balancing
- CDN implementation
- Advanced monitoring

## 🚨 Cost Alerts Setup

### 1. **GCP Budget Alerts**
```bash
# Set $5/month budget
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ID \
  --display-name="Monthly Budget" \
  --budget-amount=5USD

# Alert at 80%
gcloud billing budgets update \
  --billing-account=YOUR_BILLING_ID \
  --budget=BUDGET_ID \
  --threshold-rule=percent=80
```

### 2. **Custom Metrics**
```javascript
// Track API usage
const apiUsage = {
  requests: 0,
  dataTransferred: 0,
  errors: 0
};

// Log usage
function logUsage(endpoint, dataSize) {
  apiUsage.requests++;
  apiUsage.dataTransferred += dataSize;
  
  // Alert if approaching limits
  if (apiUsage.dataTransferred > 800 * 1024 * 1024) { // 800MB
    console.warn('Approaching data transfer limit');
  }
}
```

## 🎯 Success Metrics

### Free Tier Success Indicators:
- ✅ Monthly bill: $0
- ✅ App uptime: >95%
- ✅ Response time: <2s
- ✅ Build time: <5 minutes
- ✅ Storage usage: <4GB

### When to Upgrade:
- ❌ Monthly bill: >$10
- ❌ Response time: >5s
- ❌ Build failures: >2/week
- ❌ Storage usage: >4.5GB

## 💡 Pro Tips

1. **Use Cloud Functions** for background tasks
2. **Implement Redis** for caching (if needed)
3. **Use CDN** for static assets
4. **Compress all responses** with gzip
5. **Monitor daily** to stay within limits

## 🔄 Monthly Checklist

- [ ] Check billing dashboard
- [ ] Review usage metrics
- [ ] Clean up old builds
- [ ] Optimize database queries
- [ ] Update dependencies
- [ ] Review security settings

## 📞 Emergency Actions

If approaching limits:
1. **Scale down** instances
2. **Enable caching**
3. **Optimize queries**
4. **Compress assets**
5. **Temporarily disable features**

Remember: The free tier is generous but requires careful monitoring! 🎯
