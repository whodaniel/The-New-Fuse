#!/bin/bash
# TNF Security Audit Script - Automated Headless Probes
# Usage: ./tnf-security-audit.sh [--json]
# Runs security audits on all TNF properties and outputs structured results

set -e

JSON_OUTPUT=false
OUTPUT_DIR="$HOME/dogfood-output"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    *)
      break
      ;;
  esac
done

# TNF Properties to audit
DOMAINS=(
  "app.thenewfuse.com"
  "extreamix.com"
  "api.thenewfuse.com"
  "relay.thenewfuse.com"
)

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "=== TNF Security Audit ==="
echo "Timestamp: $TIMESTAMP"
echo "Domains: ${DOMAINS[*]}"
echo ""

# Initialize results
CRITICAL_COUNT=0
HIGH_COUNT=0
MEDIUM_COUNT=0

for domain in "${DOMAINS[@]}"; do
  echo "--- Auditing $domain ---"
  
  # DNS Resolution
  DNS_IPS=$(dig +short "$domain" 2>/dev/null | tr '\n' ' ' || echo "FAILED")
  echo "DNS: $DNS_IPS"
  
  # Security Headers
  HEADERS=$(curl -sI --max-time 5 "https://$domain/" 2>/dev/null || echo "FAILED")
  
  # Check for missing headers
  MISSING_HEADERS=""
  echo "$HEADERS" | grep -qi "x-frame-options" || MISSING_HEADERS="$MISSING_HEADERS x-frame-options"
  echo "$HEADERS" | grep -qi "x-content-type-options" || MISSING_HEADERS="$MISSING_HEADERS x-content-type-options"
  echo "$HEADERS" | grep -qi "content-security-policy" || MISSING_HEADERS="$MISSING_HEADERS content-security-policy"
  echo "$HEADERS" | grep -qi "strict-transport-security" || MISSING_HEADERS="$MISSING_HEADERS strict-transport-security"
  echo "$HEADERS" | grep -qi "referrer-policy" || MISSING_HEADERS="$MISSING_HEADERS referrer-policy"
  echo "$HEADERS" | grep -qi "permissions-policy" || MISSING_HEADERS="$MISSING_HEADERS permissions-policy"
  
  if [ -n "$MISSING_HEADERS" ]; then
    echo "⚠️  Missing headers:$MISSING_HEADERS"
    ((MEDIUM_COUNT++))
  fi
  
  # CORS Audit
  CORS_HEADER=$(echo "$HEADERS" | grep -i "access-control-allow-origin" || echo "")
  if [[ "$CORS_HEADER" == *"access-control-allow-origin: *"* ]]; then
    echo "🔴 CRITICAL: Wildcard CORS detected!"
    ((CRITICAL_COUNT++))
  fi
  
  # Test with evil origin
  CORS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Origin: https://evil-test.com" "https://$domain/" 2>/dev/null)
  if [ "$CORS_STATUS" = "500" ]; then
    echo "🟠 HIGH: CORS rejection returns 500"
    ((HIGH_COUNT++))
  fi
  
  # Route Availability
  ROUTES=("login" "register" "dashboard" "pricing" "docs" "api/health")
  for route in "${ROUTES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain/$route" 2>/dev/null)
    if [ "$STATUS" = "404" ]; then
      echo "🟠 HIGH: Route /$route returns 404"
      ((HIGH_COUNT++))
    fi
  done
  
  # Information Disclosure
  BODY=$(curl -s --max-time 5 "https://$domain/" 2>/dev/null)
  if echo "$BODY" | grep -qi "version\|api-version\|build"; then
    echo "🟡 MEDIUM: Version info disclosed"
    ((MEDIUM_COUNT++))
  fi
  
  if echo "$BODY" | grep -qi "x-powered-by"; then
    echo "🟡 MEDIUM: x-powered-by header present"
    ((MEDIUM_COUNT++))
  fi
  
  echo ""
done

echo "=== Audit Complete ==="
echo "Critical: $CRITICAL_COUNT"
echo "High: $HIGH_COUNT"
echo "Medium: $MEDIUM_COUNT"

# Save summary
cat > "$OUTPUT_DIR/audit-summary-$TIMESTAMP.txt" << EOF
TNF Security Audit Summary
Timestamp: $TIMESTAMP
Critical: $CRITICAL_COUNT
High: $HIGH_COUNT
Medium: $MEDIUM_COUNT
Total: $((CRITICAL_COUNT + HIGH_COUNT + MEDIUM_COUNT))
EOF

echo ""
echo "Summary saved to: $OUTPUT_DIR/audit-summary-$TIMESTAMP.txt"
