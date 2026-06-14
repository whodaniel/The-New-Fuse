#!/usr/bin/env python3
"""
TNF-Native Deep Sec Findings Processor

Analyzes Deep Sec security scan candidates using TNF's LLM infrastructure.
Uses NVIDIA API with automatic failover to verified working models.

Usage:
  python3 tnf-deepsec-processor.py [--project-id The-New-Fuse] [--concurrency 3]
"""

import json
import os
import sys
import requests
import hashlib
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional
import time

# TNF Paths
TNF_ROOT = Path("/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse")
DEEPSEC_DIR = TNF_ROOT / ".deepsec"
DATA_DIR = DEEPSEC_DIR / "data"

# NVIDIA API Configuration
NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

# Use OpenAI if available (no rate limits on paid tier), otherwise NVIDIA with rate limiting
USE_OPENAI = True  # Will auto-fallback to NVIDIA if OPENAI_API_KEY not found

# Rate limiting: NVIDIA free tier is strict - max 1 request per 10 seconds
MIN_REQUEST_INTERVAL = 10.0  # seconds between requests (only used for NVIDIA fallback)

# TNF Verified Models (ordered by priority)
# Primary: OpenAI (if key available)
# Fallback: NVIDIA models (rate-limited)
OPENAI_MODEL = "gpt-4o-mini"  # Fast, cheap, excellent for security analysis
MODEL_FAILOVER_CHAIN = [
    "nvidia/llama-3.3-nemotron-super-49b-v1.5",  # 0.63s - primary NVIDIA
    "qwen/qwen3.5-397b-a17b",  # 0.59s - backup NVIDIA
]

# Analysis Prompt - optimized for security vulnerability assessment
ANALYSIS_SYSTEM_PROMPT = """You are a senior security engineer performing vulnerability analysis.
Your task is to analyze code snippets flagged by automated security scanning and determine if they represent actual security vulnerabilities.

Be strict but accurate:
- False positives waste developer time
- False negatives leave vulnerabilities exposed
- Provide clear, actionable remediation steps

Output ONLY valid JSON matching this exact schema:
{
  "is_vulnerable": boolean,
  "confidence": number (0.0-1.0),
  "severity": "critical" | "high" | "medium" | "low" | "info",
  "vulnerability_type": string (e.g., "Authentication Bypass", "SQL Injection"),
  "description": string (clear explanation of the issue),
  "remediation": string (specific code changes needed),
  "false_positive_reason": string or null (if is_vulnerable is false, explain why)
}"""

ANALYSIS_USER_PROMPT_TEMPLATE = """File: {file_path}
Vulnerability Pattern: {vuln_slug}
Matched Lines: {line_numbers}
Code Context:
```{language}
{snippet}
```

Analyze this code for the security vulnerability pattern "{vuln_slug}".
Determine if this is a TRUE vulnerability or a FALSE POSITIVE.
Provide specific remediation if vulnerable."""


def load_api_key(provider: str = "openai") -> str:
    """Load API key from TNF .env file."""
    env_path = TNF_ROOT / ".env"
    if not env_path.exists():
        raise FileNotFoundError(f"TNF .env not found at {env_path}")
    
    key_var = f"{provider.upper()}_API_KEY"
    
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith(f"{key_var}=") and not line.startswith("#"):
                key = line.split("=", 1)[1].strip()
                if key and not key.startswith("***") and not key.startswith("PASTE"):
                    return key
    
    return None  # Key not found


