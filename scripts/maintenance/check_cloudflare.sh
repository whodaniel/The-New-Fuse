TOKEN="fpX3SUxktWBIgDgb1sm29x5G8G9YmlaKyzE0uReM"
ACCOUNT_ID="7a340d098bbe253ce909af4ca6870ff0"
BASE_URL="https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID"

echo "=== Pages Projects ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/pages/projects" | grep -o '"name":"[^"]*"' | cut -d: -f2 | tr -d '"' | sort -u

echo "=== Workers ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/workers/scripts" | grep -o '"id":"[^"]*"' | cut -d: -f2 | tr -d '"' | sort -u

echo "=== KV Namespaces ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/storage/kv/namespaces" | grep -o '"title":"[^"]*"' | cut -d: -f2 | tr -d '"' | sort -u

echo "=== D1 Databases ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/d1/database" | grep -o '"name":"[^"]*"' | cut -d: -f2 | tr -d '"' | sort -u

echo "=== R2 Buckets ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/r2/buckets" | grep -o '"name":"[^"]*"' | cut -d: -f2 | tr -d '"' | sort -u
