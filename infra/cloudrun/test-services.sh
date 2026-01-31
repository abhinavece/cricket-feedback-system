#!/bin/bash
# Test CricSmart Cloud Run services
# Run this script to verify all services are working before DNS cutover

set -e

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║         CricSmart Cloud Run Service Tests                         ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_URL="https://cricsmart-backend-795359678717.asia-south1.run.app"
FRONTEND_URL="https://cricsmart-frontend-795359678717.asia-south1.run.app"
LB_IP="136.110.208.131"

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [[ "$response" == "$expected" ]]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected, got $response)"
        return 1
    fi
}

# Test JSON endpoint
test_json_endpoint() {
    local name=$1
    local url=$2
    local key=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url" 2>/dev/null)
    
    if echo "$response" | grep -q "$key"; then
        echo -e "${GREEN}✓ PASS${NC}"
        echo "   Response: $(echo $response | head -c 100)..."
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "   Response: $response"
        return 1
    fi
}

echo "═══════════════════════════════════════════════════════════════════"
echo "1. CLOUD RUN DIRECT ACCESS TESTS"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

test_json_endpoint "Backend Health" "$BACKEND_URL/api/health" "status"
test_endpoint "Frontend Home" "$FRONTEND_URL/" "200"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "2. LOAD BALANCER TESTS (via IP with Host header)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo -n "Testing HTTP→HTTPS redirect... "
redirect_response=$(curl -s -o /dev/null -w "%{http_code}" --resolve "app.cricsmart.in:80:$LB_IP" "http://app.cricsmart.in/" 2>/dev/null || echo "000")
if [[ "$redirect_response" == "301" ]] || [[ "$redirect_response" == "302" ]] || [[ "$redirect_response" == "308" ]]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $redirect_response redirect)"
else
    echo -e "${YELLOW}⚠ PENDING${NC} (Got $redirect_response - LB may still be propagating)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "3. SSL CERTIFICATE STATUS"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

ssl_status=$(gcloud compute ssl-certificates describe cricsmart-ssl --global --format="value(managed.status)" 2>/dev/null || echo "ERROR")
echo -n "SSL Certificate Status: "
if [[ "$ssl_status" == "ACTIVE" ]]; then
    echo -e "${GREEN}$ssl_status${NC}"
else
    echo -e "${YELLOW}$ssl_status${NC} (Will activate after DNS cutover)"
fi

echo ""
echo "Domain Status:"
gcloud compute ssl-certificates describe cricsmart-ssl --global --format="yaml(managed.domainStatus)" 2>/dev/null || echo "  Unable to fetch"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "4. DNS CONFIGURATION"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "Cloud DNS Records:"
gcloud dns record-sets list --zone=cricsmart-zone --format="table(name,type,rrdatas)" 2>/dev/null | head -10

echo ""
echo "Current DNS Resolution (may show old values until cutover):"
echo -n "  app.cricsmart.in → "
dig +short app.cricsmart.in 2>/dev/null || echo "Unable to resolve"
echo -n "  cricsmart.in → "
dig +short cricsmart.in 2>/dev/null || echo "Unable to resolve"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "5. SUMMARY"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Load Balancer IP: $LB_IP"
echo ""
echo "To complete cutover, update nameservers at your domain registrar to:"
echo "  - ns-cloud-a1.googledomains.com"
echo "  - ns-cloud-a2.googledomains.com"
echo "  - ns-cloud-a3.googledomains.com"
echo "  - ns-cloud-a4.googledomains.com"
echo ""
echo "After DNS propagates, test production URLs:"
echo "  curl https://app.cricsmart.in/api/health"
echo "  curl https://cricsmart.in/"
echo ""