def call_openai(prompt: str, api_key: str, model: str) -> Optional[dict]:
    """Call OpenAI API. Returns parsed result or None on failure."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1000,
        "temperature": 0.1,
    }
    
    try:
        start = time.time()
        response = requests.post(
            OPENAI_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        elapsed = time.time() - start
        
        if response.status_code == 200:
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            # Parse JSON
            try:
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                result = json.loads(content)
                result["_model_used"] = f"openai/{model}"
                result["_response_time"] = elapsed
                print(f"  ✅ OpenAI {model} ({elapsed:.1f}s)")
                return result
            except json.JSONDecodeError as e:
                print(f"  ⚠️  OpenAI JSON parse error: {e}")
                return None
        else:
            print(f"  ❌ OpenAI returned HTTP {response.status_code}")
            return None
            
    except Exception as e:
        print(f"  ❌ OpenAI request failed: {e}")
        return None


def call_nvidia_with_failover(prompt: str, model_override: Optional[str] = None) -> dict:
    """Call NVIDIA API with failover and rate limiting."""
    nvidia_key = load_api_key("nvidia")
    if not nvidia_key:
        raise RuntimeError("NVIDIA API key not found")
    
    headers = {
        "Authorization": f"Bearer {nvidia_key}",
        "Content-Type": "application/json"
    }
    
    # Enforce rate limiting
    if not hasattr(call_nvidia_with_failover, 'last_request_time'):
        call_nvidia_with_failover.last_request_time = 0
    
    elapsed_since_last = time.time() - call_nvidia_with_failover.last_request_time
    if elapsed_since_last < MIN_REQUEST_INTERVAL:
        wait_time = MIN_REQUEST_INTERVAL - elapsed_since_last
        print(f"  ⏳ NVIDIA rate limit: waiting {wait_time:.1f}s...")
        time.sleep(wait_time)
    
    call_nvidia_with_failover.last_request_time = time.time()
    
    models_to_try = [model_override] if model_override else MODEL_FAILOVER_CHAIN
    
    for model in models_to_try:
        if not model:
            continue
            
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1000,
            "temperature": 0.1,
            "top_p": 0.9,
        }
        
        try:
            start = time.time()
            response = requests.post(
                NVIDIA_API_URL,
                headers=headers,
                json=payload,
                timeout=30,
                verify=False
            )
            elapsed = time.time() - start
            
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                
                try:
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0].strip()
                    elif "```" in content:
                        content = content.split("```")[1].split("```")[0].strip()
                    
                    result = json.loads(content)
                    result["_model_used"] = model
                    result["_response_time"] = elapsed
                    return result
                    
                except json.JSONDecodeError as e:
                    print(f"  ⚠️  JSON parse error for {model}: {e}")
                    continue
            else:
                print(f"  ❌ {model} returned HTTP {response.status_code}")
                
        except requests.exceptions.Timeout:
            print(f"  ⏱️  {model} timed out (>30s)")
        except requests.exceptions.RequestException as e:
            print(f"  ❌ {model} request failed: {e}")
    
    raise RuntimeError(f"All NVIDIA models failed: {MODEL_FAILOVER_CHAIN}")


def call_llm_with_failover(prompt: str, model_override: Optional[str] = None) -> dict:
    """
    Call LLM API with automatic failover:
    1. Try OpenAI first (if key available) - no rate limits
    2. Fall back to NVIDIA with rate limiting
    Returns parsed JSON response.
    """
    # Try OpenAI first (preferred - no rate limits on paid tier)
    openai_key = load_api_key("openai")
    if openai_key and USE_OPENAI:
        result = call_openai(prompt, openai_key, model_override or OPENAI_MODEL)
        if result:
            return result
        print("  ⚠️  OpenAI failed, falling back to NVIDIA...")
    
    # Fall back to NVIDIA
    return call_nvidia_with_failover(prompt, model_override)


def detect_language(file_path: str) -> str:
    """Detect programming language from file extension."""
    ext_map = {
        ".ts": "typescript",
        ".tsx": "typescript",
        ".js": "javascript",
        ".jsx": "javascript",
        ".py": "python",
        ".go": "go",
        ".rs": "rust",
        ".java": "java",
        ".c": "c",
        ".cpp": "cpp",
        ".h": "c",
        ".hpp": "cpp",
        ".rb": "ruby",
        ".php": "php",
        ".sh": "bash",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".json": "json",
        ".md": "markdown",
    }
    ext = Path(file_path).suffix.lower()
    return ext_map.get(ext, "text")


def analyze_candidate(file_data: dict) -> dict:
    """
    Analyze a single candidate file.
    Returns updated file data with findings.
    """
    file_path = file_data["filePath"]
    
    for candidate in file_data["candidates"]:
        vuln_slug = candidate["vulnSlug"]
        line_numbers = candidate["lineNumbers"]
        snippet = candidate["snippet"]
        
        print(f"  📍 Analyzing {vuln_slug} at lines {line_numbers}...")
        
        prompt = ANALYSIS_USER_PROMPT_TEMPLATE.format(
            file_path=file_path,
            vuln_slug=vuln_slug,
            line_numbers=line_numbers,
            language=detect_language(file_path),
            snippet=snippet
        )
        
        try:
            analysis = call_llm_with_failover(prompt)
            
            # Create finding record
            finding = {
                "id": hashlib.sha256(
                    f"{file_path}:{vuln_slug}:{','.join(map(str, line_numbers))}".encode()
                ).hexdigest()[:12],
                "candidate_slug": vuln_slug,
                "line_numbers": line_numbers,
                "is_vulnerable": analysis.get("is_vulnerable", False),
                "confidence": analysis.get("confidence", 0.5),
                "severity": analysis.get("severity", "info"),
                "vulnerability_type": analysis.get("vulnerability_type", vuln_slug),
                "description": analysis.get("description", "No description provided"),
                "remediation": analysis.get("remediation", "") if analysis.get("is_vulnerable") else None,
                "false_positive_reason": analysis.get("false_positive_reason") if not analysis.get("is_vulnerable") else None,
                "analyzed_at": datetime.utcnow().isoformat() + "Z",
                "model_used": analysis.get("_model_used", "unknown"),
                "analysis_time_seconds": analysis.get("_response_time", 0),
            }
            
            # Add to findings
            if "findings" not in file_data:
                file_data["findings"] = []
            file_data["findings"].append(finding)
            
            # Status update
            status_icon = "🔴" if finding["is_vulnerable"] else "🟢"
            conf_pct = int(finding["confidence"] * 100)
            print(f"    {status_icon} {finding['severity'].upper()}: {finding['vulnerability_type']} "
                  f"({conf_pct}% conf, {finding['analysis_time_seconds']:.1f}s)")
            
        except Exception as e:
            print(f"    ❌ Analysis failed: {e}")
            # Add error record
            error_finding = {
                "id": f"error_{hashlib.sha256(f'{file_path}:{vuln_slug}'.encode()).hexdigest()[:8]}",
                "candidate_slug": vuln_slug,
                "line_numbers": line_numbers,
                "error": str(e),
                "analyzed_at": datetime.utcnow().isoformat() + "Z",
            }
            if "findings" not in file_data:
                file_data["findings"] = []
            file_data["findings"].append(error_finding)
    
    file_data["status"] = "analyzed"
    file_data["last_analyzed_at"] = datetime.utcnow().isoformat() + "Z"
    
    # Clear lock
    file_data.pop("lockedByRunId", None)
    file_data.pop("lockedAt", None)
    
    return file_data


def load_candidate_files(project_id: str) -> list:
    """Load all candidate files for a project."""
    project_dir = DATA_DIR / project_id / "files"
    if not project_dir.exists():
        raise FileNotFoundError(f"Project data not found: {project_dir}")
    
    candidates = []
    for json_file in project_dir.rglob("*.json"):
        try:
            with open(json_file) as f:
                data = json.load(f)
                # Skip already analyzed files unless re-analysis requested
                if data.get("status") == "analyzed" and data.get("findings"):
                    continue
                candidates.append(data)
        except Exception as e:
            print(f"⚠️  Failed to load {json_file}: {e}")
    
    return candidates


def save_candidate_file(data: dict) -> None:
    """Save updated candidate file data."""
    file_path = DEEPSEC_DIR / "data" / data["projectId"] / "files" / data["filePath"]
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def generate_report(project_id: str, findings: list) -> str:
    """Generate markdown security report."""
    report = f"""# TNF Security Analysis Report
