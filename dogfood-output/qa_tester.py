#!/usr/bin/env python3
"""Dogfood QA tester for https://api.thenewfuse.com - makes HTTP requests and captures results."""
import urllib.request
import urllib.error
import json
import ssl
import os
import time
import sys

BASE = "https://api.thenewfuse.com"
OUTDIR = "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/dogfood-output"
os.makedirs(f"{OUTDIR}/responses", exist_ok=True)
os.makedirs(f"{OUTDIR}/headers", exist_ok=True)
os.makedirs(f"{OUTDIR}/screenshots", exist_ok=True)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

results = []

ENDPOINTS = [
    "/", "/docs", "/health", "/api/v1/health",
    "/api/v1/auth", "/api/v1/auth/login", "/api/v1/auth/register",
    "/api/v1/auth/logout", "/api/v1/auth/refresh", "/api/v1/auth/me",
    "/api/v1/auth/forgot-password", "/api/v1/auth/reset-password",
    "/api/v1/auth/verify",
    "/api/v1/agents", "/api/v1/users",
    "/swagger", "/swagger.json", "/swagger/ui",
    "/openapi", "/openapi.json",
    "/api-docs", "/api-docs/json",
    "/redoc",
    "/api", "/api/v1", "/api/v2", "/api/v2/health",
    "/graphql", "/playground",
    "/.well-known/openid-configuration",
    "/version", "/status", "/info", "/metrics",
    "/ready", "/live",
    "/favicon.ico", "/robots.txt", "/sitemap.xml",
]

def safe_name(ep):
    return ep.replace("/", "_").strip("_") or "root"

def test_endpoint(method, path, extra_headers=None, body=None):
    url = f"{BASE}{path}"
    name = safe_name(path)
    result = {
        "method": method,
        "url": url,
        "path": path,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "status": None,
        "headers": {},
        "body_snippet": None,
        "error": None,
        "response_time_ms": None,
        "body_size": None,
        "content_type": None,
    }
    
    headers = {
        "User-Agent": "HermesAgent-QA/1.0",
        "Accept": "application/json, text/html, */*",
    }
    if extra_headers:
        headers.update(extra_headers)
    
    data = json.dumps(body).encode() if body else None
    if data:
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    start = time.time()
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=15)
        elapsed = (time.time() - start) * 1000
        result["status"] = resp.status
        result["response_time_ms"] = round(elapsed, 1)
        result["headers"] = dict(resp.headers)
        result["content_type"] = resp.headers.get("Content-Type", "")
        body_data = resp.read()
        result["body_size"] = len(body_data)
        result["body_snippet"] = body_data[:2000].decode("utf-8", errors="replace")
        
        # Save full response
        with open(f"{OUTDIR}/responses/{method.lower()}_{name}.txt", "w") as f:
            f.write(body_data.decode("utf-8", errors="replace"))
        
    except urllib.error.HTTPError as e:
        elapsed = (time.time() - start) * 1000
        result["status"] = e.code
        result["response_time_ms"] = round(elapsed, 1)
        result["headers"] = dict(e.headers) if e.headers else {}
        result["content_type"] = e.headers.get("Content-Type", "") if e.headers else ""
        try:
            body_data = e.read()
            result["body_size"] = len(body_data)
            result["body_snippet"] = body_data[:2000].decode("utf-8", errors="replace")
            with open(f"{OUTDIR}/responses/{method.lower()}_{name}.txt", "w") as f:
                f.write(body_data.decode("utf-8", errors="replace"))
        except:
            result["body_snippet"] = "(could not read error body)"
    except urllib.error.URLError as e:
        elapsed = (time.time() - start) * 1000
        result["response_time_ms"] = round(elapsed, 1)
        result["error"] = str(e.reason)
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        result["response_time_ms"] = round(elapsed, 1)
        result["error"] = f"{type(e).__name__}: {str(e)}"
    
    # Save headers
    with open(f"{OUTDIR}/headers/{method.lower()}_{name}.txt", "w") as f:
        for k, v in result["headers"].items():
            f.write(f"{k}: {v}\n")
    
    status_str = f"HTTP {result['status']}" if result['status'] else f"ERROR: {result['error']}"
    print(f"  {method} {path} -> {status_str} ({result['response_time_ms']}ms) [{result['content_type']}]")
    return result

