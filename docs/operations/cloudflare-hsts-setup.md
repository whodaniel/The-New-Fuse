# HSTS Configuration for thenewfuse.com
# Set via Cloudflare API or Dashboard
# Dashboard path: SSL/TLS → Edge Certificates → HSTS → Enable

## Curl Setup

```bash
# 1. Get your Cloudflare API token (needs Zone.DNS.Edit + Zone.Settings.Edit)
export CF_API_TOKEN=***
export CF_ZONE_ID=***  # thenewfuse.com zone ID (find via CF dashboard)

# 2. Enable HSTS with 1-year max-age, subdomains included, preload enabled
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/settings/security_header" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": {
      "strict_transport_security": {
        "enabled": true,
        "max_age": 31536000,
        "include_subdomains": true,
        "preload": true,
        "nosniff": true
      }
    }
  }'
```

## Verifying via Dashboard Path

1. Cloudflare dashboard → thenewfuse.com → SSL/TLS → Edge Certificates
2. Scroll to "HTTP Strict Transport Security (HSTS)" → Enable
3. Check:
   - ☑ Enable HSTS (Strict-Transport-Security)
   - max-age: 31536000 (1 year)
   - ☑ Apply HSTS to subdomains (includeSubDomains)
   - ☑ Preload
   - ☑ No-sniff header

## Verify via curl

```bash
curl -I https://thenewfuse.com
# Expect:
#   strict-transport-security: max-age=31536000; includeSubDomains; preload
```

## Verify via header check (online)

```bash
curl -sI https://thenewfuse.com | grep -i strict-transport
# Should print: strict-transport-security: max-age=31536000; includeSubDomains; preload
```

## Rollback (if preload causes cert issuance issues)

```bash
# Disable HSTS entirely
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/settings/security_header" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": {"strict_transport_security": {"enabled": false}}}'

# Or set short max-age (5 min) for safe testing
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/settings/security_header" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": {"strict_transport_security": {"enabled": true, "max_age": 300, "include_subdomains": false, "preload": false}}}'
```

## Checklist Probe (after enable)

```bash
curl -sI https://thenewfuse.com | grep -i "strict-transport-security"
# If non-empty → M01 flips from ⚠ partial → ✅ clean
```

## Toggle via API Endpoint

```
PATCH https://api.cloudflare.com/client/v4/zones/{zone_id}/settings/security_header
```

## Notes

- HSTS only takes effect after a browser sees the header once (no first-visit protection)
- `preload: true` submits to https://hstspreload.org (irreversible without significant delay)
- For first-time enable, recommended sequence:
  1. Start with `max_age: 300` (5 minutes) → test
  2. Increase to `max_age: 86400` (1 day) → monitor
  3. Final: `max_age: 31536000` + `preload: true`
- Requires Cloudflare plan with SSL edge cert (Free tier supports HSTS)