**Project:** {project_id}
**Generated:** {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")} UTC
**Analysis Engine:** TNF-Native Deep Sec Processor (NVIDIA API)

---

## Executive Summary

"""
    
    # Stats
    total = len(findings)
    vulnerable = [f for f in findings if f.get("is_vulnerable")]
    false_positives = [f for f in findings if not f.get("is_vulnerable") and "error" not in f]
    errors = [f for f in findings if "error" in f]
    
    by_severity = {
        "critical": len([f for f in vulnerable if f.get("severity") == "critical"]),
        "high": len([f for f in vulnerable if f.get("severity") == "high"]),
        "medium": len([f for f in vulnerable if f.get("severity") == "medium"]),
        "low": len([f for f in vulnerable if f.get("severity") == "low"]),
        "info": len([f for f in vulnerable if f.get("severity") == "info"]),
    }
    
    report += f"""- **Total Candidates Analyzed:** {total}
- **Confirmed Vulnerabilities:** {len(vulnerable)}
- **False Positives:** {len(false_positives)}
- **Analysis Errors:** {len(errors)}

### Vulnerabilities by Severity
- 🔴 Critical: {by_severity['critical']}
- 🟠 High: {by_severity['high']}
- 🟡 Medium: {by_severity['medium']}
- 🔵 Low: {by_severity['low']}
- ⚪ Info: {by_severity['info']}

---

## Critical & High Severity Findings

"""
    
    # List critical/high findings
    critical_high = [f for f in vulnerable if f.get("severity") in ["critical", "high"]]
    if not critical_high:
        report += "*No critical or high severity vulnerabilities found.*\n\n"
    else:
        for i, finding in enumerate(critical_high, 1):
            severity_icon = "🔴" if finding["severity"] == "critical" else "🟠"
            report += f"""### {i}. {finding['vulnerability_type']}
{severity_icon} **Severity:** {finding['severity'].upper()}
📍 **File:** `{finding.get('file_path', 'unknown')}`
📊 **Confidence:** {int(finding['confidence'] * 100)}%

**Description:**
{finding['description']}

**Remediation:**
```
{finding.get('remediation', 'No specific remediation provided')}
```

---

"""
    
    # Medium/Low findings
    medium_low = [f for f in vulnerable if f.get("severity") in ["medium", "low", "info"]]
    if medium_low:
        report += """## Medium & Low Severity Findings

"""
        for finding in medium_low:
            report += f"- **{finding['vulnerability_type']}** in `{finding.get('file_path', 'unknown')}` " \
                     f"({finding['severity']}, {int(finding['confidence'] * 100)}% conf)\n"
        report += "\n"
    
    # False positives summary
    if false_positives:
        report += f"""## False Positives ({len(false_positives)} total)

These candidates were flagged by automated scanning but confirmed safe by AI analysis:

"""
        for fp in false_positives[:20]:  # Limit to first 20
            reason = fp.get('false_positive_reason', 'Not a vulnerability')
            report += f"- `{fp.get('file_path', 'unknown')}` — {reason[:100]}\n"
        if len(false_positives) > 20:
            report += f"\n*...and {len(false_positives) - 20} more*\n"
    
    report += f"""
---

## Appendix: Analysis Configuration

- **Primary Model:** {MODEL_FAILOVER_CHAIN[0]}
- **Failover Models:** {', '.join(MODEL_FAILOVER_CHAIN[1:])}
- **API Endpoint:** {NVIDIA_API_URL}
- **Temperature:** 0.1 (deterministic analysis)
- **Max Tokens:** 1000

*Report generated by TNF-Native Deep Sec Processor*
"""
    
    return report


def main():
    print("=" * 70)
    print("🛡️  TNF-Native Deep Sec Security Findings Processor")
    print("=" * 70)
    print()
    
    # Configuration
    project_id = "The-New-Fuse"
    if len(sys.argv) > 1:
        project_id = sys.argv[1]
    
    concurrency = 3
    if len(sys.argv) > 2:
        try:
            concurrency = int(sys.argv[2])
        except ValueError:
            pass
    
    print(f"📁 Project: {project_id}")
    print(f"🔧 Concurrency: {concurrency} workers")
    print(f"🤖 Models: {' → '.join(MODEL_FAILOVER_CHAIN)}")
    print()
    
    # Load candidates
    print("📚 Loading candidate files...")
    try:
        candidates = load_candidate_files(project_id)
        print(f"   Found {len(candidates)} candidates to analyze")
    except FileNotFoundError as e:
        print(f"❌ {e}")
        sys.exit(1)
    
    if not candidates:
        print("✅ All candidates already analyzed!")
        sys.exit(0)
    
    # Process candidates
    print()
    print("🔍 Starting analysis...")
    print("-" * 70)
    
    all_findings = []
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = {executor.submit(analyze_candidate, cand): cand for cand in candidates}
        
        for i, future in enumerate(as_completed(futures), 1):
            try:
                result = future.result()
                save_candidate_file(result)
                
                # Collect findings
                if "findings" in result:
                    for finding in result["findings"]:
                        finding["file_path"] = result["filePath"]
                        all_findings.append(finding)
                
                elapsed = time.time() - start_time
                eta = (elapsed / i) * (len(candidates) - i) if i > 0 else 0
                print(f"   [{i}/{len(candidates)}] ETA: {eta/60:.1f}min")
                
            except Exception as e:
                print(f"   ❌ Worker failed: {e}")
    
    total_time = time.time() - start_time
    
    print()
    print("-" * 70)
    print(f"✅ Analysis complete in {total_time/60:.1f} minutes")
    print(f"   Total findings: {len(all_findings)}")
    
    # Generate report
    print()
    print("📝 Generating security report...")
    report = generate_report(project_id, all_findings)
    
    report_path = DEEPSEC_DIR / f"security-report-{project_id}-{datetime.now().strftime('%Y%m%d-%H%M%S')}.md"
    with open(report_path, "w") as f:
        f.write(report)
    
    print(f"   Saved: {report_path}")
    print()
    
    # Summary
    vulnerable = [f for f in all_findings if f.get("is_vulnerable")]
    print("=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    print(f"   Vulnerabilities found: {len(vulnerable)}")
    critical = len([f for f in vulnerable if f.get("severity") == "critical"])
    high = len([f for f in vulnerable if f.get("severity") == "high"])
    if critical or high:
        print(f"   🔴 CRITICAL: {critical}  |  🟠 HIGH: {high}")
        print()
        print("   ⚠️  Immediate action recommended!")
    else:
        print("   ✅ No critical/high severity issues found")
    print("=" * 70)
    
    # Export findings JSON
    findings_json_path = DEEPSEC_DIR / f"findings-{project_id}-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    with open(findings_json_path, "w") as f:
        json.dump(all_findings, f, indent=2)
    
    print(f"   Findings JSON: {findings_json_path}")
    print()


if __name__ == "__main__":
    main()