def test_cors(path, origin):
    url = f"{BASE}{path}"
    name = safe_name(path)
    result = {
        "method": "OPTIONS",
        "url": url,
        "path": path,
        "origin": origin,
        "cors_headers": {},
        "status": None,
        "error": None,
    }
    
    req = urllib.request.Request(url, method="OPTIONS", headers={
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type,Authorization",
        "User-Agent": "HermesAgent-QA/1.0",
    })
    
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=15)
        result["status"] = resp.status
        for h in ["Access-Control-Allow-Origin", "Access-Control-Allow-Methods",
                   "Access-Control-Allow-Headers", "Access-Control-Allow-Credentials",
                   "Access-Control-Max-Age"]:
            val = resp.headers.get(h)
            if val:
                result["cors_headers"][h] = val
    except urllib.error.HTTPError as e:
        result["status"] = e.code
        for h in ["Access-Control-Allow-Origin", "Access-Control-Allow-Methods",
                   "Access-Control-Allow-Headers", "Access-Control-Allow-Credentials",
                   "Access-Control-Max-Age"]:
            val = e.headers.get(h) if e.headers else None
            if val:
                result["cors_headers"][h] = val
    except Exception as e:
        result["error"] = str(e)
    
    cors_str = f"CORS: {result['cors_headers']}" if result['cors_headers'] else "CORS: none"
    print(f"  OPTIONS {path} (Origin: {origin}) -> HTTP {result['status']} {cors_str}")
    return result

# ===== MAIN TEST RUN =====
print("=" * 60)
print(f"DOGFOOD QA TESTING: {BASE}")
print(f"Started: {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}")
print("=" * 60)

all_results = []
cors_results = []

# Phase 1: GET all endpoints
print("\n--- Phase 1: GET all endpoints ---")
for ep in ENDPOINTS:
    r = test_endpoint("GET", ep)
    all_results.append(r)

# Phase 2: CORS preflight tests
print("\n--- Phase 2: CORS preflight tests ---")
CORS_ORIGINS = ["https://thenewfuse.com", "http://localhost:3000", "https://app.thenewfuse.com"]
CORS_ENDPOINTS = ["/", "/health", "/api/v1/health", "/api/v1/auth/login", "/api/v1/agents"]
for ep in CORS_ENDPOINTS:
    for origin in CORS_ORIGINS:
        r = test_cors(ep, origin)
        cors_results.append(r)

# Phase 3: POST to auth endpoints with empty body
print("\n--- Phase 3: POST auth endpoints (empty body) ---")
for ep in ["/api/v1/auth/login", "/api/v1/auth/register"]:
    r = test_endpoint("POST", ep, body={})
    all_results.append(r)

# Phase 4: POST to auth/login with test credentials
print("\n--- Phase 4: POST /api/v1/auth/login (test creds) ---")
r = test_endpoint("POST", "/api/v1/auth/login",
    body={"email": "test@thenewfuse.com", "password": "TestPass123!"})
all_results.append(r)

# Phase 5: GET protected endpoints with invalid Bearer token
print("\n--- Phase 5: Protected endpoints (invalid auth) ---")
for ep in ["/api/v1/auth/me", "/api/v1/agents", "/api/v1/users"]:
    r = test_endpoint("GET", ep,
        extra_headers={"Authorization": "Bearer invalid_test_token_12345"})
    all_results.append(r)

# Phase 6: POST /api/v1/auth/refresh with invalid token
print("\n--- Phase 6: POST /api/v1/auth/refresh (invalid token) ---")
r = test_endpoint("POST", "/api/v1/auth/refresh",
    body={"refreshToken": "invalid_refresh_token"})
all_results.append(r)

# Phase 7: POST /api/v1/auth/forgot-password with test email
print("\n--- Phase 7: POST /api/v1/auth/forgot-password ---")
r = test_endpoint("POST", "/api/v1/auth/forgot-password",
    body={"email": "test@thenewfuse.com"})
all_results.append(r)

# Save all results
with open(f"{OUTDIR}/all_results.json", "w") as f:
    json.dump({
        "get_results": [r for r in all_results if r["method"] == "GET"],
        "post_results": [r for r in all_results if r["method"] == "POST"],
        "cors_results": cors_results,
    }, f, indent=2, default=str)

print("\n" + "=" * 60)
print(f"Testing complete. Results saved to {OUTDIR}/")
print("=" * 60)
