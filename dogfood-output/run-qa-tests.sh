#!/bin/bash
# Dogfood QA test script for https://api.thenewfuse.com
# Captures HTTP status, headers, and body for each endpoint

BASE="https://api.thenewfuse.com"
OUTDIR="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/dogfood-output"
mkdir -p "$OUTDIR/responses" "$OUTDIR/headers" "$OUTDIR/screenshots"

ENDPOINTS=(
  "/"
  "/docs"
  "/health"
  "/api/v1/health"
  "/api/v1/auth"
  "/api/v1/auth/login"
  "/api/v1/auth/register"
  "/api/v1/auth/logout"
  "/api/v1/auth/refresh"
  "/api/v1/auth/me"
  "/api/v1/auth/forgot-password"
  "/api/v1/auth/reset-password"
  "/api/v1/auth/verify"
  "/api/v1/agents"
  "/api/v1/users"
  "/swagger"
  "/swagger.json"
  "/swagger/ui"
  "/openapi"
  "/openapi.json"
  "/api-docs"
  "/api-docs/json"
  "/redoc"
  "/api"
  "/api/v1"
  "/api/v2"
  "/api/v2/health"
  "/graphql"
  "/playground"
  "/.well-known/openid-configuration"
  "/version"
  "/status"
  "/info"
  "/metrics"
  "/ready"
  "/live"
  "/favicon.ico"
  "/robots.txt"
  "/sitemap.xml"
)

CORS_ORIGINS=("https://thenewfuse.com" "http://localhost:3000" "https://app.thenewfuse.com")
CORS_METHODS=("GET" "POST" "OPTIONS")

echo "=== DOGFOOD QA TESTING: $BASE ==="
echo "Started: $(date -u)"
echo ""

# 1. Test each endpoint with GET
for ep in "${ENDPOINTS[@]}"; do
  url="${BASE}${ep}"
  safename=$(echo "$ep" | tr '/' '_' | sed 's/^_//')
  echo "Testing GET $url"
  
  # Get status, headers, body
  curl -sk -o "$OUTDIR/responses/get${safename}.txt" \
    -w "HTTP_STATUS:%{http_code}\nTIME:%{time_total}\nSIZE:%{size_download}\nCONTENT_TYPE:%{content_type}\nREDIRECT:%{redirect_url}" \
    -D "$OUTDIR/headers/get${safename}.txt" \
    -H "Accept: application/json, text/html, */*" \
    -H "User-Agent: HermesAgent-QA/1.0" \
    "$url" 2>/dev/null
  
  echo ""
done

# 2. Test CORS preflight on key endpoints
for ep in "/" "/health" "/api/v1/health" "/api/v1/auth/login" "/api/v1/agents"; do
  for origin in "${CORS_ORIGINS[@]}"; do
    url="${BASE}${ep}"
    safename=$(echo "$ep" | tr '/' '_' | sed 's/^_//')
    echo "Testing OPTIONS $url (Origin: $origin)"
    
    curl -sk -o /dev/null \
      -D "$OUTDIR/headers/cors_${safename}_$(echo $origin | tr ':/' '_').txt" \
      -X OPTIONS \
      -H "Origin: $origin" \
      -H "Access-Control-Request-Method: POST" \
      -H "Access-Control-Request-Headers: Content-Type,Authorization" \
      "$url" 2>/dev/null
    
    echo ""
  done
done

# 3. Test POST to auth endpoints
for ep in "/api/v1/auth/login" "/api/v1/auth/register"; do
  url="${BASE}${ep}"
  safename=$(echo "$ep" | tr '/' '_' | sed 's/^_//')
  echo "Testing POST $url with empty body"
  
  curl -sk -o "$OUTDIR/responses/post${safename}.txt" \
    -w "HTTP_STATUS:%{http_code}\nTIME:%{time_total}\nSIZE:%{size_download}\nCONTENT_TYPE:%{content_type}" \
    -D "$OUTDIR/headers/post${safename}.txt" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{}' \
    "$url" 2>/dev/null
  
  echo ""
done

# 4. Test POST to auth/login with credentials
echo "Testing POST /api/v1/auth/login with test creds"
curl -sk -o "$OUTDIR/responses/post_api_v1_auth_login_testcreds.txt" \
  -w "HTTP_STATUS:%{http_code}\nTIME:%{time_total}\nSIZE:%{size_download}\nCONTENT_TYPE:%{content_type}" \
  -D "$OUTDIR/headers/post_api_v1_auth_login_testcreds.txt" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"test@thenewfuse.com","password":"TestPass123!"}' \
  "${BASE}/api/v1/auth/login" 2>/dev/null

echo ""
echo ""

# 5. Test with invalid auth token on protected endpoints
for ep in "/api/v1/auth/me" "/api/v1/agents" "/api/v1/users"; do
  url="${BASE}${ep}"
  safename=$(echo "$ep" | tr '/' '_' | sed 's/^_//')
  echo "Testing GET $url with invalid Bearer token"
  
  curl -sk -o "$OUTDIR/responses/get${safename}_authtest.txt" \
    -w "HTTP_STATUS:%{http_code}\nTIME:%{time_total}\nSIZE:%{size_download}\nCONTENT_TYPE:%{content_type}" \
    -D "$OUTDIR/headers/get${safename}_authtest.txt" \
    -H "Authorization: Bearer invalid_test_token_12345" \
    -H "Accept: application/json" \
    "$url" 2>/dev/null
  
  echo ""
done

echo "=== TESTING COMPLETE ==="
echo "Finished: $(date -u)"
