#!/bin/sh

# Substitute environment variables in nginx configuration
envsubst '\$REACT_APP_API_URL \$REACT_APP_GOOGLE_CLIENT_ID' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
nginx -g 'daemon off;'
