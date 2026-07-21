#!/usr/bin/env python3
"""
TNF Process Atlas Generator
---------------------------
Refreshes the structured-process catalog for TNF.

Outputs:
  - .verifier/tnf-process-atlas.html  (human, opens in browser)
  - .verifier/process-atlas.payload.json  (machine-readable, agents pull this)
  - .verifier/process-atlas.verify.json  (verification report per run)

Verification gates (per run):
  1. Cron count is 19 +/- 1 (no drift loss)
  2. Live relay-core processes found (master-clock + broker-agent)
  3. Relay-core TS source count > 60
  4. HTML file > 30 KB
  5. JSON payload parses, required keys present

Usage:
  python3 .verifier/generate-process-atlas.py            # full regen + verify
  python3 .verifier/generate-process-atlas.py --check    # verification only (no regen)
  python3 .verifier/generate-process-atlas.py --json     # JSON payload only
Exit codes:
  0 = success, 2 = verification failure
"""
import subprocess, re, json, sys, os, argparse
from pathlib import Path
from datetime import datetime, timezone

REPO = Path(__file__).resolve().parent.parent
VERIFIER = REPO / ".verifier"
VERIFIER.mkdir(exist_ok=True)

REQUIRED_KEYS = ("cron", "live", "packages", "apps", "proto_scripts", "agent_scripts", "relay_core_ts", "now")


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def collect_cron():
    cr = run(["crontab", "-l"]).stdout
    cron = []
    for ln in cr.splitlines():
        m = re.match(r'^(\S+\s+\S+\s+\S+\s+\S+\s+\S+)\s+(.*)$', ln.strip())
        if not m:
            continue
        sched, rest = m.groups()
        pid = re.search(r'--process-id\s+"([^"]+)"', rest)
        if pid:
            cron.append({"sched": sched, "id": pid.group(1)})
    return cron


def collect_live():
    seen = set()
    live = []
    for kw, role in [
        ("master-clock", "Master Clock (relay-core)"),
        ("broker-agent", "Broker Agent (task dispatcher)"),
        ("director-agent", "Director Agent (escalation reviewer)"),
        ("redis-ws-bridge", "Local Redis WebSocket Bridge"),
        ("standalone-relay", "Standalone Relay Server"),
        ("relay-core", "Relay Core Runtime"),
    ]:
        try:
            out = run(["pgrep", "-fl", kw]).stdout.strip().splitlines()
        except Exception:
            continue
        for line in out:
            if line in seen:
                continue
            seen.add(line)
            live.append({"role": role, "cmd": line})
    return live


def collect_tree(rel):
    base = REPO / rel
    if not base.exists():
        return []
    return sorted(p.relative_to(REPO).as_posix()
                  for p in base.rglob("*.ts" if rel == "packages/relay-core/src" else "*")
                  if all(x not in str(p) for x in (".d.ts", "/dist/", "/.git/")))


def build_payload():
    pkg_root = REPO / "packages"
    app_root = REPO / "apps"
    pkgs = sorted({p.name for p in pkg_root.iterdir() if p.is_dir()}) if pkg_root.exists() else []
    apps = sorted({p.name for p in app_root.iterdir() if p.is_dir()}) if app_root.exists() else []

    proto = sorted(p.relative_to(REPO).as_posix()
                   for p in (REPO / "scripts/protocols").glob("*.cjs") if ".test." not in p.name)
    scripts_agents = sorted(p.relative_to(REPO).as_posix() for p in (REPO / "scripts/agents").glob("*"))
    rc = collect_tree("packages/relay-core/src")

    cron = collect_cron()
    live = collect_live()

    return {
        "now": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "generated_by": "tnf-process-atlas-generator",
        "repo": str(REPO),
        "cron": cron,
        "live": live,
        "packages": pkgs,
        "apps": apps,
        "proto_scripts": proto,
        "agent_scripts": scripts_agents,
        "relay_core_ts": rc,
        "summaries": {
            "cron_count": len(cron),
            "live_count": len(live),
            "packages_count": len(pkgs),
            "apps_count": len(apps),
            "proto_count": len(proto),
            "agent_scripts_count": len(scripts_agents),
            "relay_core_ts_count": len(rc),
        },
    }


