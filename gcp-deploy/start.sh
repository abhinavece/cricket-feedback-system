#!/bin/sh

# Start MongoDB (if running locally, for GCP we'll use MongoDB Atlas)
echo "Starting application..."

# Start backend server
cd /app/backend
export NODE_ENV=production
export PORT=5001

# Start nginx in background
nginx -c /etc/nginx/nginx.conf &

# Start Node.js backend
node index.js
