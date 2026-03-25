#!/usr/bin/env python3
"""Generate a browser report with copy-ready per-asset containers from a checklist CSV."""

from __future__ import annotations

import argparse
import csv
import html
from pathlib import Path


def _read_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _default_screen_loc(group: str, ui_surface: str) -> str:
    m = {
        "Brand + Shell": "Global shell across all screens",
        "Poker Table and Environment": "Live Table Interface central stage",
        "Chips, Pot, and Markers": "Live Table Interface seat/pot zones",
        "Cards and Card Motion Props": "Live Table Interface card and FX zones",
        "Seats, Avatars, Agent Identity": "Live Table + Agent Ops identity zones",
        "HUD Panels and Utility Components": "Trust/diagnostics/sponsor panel regions",
        "Action Controls": "Live action bar",
        "Tournament-Specific Graphics": "Tournaments & Sit & Go views",
        "Trust, Error, and Resilience States": "Trust panel and global overlays",
        "Mobile-First Specific Assets": "Mobile-only shell and controls",
    }
    return m.get(group, ui_surface or "App shell")


def _purpose(code: str, group: str) -> str:
    if "chip_" in code:
        return "Chip denomination/stack visual used in bet and pot readability."
    if "marker_" in code:
        return "Role/state marker for dealer/blinds/all-in clarity."
    if "card_" in code:
        return "Card surface or card FX used in hand presentation."
    if "avatar_" in code or "seat_" in code or "badge_" in code:
        return "Identity and seat-state framing for players/agents."
    if "panel_" in code:
        return "Panel skin/background for HUD or diagnostics blocks."
    if "state_" in code:
        return "Trust/resilience state visual for error and recovery communication."
    if "mobile_" in code:
        return "Mobile-specific chrome/control asset."
    if "tourney_" in code or "blind_" in code or "payout_" in code or "final_table" in code:
        return "Tournament progression and outcome visual context."
    return f"Visual component for {group}."


def _container_text(row: dict[str, str], abs_candidate: str, screen_loc: str) -> str:
    variants = row.get("requiredVariants", "") or "single"
    return (
        f"ASSET: {row.get('assetCode','')}\n"
        f"GROUP: {row.get('groupName','')}\n"
        f"PURPOSE: {_purpose(row.get('assetCode',''), row.get('groupName',''))}\n"
        f"SCREEN LOCATION: {screen_loc}\n"
        f"TARGET SIZE: {row.get('targetSize','')}\n"
        f"REQUIRED VARIANTS: {variants}\n"
        f"BEST LOCAL CANDIDATE: {abs_candidate or 'None (net-new)'}\n"
        f"CANDIDATE SIZE: {row.get('bestCandidateSize','N/A') or 'N/A'}\n"
        "PROMPT: Generate this as a production-ready asset, preserve role semantics, "
        "use exact filename and exact target dimensions, and keep transparency where appropriate.\n"
    )


def _render(rows: list[dict[str, str]], app_root: Path) -> str:
    total = len(rows)
    with_candidate = sum(1 for r in rows if (r.get("bestCandidatePath", "").strip()))
    missing = total - with_candidate

    cards = []
    for i, r in enumerate(rows, start=1):
        rel = (r.get("bestCandidatePath") or "").strip()
        abs_path = str((app_root / rel).resolve()) if rel else ""
        uri = f"file://{abs_path}" if abs_path else ""
        preview = (
            f'<img src="{uri}" alt="{html.escape(r.get("assetCode",""))}" loading="lazy" />'
            if uri
            else '<span class="na">No candidate</span>'
        )
        screen_loc = _default_screen_loc(r.get("groupName", ""), r.get("uiSurface", ""))
        container = html.escape(_container_text(r, abs_path, screen_loc))
        cid = f"c-{i}"

        cards.append(
            f"""
<article class="card">
  <h3>{i}. <code>{html.escape(r.get('assetCode',''))}</code></h3>
  <p><strong>Purpose:</strong> {html.escape(_purpose(r.get('assetCode',''), r.get('groupName','')))}</p>
  <p><strong>Screen Location:</strong> {html.escape(screen_loc)}</p>
  <p><strong>Target Size:</strong> <code>{html.escape(r.get('targetSize',''))}</code></p>
  <p><strong>Variants:</strong> {html.escape(r.get('requiredVariants','') or 'single')}</p>
  <div class="row"><div>{preview}</div><div><code>{html.escape(abs_path or 'No candidate')}</code></div></div>
  <label for="{cid}"><strong>Copy-Ready Container</strong></label>
  <textarea id="{cid}" readonly>{container}</textarea>
  <button data-target="{cid}" class="copy">Copy Container</button>
</article>
"""
        )

    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Asset Browser Report</title>
<style>
body{{font:14px/1.45 ui-sans-serif; background:#0f1220; color:#f1f5ff; margin:0}}main{{max-width:1200px;margin:0 auto;padding:16px}}
section,.card{{background:#171b2e;border:1px solid #2a3250;border-radius:10px;padding:12px;margin-bottom:12px}}
code{{background:#0c1020;border:1px solid #26304f;padding:2px 6px;border-radius:6px;word-break:break-all}}
textarea{{width:100%;min-height:170px;background:#0c1020;color:#e8eeff;border:1px solid #2b3458;border-radius:8px;padding:8px}}
img{{width:84px;height:84px;object-fit:contain;border:1px solid #2b3458;border-radius:8px;background:#0a0d19}}
.row{{display:grid;grid-template-columns:100px 1fr;gap:10px}}.na{{color:#ff5a7a;font-weight:600}}
.copy{{margin-top:8px;background:#10172d;color:#dbe6ff;border:1px solid #31406b;border-radius:6px;padding:6px 10px;cursor:pointer}}
</style></head><body><main>
<section><h1>Asset Browser Report</h1><ul><li>Total: <strong>{total}</strong></li><li>With candidate: <strong>{with_candidate}</strong></li><li>Net-new: <strong>{missing}</strong></li></ul></section>
{''.join(cards)}
</main>
<script>
for (const b of document.querySelectorAll('.copy')) {{
  b.addEventListener('click', async () => {{
    const t = document.getElementById(b.dataset.target);
    if (!t) return;
    try {{ await navigator.clipboard.writeText(t.value); b.textContent='Copied'; setTimeout(()=>b.textContent='Copy Container',1000); }}
    catch {{ b.textContent='Copy Failed'; setTimeout(()=>b.textContent='Copy Container',1000); }}
  }});
}}
</script>
</body></html>"""


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--csv", required=True, help="Checklist CSV path")
    p.add_argument("--app-root", required=True, help="Application root for resolving candidate paths")
    p.add_argument("--out", required=True, help="Output HTML path")
    args = p.parse_args()

    rows = _read_rows(Path(args.csv))
    out = _render(rows, Path(args.app_root))
    out_path = Path(args.out)
    out_path.write_text(out, encoding="utf-8")
    print(out_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