def verify(payload):
    """Verifies freshness, completeness, and structural integrity. Returns (ok, list_of_findings)."""
    f = []
    ok = True
    if not (19 - 1 <= payload["summaries"]["cron_count"] <= 19 + 1):
        f.append(("CRON_DRIFT", f"cron_count={payload['summaries']['cron_count']} expected ~19"))
        ok = False
    roles = {l["role"] for l in payload["live"]}
    if "Master Clock (relay-core)" not in roles:
        f.append(("MISSING_MASTER_CLOCK", "master-clock process not running"))
        ok = False
    if "Broker Agent (task dispatcher)" not in roles:
        f.append(("MISSING_BROKER", "broker-agent process not running"))
        ok = False
    if payload["summaries"]["relay_core_ts_count"] < 60:
        f.append(("REL_CORE_SHALLOW", f"only {payload['summaries']['relay_core_ts_count']} TS files"))
        ok = False
    if payload["summaries"]["packages_count"] < 50:
        f.append(("PACKAGES_LOW", f"only {payload['summaries']['packages_count']} packages"))
        ok = False
    if payload["summaries"]["apps_count"] < 15:
        f.append(("APPS_LOW", f"only {payload['summaries']['apps_count']} apps"))
        ok = False
    for k in REQUIRED_KEYS:
        if k not in payload:
            f.append(("MISSING_KEY", f"required key {k} missing"))
            ok = False
    return ok, f


