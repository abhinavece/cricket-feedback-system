#!/bin/bash
# Setup GCP infrastructure for tournament.cricsmart.in
# This script creates all necessary GCP resources for the tournament frontend
#
# Prerequisites:
# - gcloud CLI installed and authenticated
# - Project set to 'cricsmart'
# - Appropriate IAM permissions
#
# Usage: ./setup-tournament-infrastructure.sh

set -e

PROJECT_ID="cricsmart"
REGION="asia-south1"
SERVICE_NAME="cricsmart-tournament-frontend"
STATIC_IP="136.110.208.131"  # Existing load balancer IP
NEG_NAME="cricsmart-neg-tournament"
BACKEND_SERVICE_NAME="cricsmart-backend-tournament"

echo "=== Setting up Tournament Infrastructure ==="
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo ""

# Ensure correct project
gcloud config set project ${PROJECT_ID}

# =====================================================
# Step 1: Create DNS record for tournament.cricsmart.in
# =====================================================
echo "Step 1: Creating DNS record for tournament.cricsmart.in..."

# Check if record exists
if gcloud dns record-sets describe tournament.cricsmart.in --zone=cricsmart-zone --type=A &>/dev/null; then
  echo "  DNS record already exists"
else
  echo "  Creating A record pointing to ${STATIC_IP}..."
  gcloud dns record-sets create tournament.cricsmart.in \
    --zone=cricsmart-zone \
    --type=A \
    --ttl=300 \
    --rrdatas=${STATIC_IP}
  echo "  DNS record created"
fi

echo ""

# =====================================================
# Step 2: Deploy initial Cloud Run service
# =====================================================
echo "Step 2: Checking Cloud Run service..."

if gcloud run services describe ${SERVICE_NAME} --region=${REGION} &>/dev/null; then
  echo "  Cloud Run service already exists"
else
  echo "  Creating placeholder Cloud Run service..."
  # Create a minimal nginx deployment as placeholder
  gcloud run deploy ${SERVICE_NAME} \
    --region=${REGION} \
    --image=nginx:alpine \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --memory=256Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --concurrency=80
  echo "  Cloud Run service created (placeholder)"
fi

echo ""

# =====================================================
# Step 3: Create Serverless NEG for Cloud Run
# =====================================================
echo "Step 3: Creating Serverless NEG..."

if gcloud compute network-endpoint-groups describe ${NEG_NAME} --region=${REGION} &>/dev/null; then
  echo "  NEG already exists"
else
  echo "  Creating NEG for ${SERVICE_NAME}..."
  gcloud compute network-endpoint-groups create ${NEG_NAME} \
    --region=${REGION} \
    --network-endpoint-type=serverless \
    --cloud-run-service=${SERVICE_NAME}
  echo "  NEG created"
fi

echo ""

# =====================================================
# Step 4: Create Backend Service
# =====================================================
echo "Step 4: Creating Backend Service..."

if gcloud compute backend-services describe ${BACKEND_SERVICE_NAME} --global &>/dev/null; then
  echo "  Backend service already exists"
else
  echo "  Creating backend service..."
  gcloud compute backend-services create ${BACKEND_SERVICE_NAME} \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --protocol=HTTPS

  echo "  Adding NEG to backend service..."
  gcloud compute backend-services add-backend ${BACKEND_SERVICE_NAME} \
    --global \
    --network-endpoint-group=${NEG_NAME} \
    --network-endpoint-group-region=${REGION}

  echo "  Backend service created"
fi

echo ""

# =====================================================
# Step 5: Update SSL Certificate
# =====================================================
echo "Step 5: Checking SSL certificate..."
CERT_NAME="cricsmart-ssl-v2"

# Get current domains
CURRENT_DOMAINS=$(gcloud compute ssl-certificates describe ${CERT_NAME} --global --format='value(managed.domains)' 2>/dev/null || echo "")

if echo "${CURRENT_DOMAINS}" | grep -q "tournament.cricsmart.in"; then
  echo "  tournament.cricsmart.in already in certificate"
else
  echo "  Adding tournament.cricsmart.in to SSL certificate..."
  echo "  NOTE: SSL certificate update requires recreating the certificate."
  echo "        This is a manual step - please update the certificate domains to include:"
  echo "        - app.cricsmart.in"
  echo "        - cricsmart.in"
  echo "        - www.cricsmart.in"
  echo "        - tournament.cricsmart.in"
  echo ""
  echo "  Run this command manually:"
  echo "  gcloud compute ssl-certificates create cricsmart-ssl-v3 \\"
  echo "    --domains=app.cricsmart.in,cricsmart.in,www.cricsmart.in,tournament.cricsmart.in \\"
  echo "    --global"
  echo ""
  echo "  Then update the HTTPS proxy to use the new certificate."
fi

echo ""

# =====================================================
# Step 6: Update URL Map
# =====================================================
echo "Step 6: Updating URL map..."
echo "  Apply the updated url-map.yaml using:"
echo "  gcloud compute url-maps import cricsmart-url-map --source=infra/cloudrun/url-map.yaml --global"

echo ""

# =====================================================
# Summary
# =====================================================
echo "=== Setup Summary ==="
echo ""
echo "DNS Record:"
echo "  tournament.cricsmart.in -> ${STATIC_IP}"
echo ""
echo "Cloud Run Service:"
echo "  ${SERVICE_NAME} in ${REGION}"
echo ""
echo "Backend Service:"
echo "  ${BACKEND_SERVICE_NAME} (global)"
echo ""
echo "=== Next Steps ==="
echo ""
echo "1. Deploy the actual tournament frontend:"
echo "   ./deploy-tournament-frontend.sh"
echo ""
echo "2. Update the URL map:"
echo "   gcloud compute url-maps import cricsmart-url-map --source=url-map.yaml --global"
echo ""
echo "3. If SSL needs updating, create new certificate with all domains"
echo ""
echo "4. Wait for DNS propagation (up to 48 hours, usually ~15 minutes)"
echo ""
echo "5. Test: curl -I https://tournament.cricsmart.in"
