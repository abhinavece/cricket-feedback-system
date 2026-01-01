# Deployment Guide

## Local Development Setup ✅

The application is now fully functional and running locally:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api
- **Database**: MongoDB (localhost:27017)

## Quick Start Commands

```bash
# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Start development servers
npm run dev
```

## Vercel Deployment 🚀

### Prerequisites
1. Push code to GitHub repository
2. Create MongoDB Atlas database (recommended for production)
3. Vercel account connected to GitHub

### Step-by-Step Deployment

1. **Setup MongoDB Atlas** (if not already done):
   - Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create new cluster
   - Get connection string

2. **Configure Environment Variables in Vercel**:
   - Go to Vercel dashboard → Project Settings → Environment Variables
   - Add: `MONGODB_URI` = your MongoDB connection string

3. **Deploy**:
   - Connect your GitHub repository to Vercel
   - Vercel will automatically detect the `vercel.json` configuration
   - Click "Deploy"

### Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/cricket-feedback` |

### Automatic Configuration

The `vercel.json` file handles:
- Frontend build configuration
- Backend serverless function setup
- API routing (`/api/*` → backend, `/*` → frontend)
- Environment variable mapping

## Production Features

- ✅ **HTTPS** automatically enabled
- ✅ **CDN** for static assets
- ✅ **Serverless Functions** for API
- ✅ **Automatic SSL certificates**
- ✅ **Global deployment** (edge locations)

## Testing Production

After deployment:
1. Visit your Vercel URL
2. Test feedback form submission
3. Navigate to Admin Dashboard
4. Verify data persistence in MongoDB Atlas

## Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **MongoDB Atlas**: Database performance metrics
- **Logs**: Available in Vercel dashboard

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `MONGODB_URI` environment variable
   - Ensure IP whitelist includes Vercel's IP ranges (0.0.0.0/0)

2. **Build Errors**
   - Check `vercel.json` configuration
   - Verify all dependencies are in package.json

3. **API Not Responding**
   - Check server logs in Vercel dashboard
   - Verify API routes are correctly configured

### Support

- Vercel Documentation: https://vercel.com/docs
- MongoDB Atlas Documentation: https://docs.mongodb.com/atlas

## Cost

- **Vercel**: Free tier available (Hobby plan)
- **MongoDB Atlas**: Free tier available (512MB storage)
- **Total**: Can run completely free for small projects