def render_html(payload):
    import html as htmllib
    esc = htmllib.escape

    cron_total = len(payload["cron"])
    live_total = len(payload["live"])
    pkgs = payload["packages"]
    apps = payload["apps"]
    proto = payload["proto_scripts"]
    agents = payload["agent_scripts"]
    rc = payload["relay_core_ts"]
    now = payload["now"]

    def sched_human(s):
        return {"*/10": "every 10 min", "*/15": "every 15 min", "*/30": "every 30 min",
                "0 *": "hourly", "0 */2": "every 2 hours", "0 */4": "every 4 hours",
                "0 */6": "every 6 hours", "0 */12": "every 12 hours",
                "15 */2": "every 2 hours at :15", "30 */4": "every 4 hours at :30",
                "30 3 * * *": "daily 03:30 UTC", "0 9 * * *": "daily 09:00 UTC"}.get(s, s)

    def classify(pid):
        pid = pid.lower()
        if pid.startswith("tnf-continuous"): return "Continuous QA Flywheel"
        if "twip" in pid: return "TWIP Macro Board"
        if pid.startswith("tnf-llm-arena") or pid.startswith("tnf-llm-ranking"): return "LLM Arena Intel"
        if pid.startswith("tnf-self-improvement"): return "Self-Improvement Scorecard"
        if pid.startswith("tnf-master-clock"): return "Master Clock Super-Cycle"
        if pid.startswith("tnf-openclaw"): return "OpenClaw Runtime Sync"
        if pid.startswith("tnf-terminal-awareness-reminder") or "terminal-awareness" in pid: return "Terminal Awareness"
        if "tenant-nightly" in pid: return "Tenant Nightly Maintenance"
        if "tenant-daily-priority" in pid: return "Daily Priority Plan"
        if "tenant-self-improvement" in pid: return "Tenant Self-Improvement"
        if "tenant-knowledge-scout" in pid: return "Knowledge Scout Sprint"
        if "tenant-archaeology" in pid or "tenant-per" in pid: return "Personal Archaeology"
        if "tenant-orchestrator" in pid: return "Orchestrator Pulse"
        if "tenant-loop-watchdog" in pid: return "Tenant Loop Watchdog"
        if "tenant-hourly-attribution" in pid: return "Hourly Attribution Audit"
        return "Other"

    PROCESS_DOCS = {
        "tnf-master-clock-super-cycle": {"purpose":"Phase rotation of all directors and agents — drives TNF's autonomous evolution.","sig":"CRITICAL","deps":["broker-agent","director-agent"],"feeds":["all loops"]},
        "tenant-loop-watchdog": {"purpose":"Detects stalled loops and re-arms restart sequences.","sig":"HIGH","deps":["broker-agent","redis-pub-sub"],"feeds":["master-clock"]},
        "tnf-self-improvement-scorecard": {"purpose":"Aggregates harness performance and seeds self-improvement directives.","sig":"HIGH","deps":["relay-core"],"feeds":["self-improvement-loop"]},
        "tenant-continuous-qa-loop": {"purpose":"Spawns dogfood / QA harness runs against the live app.","sig":"HIGH","deps":["dogfood"],"feeds":["directive-rotator"]},
        "tenant-knowledge-scout-sprint": {"purpose":"Scouts AI/agent ecosystem news and protocol changes.","sig":"MEDIUM","deps":["web-search","model-watchdog"],"feeds":["self-improvement-scorecard"]},
        "tnf-llm-arena-intel-collector": {"purpose":"Collects free-tier LLM endpoint toggles.","sig":"MEDIUM","deps":["web-fetch"],"feeds":["model-watchdog"]},
        "tnf-llm-ranking-optimizer": {"purpose":"Re-ranks the active fallback chain based on rolling score.","sig":"MEDIUM","deps":["model-watchdog"],"feeds":["provider-probe-gate"]},
        "tnf-openclaw-runtime-sync": {"purpose":"Reconciles .openclaw/ runtime state between host and inbound packets.","sig":"MEDIUM","deps":["openclaw"],"feeds":["directive-rotator"]},
        "tnf-terminal-awareness-reminder": {"purpose":"Reinstalls terminal awareness guardrails.","sig":"LOW","deps":[],"feeds":[]},
        "tnf-twip-macro-board-refresh": {"purpose":"Refreshes the TWIP macro board.","sig":"LOW","deps":[],"feeds":[]},
        "tenant-orchestrator-pulse": {"purpose":"Heartbeat of the tenant orchestrator.","sig":"HIGH","deps":["orchestrator"],"feeds":["directive-rotator"]},
        "tenant-terminal-awareness-default": {"purpose":"Hourly reassertion of default tenant terminal profile.","sig":"LOW","deps":[],"feeds":[]},
        "tenant-hourly-attribution-audit": {"purpose":"Audits work attribution across tenants.","sig":"MEDIUM","deps":["ledger-api"],"feeds":["directive-rotator"]},
        "tenant-personal-archaeology-master-loop": {"purpose":"Master dig for personal archaeology.","sig":"HIGH","deps":["redis-pipelines"],"feeds":["synapse-index"]},
        "tenant-personal-archaeology-investigator-pulse": {"purpose":"Per-tenant pulse into the archaeology substrate.","sig":"MEDIUM","deps":["dig-pipelines"],"feeds":["master-loop"]},
        "tenant-personal-archaeology-digest": {"purpose":"12-hour digestion into factoids.","sig":"MEDIUM","deps":["embeddings-pipeline"],"feeds":["long-term-memory"]},
        "tenant-daily-priority-plan": {"purpose":"Daily contemplative plan.","sig":"MEDIUM","deps":[],"feeds":["terminal-awareness-default"]},
        "tenant-nightly-maintenance": {"purpose":"03:30 UTC — repository hygiene, cache GC, log rotation.","sig":"HIGH — disk safety","deps":["disk-emergency-recovery"],"feeds":[]},
        "tenant-self-improvement-loop": {"purpose":"2-hour self-improvement pot: drafts one open directive, commits if green.","sig":"HIGH","deps":["scorecard","rotator"],"feeds":["directive-rotator"]},
    }
    def doc(pid):
        return PROCESS_DOCS.get(pid, {"purpose":"Periodic tenant housekeeping.","sig":"MEDIUM","deps":[],"feeds":[]})

    cron_groups = {}
    for c in payload["cron"]:
        cron_groups.setdefault(classify(c["id"]), []).append(c)

    def render_cron_rows(rows):
        return "".join(f"""
        <tr class="cron-row"><td class="mono">{esc(c['id'])}</td>
          <td><span class="sched">{esc(sched_human(c['sched']))}</span> <span class="muted">{esc(c['sched'])}</span></td>
          <td>{esc(doc(c['id'])['purpose'])}</td>
          <td>{esc(doc(c['id'])['sig'])}</td>
          <td>{', '.join(doc(c['id'])['deps']) or '—'}</td>
          <td>{', '.join(doc(c['id'])['feeds']) or '—'}</td></tr>""" for c in rows)

    cron_table_rows = ""
    for cat, rows in cron_groups.items():
        cron_table_rows += f'<tr class="cron-group"><td colspan="6"><strong>{esc(cat)}</strong> <span class="muted">({len(rows)})</span></td></tr>'
        cron_table_rows += render_cron_rows(rows)

    LIVE_PURPOSE = {
        "Master Clock (relay-core)": "Phase rotation: drives SuperCycle, advance/retreat between evolvers, emits readiness pulses on tnf:bus:*.",
        "Broker Agent (task dispatcher)": "BRPOPs tnf:master:tasks:realtime, evaluates policy gates, dispatches to agents via pub/sub.",
        "Director Agent (escalation reviewer)": "Reviews broker escalations, persists to Unified Ledger.",
        "Local Redis WebSocket Bridge": "Local pub/sub bridge on :3005: Redis events → WebSocket for browser dashboards.",
        "Standalone Relay Server": "Stand-alone relay exposing REST + WS API (port 3007).",
        "Relay Core Runtime": "Local compilation of @the-new-fuse/relay-core.",
    }

    live_cards = "".join(f"""<div class="live-card">
      <div class="live-name">{esc(l['role'])}</div>
      <div>
        <div style="font-size:13px;margin-bottom:6px">{esc(LIVE_PURPOSE.get(l['role'],'TNF runtime subsystem'))}</div>
        <div class="live-cmd">{esc(l['cmd'])}</div>
      </div></div>""" for l in payload["live"])

    apps_ext_set = {"chrome-extension","cloud-sandbox","demo-agent-extension","external","gemini-bridge-extension",
                    "mcp-servers","myphoneremote-api","nexus-orchestrator","openclaw","picoclaw-overseer",
                    "relay-server","skideancer-ide","stripe-provider-bridge","tauri-desktop","telegram-mcp",
                    "vscode-extension","adk-gateway","ai-arcade","casin8-games","poker-room",
                    "virtual-library-blueprints","visualization-hub","zeroclaw-sandbox"}
    apps_core = sorted(set(apps) - apps_ext_set)
    apps_ext = sorted(a for a in apps if a in apps_ext_set)

    relay_groups = {
        "Core Loaders": [x for x in rc if x.endswith(("main.ts","index.ts","launchpad.ts","standalone-relay.ts","redirector.ts"))],
        "Agents (broker, director, master-clock, registry)": [x for x in rc if any(k in x for k in ("broker-agent","director-agent","master-clock","agent-registry"))],
        "Orchestration & Scheduling": [x for x in rc if "/orchestrator" in x or "scheduler" in x.lower() or "chron" in x.lower()],
        "Protocols & Adapters": [x for x in rc if x.startswith("packages/relay-core/src/protocol/") or "adapters/" in x or "protocols/" in x],
        "HTTP / WS / Redis Transports": [x for x in rc if x.startswith("packages/relay-core/src/http/") or "/ws" in x or "/redis" in x or "/transport" in x or "RedisAgentClient" in x],
        "Services": [x for x in rc if "/services/" in x],
        "Contracts": [x for x in rc if x.startswith("packages/relay-core/src/contracts")],
        "Auth, Misc": [x for x in rc if "/auth/" in x or "auth" in x.lower()],
    }

    def render_group(name, fnames):
        items = "".join(f'<li class="mono"><span class="relay-tag">{esc(name.split()[0].lower())}</span>{esc(fn)}</li>' for fn in fnames[:60])
        more = f'<li class="muted">… +{len(fnames)-60} more</li>' if len(fnames) > 60 else ""
        return f'<details open><summary>{esc(name)} <span class="count">{len(fnames)}</span></summary><ul>{items}{more}</ul></details>'

    relay_sections = "".join(render_group(name, files) for name, files in relay_groups.items() if files)
    proto_rows = "".join(f'<li class="mono"><span class="relay-tag">PROTO</span>{esc(fn)}</li>' for fn in proto)
    agent_rows = "".join(f'<li class="mono"><span class="relay-tag">AGENT</span>{esc(fn)}</li>' for fn in agents)

    css = """:root{--bg:#0b0d12;--bg2:#11151c;--bg3:#1a2030;--text:#e8eaf0;--muted:#a0a0b0;--accent:#00d4ff;--accent2:#5fffd0;--crit:#ff5070;--high:#9be37b;--warn:#ffb84a;--bord:#21283a;--link:#7ec9ff;--mono:'JetBrains Mono','SF Mono',ui-monospace,Consolas,monospace}*{box-sizing:border-box}html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font:15px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}a{color:var(--link);text-decoration:none}a:hover{text-decoration:underline}.container{max-width:1480px;margin:0 auto;padding:24px 28px 96px}header.banner{border:1px solid var(--bord);background:linear-gradient(180deg,#10141c,#0b0d12);border-radius:14px;padding:26px 30px;margin-bottom:24px;display:flex;flex-direction:column;gap:14px}.brand{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.brand h1{margin:0;font-size:24px;letter-spacing:.5px}.brand .tag{background:rgba(0,212,255,0.12);color:var(--accent);border:1px solid rgba(0,212,255,0.3);padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;letter-spacing:.3px;text-transform:uppercase}.brand meta{color:var(--muted);font-size:13px}.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-top:8px}.kpi{border:1px solid var(--bord);border-radius:10px;padding:14px 16px;background:var(--bg2)}.kpi .n{font-size:26px;font-weight:600;color:var(--accent)}.kpi .l{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}nav.tabs{position:sticky;top:0;background:rgba(11,13,18,0.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--bord);z-index:10;padding:10px 0;margin-bottom:24px}nav.tabs ul{display:flex;list-style:none;margin:0;padding:0;gap:6px;flex-wrap:wrap}nav.tabs a{padding:8px 14px;display:block;border-radius:8px;color:var(--muted);font-weight:500}nav.tabs a:hover{background:var(--bg3);color:var(--text);text-decoration:none}section{margin:24px 0}section h2{font-size:18px;letter-spacing:.4px;margin:28px 0 14px;display:flex;align-items:center;gap:10px}section h2::before{content:'';width:4px;height:18px;border-radius:2px;background:var(--accent)}.muted{color:var(--muted)}.mono{font-family:var(--mono);font-size:13px}table{width:100%;border-collapse:collapse;background:var(--bg2);border:1px solid var(--bord);border-radius:10px;overflow:hidden;font-size:13px}th{text-align:left;background:var(--bg3);padding:10px 12px;font-weight:500;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--bord)}td{padding:10px 12px;border-bottom:1px solid rgba(33,40,58,0.5);vertical-align:top}tbody tr:last-child td{border-bottom:none}tbody tr:hover{background:rgba(0,212,255,0.04)}.sched{color:var(--accent);font-weight:500}.cron-group td{background:var(--bg3);color:var(--accent2);font-size:12px;text-transform:uppercase;letter-spacing:.5px;padding:8px 12px}details{background:var(--bg2);border:1px solid var(--bord);border-radius:10px;margin-bottom:8px;padding:10px 14px}details summary{cursor:pointer;font-weight:500;display:flex;justify-content:space-between;align-items:center;list-style:none}details summary::-webkit-details-marker{display:none}.count{background:var(--bg3);color:var(--muted);font-family:var(--mono);font-size:11px;padding:2px 8px;border-radius:10px}details ul{margin:10px 0 4px;padding-left:18px;max-height:520px;overflow:auto;font-size:12.5px}.relay-tag{display:inline-block;background:rgba(94,255,208,0.12);color:var(--accent2);font-family:var(--mono);font-size:10px;padding:1px 6px;border-radius:8px;margin-right:8px;text-transform:uppercase;letter-spacing:.4px;min-width:50px;text-align:center}.live-card{border:1px solid var(--bord);background:var(--bg2);border-radius:10px;padding:14px 16px;margin-bottom:10px;display:grid;grid-template-columns:160px 1fr;gap:14px;align-items:start}.live-name{font-weight:500;color:var(--accent2);font-size:12px;text-transform:uppercase;letter-spacing:.5px}.live-cmd{font-family:var(--mono);font-size:12px;color:var(--muted);white-space:pre-wrap;word-break:break-all;background:var(--bg3);padding:8px 10px;border-radius:6px;border:1px solid var(--bord);margin-top:6px}.legend{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;margin-bottom:14px;align-items:center}.legend .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:middle}.legend .critical .dot{background:var(--crit)}.legend .high .dot{background:var(--high)}.legend .medium .dot{background:var(--warn)}.filter{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center}.filter input[type=search]{flex:1;min-width:240px;padding:8px 12px;background:var(--bg2);border:1px solid var(--bord);border-radius:8px;color:var(--text);font-family:var(--mono);font-size:13px}.filter input[type=search]:focus{outline:none;border-color:var(--accent)}.tag-pill{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500;margin:2px 4px 2px 0}.t-high{background:rgba(155,227,123,0.15);color:var(--high)}.t-med{background:rgba(255,184,74,0.15);color:var(--warn)}.t-crit{background:rgba(255,80,112,0.18);color:var(--crit)}footer{margin-top:48px;padding-top:20px;border-top:1px solid var(--bord);color:var(--muted);font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:18px}.tile{border:1px solid var(--bord);background:var(--bg2);border-radius:10px;padding:16px}.tile h3{margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.4px;color:var(--accent)}.list-sparse{margin:0;padding-left:18px}.list-sparse li{margin:4px 0;font-size:12.5px;line-height:1.5}.badge-list{line-height:1.9}@media (max-width:780px){.container{padding:16px 12px}table{font-size:11.5px}th,td{padding:7px 8px}.live-card{grid-template-columns:1fr}}"""

    js = """document.querySelectorAll('input[data-filter-target]').forEach(inp=>{inp.addEventListener('input',e=>{const q=inp.value.toLowerCase();const sel=inp.dataset.filterTarget;document.querySelectorAll(sel).forEach(row=>{row.style.display=!q||row.textContent.toLowerCase().includes(q)?'':'none';});});});"""

    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TNF Process Atlas — {esc(now)}</title><style>{css}</style></head><body><div class="container">
