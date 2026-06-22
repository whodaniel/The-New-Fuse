#!/bin/bash
# Quick Security Audit Script for Dogfood QA
# Usage: ./quick-security-audit.sh <domain1> [domain2 ...] [--json]
#   --json: Output results in JSON format for machine parsing

JSON_OUTPUT=false
DOMAINS=()

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    *) # Collect domains
      DOMAINS+=("$1")
      shift
      ;;
  esac
done

if [ ${#DOMAINS[@]} -eq 0 ]; then
  if [ "$JSON_OUTPUT" = true ]; then
    echo '{"error": "Domain parameter is required"}'
  else
    echo "Usage: $0 <domain1> [domain2 ...] [--json]"
  fi
  exit 1
fi

# Initialize JSON output if needed
if [ "$JSON_OUTPUT" = true ]; then
  echo '{'
  echo '  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",'
  echo '  "audits": ['
fi

FIRST_DOMAIN=true
for DOMAIN in "${DOMAINS[@]}"; do
  if [ "$JSON_OUTPUT" = true ] && [ "$FIRST_DOMAIN" = false ]; then
    echo '    },' # Close previous domain's tests object
    echo '    }'  # Close previous domain's audit object
    echo '    ,'  # Comma for next object in audits array
  fi

  if [ "$JSON_OUTPUT" = true ]; then
    echo '    {'
    echo '      "domain": "'"$DOMAIN"'",'
    echo '      "tests": {'
  fi

  echo "=== Security Audit for $DOMAIN ==="
  echo ""

  # DNS Resolution
  echo "1. DNS Resolution:"
  DNS_OUTPUT=$(dig +short "$DOMAIN" 2>/dev/null || echo "DNS resolution failed")
  echo "$DNS_OUTPUT"
  echo ""

  if [ "$JSON_OUTPUT" = true ]; then
    echo '        "dns_resolution": {'
    echo '          "output": "'"$(echo "$DNS_OUTPUT" | sed 's/"/\\"/g' | tr '\n' ' ' | sed 's/ $//')"'",'
    if echo "$DNS_OUTPUT" | grep -qE '^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$'; then
      echo '          "passed": true'
    else
      echo '          "passed": false'
    fi
    echo '        },'
  fi

  # Security Headers Check
  echo "2. Security Headers:"
  HEADERS_OUTPUT=$(curl -sI --max-time 5 "https://$DOMAIN/" 2>/dev/null || echo "Failed to fetch headers")
  echo "$HEADERS_OUTPUT"
  echo ""

  if [ "$JSON_OUTPUT" = true ]; then
    echo '        "security_headers": {'
    echo '          "output": "'"$(echo "$HEADERS_OUTPUT" | sed 's/"/\\"/g' | tr '\n' ' ' | sed 's/ $//')"'",'
    
    # Check for specific headers
    HEADERS_LOWER=$(echo "$HEADERS_OUTPUT" | tr '[:upper:]' '[:lower:]')
    echo '          "checks": {'
    echo '            "x_frame_options": "'"$(echo "$HEADERS_LOWER" | grep -q "x-frame-options" && echo "present" || echo "missing")"'",'
    echo '            "x_content_type_options": "'"$(echo "$HEADERS_LOWER" | grep -q "x-content-type-options" && echo "present" || echo "missing")"'",'
    echo '            "content_security_policy": "'"$(echo "$HEADERS_LOWER" | grep -q "content-security-policy" && echo "present" || echo "missing")"'",'
    echo '            "strict_transport_security": "'"$(echo "$HEADERS_LOWER" | grep -q "strict-transport-security" && echo "present" || echo "missing")"'",'
    echo '            "referrer_policy": "'"$(echo "$HEADERS_LOWER" | grep -q "referrer-policy" && echo "present" || echo "missing")"'",'
    echo '            "permissions_policy": "'"$(echo "$HEADERS_LOWER" | grep -q "permissions-policy" && echo "present" || echo "missing")"'",'
    echo '            "x_powered_by": "'"$(echo "$HEADERS_LOWER" | grep -q "x-powered-by" && echo "present" || echo "missing")"'"'
    echo '          }'
    echo '        },'
  fi

  # CORS Audit
  echo "3. CORS Audit:"
  echo "   Testing with evil origin:"
  CORS_EVIL_OUTPUT=$(curl -sI -H "Origin: https://evil-test.com" "https://$DOMAIN/" 2>/dev/null | grep -i "access-control-allow-origin")
  echo "$CORS_EVIL_OUTPUT"
  echo ""
  echo "   Testing CORS error code:"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Origin: https://evil-test.com" "https://$DOMAIN/" 2>/dev/null)
  echo "   Status with evil origin: $STATUS"
  if [ "$STATUS" = "500" ]; then
    echo "   WARNING: CORS rejection returns 500 (should be 403)"
  fi
  echo ""

  if [ "$JSON_OUTPUT" = true ]; then
    echo '        "cors_audit": {'
    echo '          "evil_origin_test": {'
    echo '            "output": "'"$(echo "$CORS_EVIL_OUTPUT" | sed 's/"/\\"/g')"'",'
    echo '            "wildcard_detected": false'
    if echo "$CORS_EVIL_OUTPUT" | grep -q "*"; then
      echo '            "wildcard_detected": true'
    fi
    echo '          },'
    echo '          "error_code_test": {'
    echo '            "status_code": '"$STATUS"','
    echo '            "returns_500_instead_of_403": false'
    if [ "$STATUS" = "500" ]; then
      echo '            "returns_500_instead_of_403": true'
    fi
    echo '          }'
    echo '        },'
  fi

  # Route Availability
  echo "4. Route Availability:"
  ROUTE_RESULTS=""
  FIRST_ROUTE=true
  for route in login register dashboard pricing docs api/health; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/$route" 2>/dev/null)
    echo "   /$route: $STATUS"
    if [ "$STATUS" = "404" ]; then
      echo "   WARNING: Route /$route returns 404"
    fi
    
    if [ "$JSON_OUTPUT" = true ]; then
      if [ "$FIRST_ROUTE" = true ]; then
        FIRST_ROUTE=false
      else
        ROUTE_RESULTS="$ROUTE_RESULTS,"
      fi
      ROUTE_RESULTS="$ROUTE_RESULTS"'"\\\"'"$route"'\\\": {\\\"status_code\\\": "'"$STATUS"'", \\\"is_404\\\": "'$(if [ "$STATUS" = "404" ]; then echo "true"; else echo "false"; fi)'"}}'
    fi
  done
  if [ "$JSON_OUTPUT" = true ]; then
    echo '        "route_availability": {'"$ROUTE_RESULTS"'},'
  fi
  echo ""

  # Information Disclosure
  echo "5. Information Disclosure:"
  echo "   Checking for version/internal info:"
  VERSION_OUTPUT=$(curl -s "https://$DOMAIN/" 2>/dev/null | grep -i "version\\|environment\\|internal\\|stack\\|path" || echo "No obvious version info found")
  echo "$VERSION_OUTPUT"
  echo ""
  echo "   Checking for exposed API docs:"
  API_DOCS_OUTPUT=$(curl -s "https://$DOMAIN/api-docs" 2>/dev/null | head -c 100 || echo "API docs not exposed or not found")
  echo "$API_DOCS_OUTPUT"
  echo ""
  echo "   Checking for API index:"
  API_INDEX_OUTPUT=$(curl -s "https://$DOMAIN/api/v1" 2>/dev/null | head -c 100 || echo "API index not found or not exposed")
  echo "$API_INDEX_OUTPUT"
  echo ""

  if [ "$JSON_OUTPUT" = true ]; then
    echo '        "information_disclosure": {'
    echo '          "version_info": {'
    echo '            "output": "'"$(echo "$VERSION_OUTPUT" | sed 's/"/\\"/g' | tr '\n' ' ' | sed 's/ $//')"'",'
    if [ "$VERSION_OUTPUT" != "No obvious version info found" ]; then
      echo '            "detected": true'
    else
      echo '            "detected": false'
    fi
    echo '          },'
    echo '          "api_docs_exposed": {'
    echo '            "output": "'"$(echo "$API_DOCS_OUTPUT" | sed 's/"/\\"/g')"'",'
    if [ "$API_DOCS_OUTPUT" != "API docs not exposed or not found" ] && [ ${#API_DOCS_OUTPUT} -gt 0 ]; then
      echo '            "exposed": true'
    else
      echo '            "exposed": false'
    fi
    echo '          },'
    echo '          "api_index_exposed": {'
    echo '            "output": "'"$(echo "$API_INDEX_OUTPUT" | sed 's/"/\\"/g')"'",'
    if [ "$API_INDEX_OUTPUT" != "API index not found or not exposed" ] && [ ${#API_INDEX_OUTPUT} -gt 0 ]; then
      echo '            "exposed": true'
    else
      echo '            "exposed": false'
    fi
    echo '          }'
    echo '        }' # Close information_disclosure
  fi
  
  FIRST_DOMAIN=false
done

if [ "$JSON_OUTPUT" = true ]; then
  echo '    }' # Close last domain's tests object
  echo '    }'   # Close last domain's audit object
  echo '  ]'     # Close audits array
  echo '}'       # Close root object
fi

echo ""
echo "=== Audit Complete ==="
