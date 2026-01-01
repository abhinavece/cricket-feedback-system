# Multi-stage build for GCP deployment
FROM node:18-alpine as backend-build

WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

COPY backend/ ./backend/
COPY mongo-init.js ./

# Build frontend
FROM node:18-alpine as frontend-build

WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Final production image
FROM node:18-alpine

# Install nginx and other utilities
RUN apk add --no-cache nginx

# Copy backend
WORKDIR /app
COPY --from=backend-build /app/backend ./backend
COPY --from=backend-build /app/mongo-init.js ./

# Copy frontend build
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Copy nginx configuration
COPY gcp-deploy/nginx.conf /etc/nginx/nginx.conf

# Create startup script
COPY gcp-deploy/start.sh /start.sh
RUN chmod +x /start.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose ports
EXPOSE 8080 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node backend/healthcheck.js

# Start the application
CMD ["/start.sh"]