<header class="banner"><div class="brand"><h1>The New Fuse — Process Atlas</h1><span class="tag">live snapshot</span><meta>Generated {esc(now)} from local repo + crontab + pgrep</meta></div>
<div class="summary">
<div class="kpi"><div class="n">{cron_total}</div><div class="l">Cron processes</div></div>
<div class="kpi"><div class="n">{live_total}</div><div class="l">Live processes</div></div>
<div class="kpi"><div class="n">{len(pkgs)}</div><div class="l">Packages</div></div>
<div class="kpi"><div class="n">{len(apps)}</div><div class="l">Apps</div></div>
<div class="kpi"><div class="n">{len(proto)}</div><div class="l">Protocol scripts</div></div>
<div class="kpi"><div class="n">{len(agents)}</div><div class="l">Agent scripts</div></div>
<div class="kpi"><div class="n">{len(rc)}</div><div class="l">Relay-core TS</div></div>
</div></header>
<nav class="tabs"><ul>
<li><a href="#arch">Architecture</a></li>
<li><a href="#cron">Cron processes</a></li>
<li><a href="#live">Live processes</a></li>
<li><a href="#protocols">Protocols & adapters</a></li>
<li><a href="#agents">Agent scripts</a></li>
<li><a href="#relay">Relay-core sources</a></li>
<li><a href="#apps">Apps surface</a></li>
<li><a href="#packages">Packages</a></li>
</ul></nav>
<section id="arch"><h2>Architecture</h2><div class="cols">
<div class="tile"><h3>Spine</h3><ul class="list-sparse">
<li><span class="tag-pill t-crit">CRIT</span><span class="mono">packages/relay-core/src/master-clock.ts</span> — phase rotation</li>
<li><span class="tag-pill t-crit">CRIT</span><span class="mono">packages/relay-core/src/broker-agent.ts</span> — task dispatcher (BRPOP)</li>
<li><span class="tag-pill t-crit">CRIT</span><span class="mono">packages/relay-core/src/director-agent.ts</span> — escalation reviewer</li>
<li><span class="tag-pill t-high">HIGH</span><span class="mono">packages/relay-core/src/standalone-relay.ts</span> — public HTTP/WS API</li></ul></div>
<div class="tile"><h3>Transports</h3><ul class="list-sparse">
<li><span class="tag-pill t-med">MED</span>Redis pub/sub — <span class="mono">tnf:bus:*</span>, <span class="mono">tnf:master:tasks:realtime</span></li>
<li><span class="tag-pill t-med">MED</span>local Redis↔WS bridge — port <span class="mono">3005</span></li>
<li><span class="tag-pill t-med">MED</span>standalone-relay — port <span class="mono">3007</span></li>
<li><span class="tag-pill t-high">HIGH</span>api (NestJS) — port <span class="mono">3001</span> — production</li>
<li><span class="tag-pill t-high">HIGH</span>frontend (Vite) — port <span class="mono">3000</span> — production</li></ul></div>
<div class="tile"><h3>Cron bands</h3><ul class="list-sparse">
<li><span class="tag-pill t-crit">SUBSTRATE</span> Continuous data acquisition / ranking</li>
<li><span class="tag-pill t-crit">HEALTH</span> System integrity & watchdog</li>
<li><span class="tag-pill t-crit">EVOLUTION</span> Self-improvement & QA flywheel</li></ul></div>
<div class="tile"><h3>Recent fixes</h3><ul class="list-sparse">
<li><span class="tag-pill t-high">2026-06-20</span> <span class="mono">packages/agent</span> — TNF-SELFSUFF-001 (role ordering fix)</li>
<li><span class="tag-pill t-high">2026-06-20</span> <span class="mono">packages/relay-core</span> — setImmediate → setTimeout (broker dispatch)</li>
<li><span class="tag-pill t-med">older</span> OpenClaw / Telegram daemon curl-fallback swap</li></ul></div>
</div></section>
<section id="cron"><h2>Cron processes <span class="muted">({cron_total})</span></h2>
<div class="legend"><span class="critical"><span class="dot"></span>Critical</span><span class="high"><span class="dot"></span>High</span><span class="medium"><span class="dot"></span>Medium / Low</span></div>
<div class="filter"><input type="search" data-filter-target="#cron-table tbody tr.cron-row" placeholder="Filter by name, purpose, depends…" autocomplete="off"></div>
<table id="cron-table"><thead><tr><th>Process</th><th>Schedule</th><th>Purpose</th><th>Significance</th><th>Depends on</th><th>Feeds</th></tr></thead><tbody>{cron_table_rows}</tbody></table></section>
<section id="live"><h2>Live processes <span class="muted">({live_total} via pgrep)</span></h2>
<div class="filter"><input type="search" data-filter-target=".live-card" placeholder="Filter live processes…" autocomplete="off"></div>
{live_cards}</section>
<section id="protocols"><h2>Protocol & adapter scripts <span class="muted">({len(proto)})</span></h2>
<details open><summary>scripts/protocols/ <span class="count">{len(proto)}</span></summary><ul>{proto_rows}</ul></details></section>
<section id="agents"><h2>Agent scripts <span class="muted">({len(agents)})</span></h2>
<details open><summary>scripts/agents/ <span class="count">{len(agents)}</span></summary><ul>{agent_rows}</ul></details></section>
<section id="relay"><h2>Relay-core source map <span class="muted">({len(rc)} .ts files)</span></h2>
<div class="filter"><input type="search" data-filter-target="#relay ul li" placeholder="Filter relay-core sources…" autocomplete="off"></div>
<div id="relay">{relay_sections}</div></section>
<section id="apps"><h2>Apps surface <span class="muted">({len(apps)})</span></h2>
<div class="cols">
<div class="tile"><h3>Core apps</h3><div class="badge-list">{(' '.join(f'<span class="tag-pill t-high">{esc(a)}</span>' for a in apps_core))}</div></div>
<div class="tile"><h3>External / IDE / vendor extensions</h3><div class="badge-list">{(' '.join(f'<span class="tag-pill t-med">{esc(a)}</span>' for a in apps_ext))}</div></div>
</div></section>
<section id="packages"><h2>Packages <span class="muted">({len(pkgs)})</span></h2>
<div class="filter"><input type="search" data-filter-target="#packages .badge-list .tag-pill" placeholder="Filter packages…" autocomplete="off"></div>
<div id="packages" class="tile"><h3>All packages</h3>
<div class="badge-list">{(' '.join(f'<span class="tag-pill t-med">{esc(p)}</span>' for p in pkgs))}</div></div></section>
<footer><span>TNF Process Atlas · {esc(str(REPO))}</span><span>Generated {esc(now)} UTC</span></footer>
</div><script>{js}</script></body></html>"""


def _emit_digest(path, payload):
    s = payload["summaries"]
    apps_ext_set = {"chrome-extension","cloud-sandbox","demo-agent-extension","external",
                    "gemini-bridge-extension","mcp-servers","myphoneremote-api",
                    "nexus-orchestrator","openclaw","picoclaw-overseer","relay-server",
                    "skideancer-ide","stripe-provider-bridge","tauri-desktop","telegram-mcp",
                    "vscode-extension","adk-gateway","ai-arcade","casin8-games","poker-room",
                    "virtual-library-blueprints","visualization-hub","zeroclaw-sandbox"}
    L = []
    L.append("# TNF Process Atlas — Turn-Zero Context Digest")
    L.append("")
    L.append(f"_Snapshot: {payload['now']}  ·  Generated by: {payload['generated_by']}_")
    L.append("")
    L.append("## Topology at a glance")
    L.append(f"- Cron processes: **{s['cron_count']}**")
    L.append(f"- Live long-lived processes (pgrep): **{s['live_count']}**")
    L.append(f"- Packages: **{s['packages_count']}**")
    L.append(f"- Apps: **{s['apps_count']}**")
    L.append(f"- Protocol scripts: **{s['proto_count']}**")
    L.append(f"- Agent scripts: **{s['agent_scripts_count']}**")
    L.append(f"- Relay-core TypeScript sources: **{s['relay_core_ts_count']}**")
    L.append("")
    L.append("## Live processes (pgrep, ground truth)")
    L.append("")
    L.append("| Role | Command |")
    L.append("|---|---|")
    for l in payload["live"]:
        safe_cmd = l["cmd"].replace("|", "\\|")
        L.append(f"| {l['role']} | `{safe_cmd}` |")
    L.append("")
    L.append("## Cron processes")
    L.append("")
    L.append("| Process ID | Schedule |")
    L.append("|---|---|")
    for c in payload["cron"]:
        L.append(f"| `{c['id']}` | `{c['sched']}` |")
    L.append("")
    apps_core = sorted(set(payload["apps"]) - apps_ext_set)
    apps_ext = sorted(set(payload["apps"]) & apps_ext_set)
    L.append("## App surface")
    L.append("")
    L.append("Core: " + ", ".join(f"`{a}`" for a in apps_core))
    L.append("")
    L.append("External / IDE / vendor: " + ", ".join(f"`{a}`" for a in apps_ext))
    L.append("")
    L.append("## Where this digest came from")
    L.append("")
    L.append("- HTML: `.verifier/tnf-process-atlas.html` (open in browser)")
    L.append("- JSON payload: `.verifier/process-atlas.payload.json` (machine-readable)")
    L.append("- Verification: `.verifier/process-atlas.verify.json` (last-run gates)")
    L.append("")
    L.append("## How to refresh")
    L.append("")
    L.append("```bash")
    L.append("python3 .verifier/generate-process-atlas.py")
    L.append("```")
    path.write_text("\n".join(L))


def _fleet_paused():
    """Fleet-wide pause gate (2026-07-21), same semantics as
    scripts/lib/tnf-fleet-mode.cjs: missing file -> not paused; a file that
    exists but fails to parse fails SAFE to paused (uncertainty should
    resolve to the safer state for an operator kill-switch)."""
    import json as _json
    mode_file = Path.home() / ".tnf" / "fleet" / "mode.json"
    if not mode_file.exists():
        return False
    try:
        data = _json.loads(mode_file.read_text())
        return data.get("mode") in ("paused", "injection-paused")
    except Exception:
        return True


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--check", action="store_true", help="verification only (no regen)")
    p.add_argument("--json", action="store_true", help="emit JSON payload only")
    args = p.parse_args()

    if _fleet_paused():
        import json as _json
        print(_json.dumps({"ok": True, "skipped": "fleet-paused"}))
        return

    payload = build_payload()
    ok, findings = verify(payload)

    out_html = VERIFIER / "tnf-process-atlas.html"
    out_json = VERIFIER / "process-atlas.payload.json"
    out_verify = VERIFIER / "process-atlas.verify.json"

    if not args.check:
        out_html.write_text(render_html(payload))
        out_json.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
        # Turn-zero agent-readable digest (markdown)
        _emit_digest(VERIFIER / "process-atlas.digest.md", payload)

    out_verify.write_text(json.dumps({
        "now": payload["now"],
        "ok": ok,
        "summaries": payload["summaries"],
        "findings": findings,
    }, indent=2, ensure_ascii=False))

    if args.json:
        print(json.dumps(payload, indent=2, ensure_ascii=False))

    print(f"OK={ok} cron={payload['summaries']['cron_count']} live={payload['summaries']['live_count']} pkgs={payload['summaries']['packages_count']} apps={payload['summaries']['apps_count']} rel-ts={payload['summaries']['relay_core_ts_count']}")
    for k, v in findings:
        print(f"  [{k}] {v}")
    sys.exit(0 if ok else 2)


if __name__ == "__main__":
    main()
