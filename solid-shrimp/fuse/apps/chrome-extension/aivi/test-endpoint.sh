#!/bin/bash
# Test if the new authentication endpoint is deployed

echo "Testing new /api/auth/google/exchange-code endpoint..."
echo ""

response=$(curl -s -X POST https://aivideointel.thenewfuse.com/api/auth/google/exchange-code \
  -H "Content-Type: application/json" \
  -d '{"code":"test"}')

if echo "$response" | grep -q "Authorization code is required\|Redirect URI is required"; then
  echo "✅ SUCCESS! New endpoint is deployed and working"
  echo ""
  echo "Expected error response (this is correct):"
  echo "$response" | jq . 2>/dev/null || echo "$response"
else
  echo "❌ FAILED - Old endpoint still active or deployment not complete"
  echo ""
  echo "Response:"
  echo "$response" | jq . 2>/dev/null || echo "$response"
  echo ""
  echo "Please wait a few more minutes for Railway deployment to complete"
fi
