import os
import json
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..", "..")))
WORKSPACE_ROOT = os.path.abspath(os.getenv("TNF_WORKSPACE_DIR", os.path.join(PROJECT_ROOT, "..")))
KB_ROOT = os.path.abspath(os.getenv("TNF_KB_DIR", os.path.join(WORKSPACE_ROOT, "my-ai-knowledge-base")))

# Paths
KNOWLEDGE_BASE_PATH = os.path.join(KB_ROOT, "AI_Knowledge_Base.md")
LIBRARY_PATH = os.path.join(KB_ROOT, "video-library", "ai_video_library.html")
OUTPUT_PATH = os.path.join(
    PROJECT_ROOT,
    "apps",
    "frontend",
    "public",
    "visualizations",
    "TNF_INTELLIGENCE_DASHBOARD.html",
)

def get_artifacts():
    if not os.path.exists(KNOWLEDGE_BASE_PATH):
        return {}
    
    with open(KNOWLEDGE_BASE_PATH, 'r') as f:
        content = f.read()
    
    # Split by "---"
    sections = content.split("---")
    artifacts = {}
    
    for sec in sections:
        # Extract Index
        idx_match = re.search(r"## #(\d+):", sec)
        if not idx_match:
            continue
        idx = int(idx_match.group(1))
        
        # Extract URL
        url_match = re.search(r"\*\*URL\*\*: (https?://[^\s\n]+)", sec)
        url = url_match.group(1) if url_match else "#"
        
        # Extract Summary
        summary_match = re.search(r"### Summary\n(.*?)(?=\n###|\n---|$)", sec, re.DOTALL)
        summary = summary_match.group(1).strip().replace('"', '&quot;') if summary_match else ""
        
        # Extract Classifications
        classification = "Strategic" # Default
        if "- **Procedural:**" in sec:
            classification = "Procedural"
        if "- **Governance:**" in sec:
            # If both exist, we'll pick Governance as "higher priority" or use a hybrid approach
            # For now, let's just stick to the first one found or a dominant one
            if "- **Procedural:**" in sec:
                 classification = "Procedural"
            if "- **Governance:**" in sec:
                 classification = "Governance"
        
        # Refine classification logic
        if "[STATUS:PURGE]" in sec:
            classification = "Purged"
        elif "[STATUS:DUPLICATE]" in sec:
            classification = "Duplicate"
        
        artifacts[idx] = {
            "url": url,
            "summary": summary,
            "class": classification
        }
    
    return artifacts

artifacts = get_artifacts()
total = 647 # Known total

# Generate HTML
html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>TNF Intelligence Density Dashboard v2.0</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body {{ font-family: 'Inter', sans-serif; background: #020617; color: #f8fafc; margin: 0; padding: 40px; line-height: 1.5; }}
        .header {{ display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; }}
        h1 {{ font-weight: 800; letter-spacing: -0.025em; margin: 0; font-size: 2.25rem; color: #fff; }}
        .status-badge {{ background: #059669; color: #fff; padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }}
        
        .stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-bottom: 40px; }}
        .stat-card {{ background: #0f172a; padding: 24px; border-radius: 12px; border: 1px solid #1e293b; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }}
        .stat-val {{ font-size: 2.5rem; font-weight: 800; display: block; margin-bottom: 4px; color: #fff; }}
        .stat-label {{ color: #94a3b8; font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; }}
        
        .filters {{ display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }}
        .filter-btn {{ background: #1e293b; border: 1px solid #334155; color: #94a3b8; padding: 8px 16px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }}
        .filter-btn:hover {{ border-color: #475569; color: #f1f5f9; }}
        .filter-btn.active {{ background: #3b82f6; border-color: #3b82f6; color: #fff; }}
        
        .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(24px, 1fr)); gap: 6px; }}
        .cell {{ width: 100%; aspect-ratio: 1; border-radius: 4px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; position: relative; border: 1px solid rgba(255,255,255,0.05); }}
        .cell:hover {{ transform: scale(1.5); z-index: 50; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.5); }}
        
        /* Plane Colors */
        .c-empty {{ background: #0f172a; opacity: 0.3; }}
        .c-Strategic {{ background: #3b82f6; box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.5); }}
        .c-Procedural {{ background: #10b981; box-shadow: inset 0 0 10px rgba(16, 185, 129, 0.5); }}
        .c-Governance {{ background: #f59e0b; box-shadow: inset 0 0 10px rgba(245, 158, 11, 0.5); }}
        .c-Purged {{ background: #475569; opacity: 0.5; }}
        .c-Duplicate {{ background: #1e293b; border: 1px dashed #475569; }}

        /* Tooltip style */
        .tooltip {{ visibility: hidden; width: 240px; background-color: #1e293b; color: #fff; text-align: left; border-radius: 8px; padding: 12px; position: absolute; z-index: 100; bottom: 125%; left: 50%; transform: translateX(-50%); opacity: 0; transition: opacity 0.3s; font-size: 0.75rem; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); pointer-events: none; }}
        .cell:hover .tooltip {{ visibility: visible; opacity: 1; }}
        .tooltip h4 {{ margin: 0 0 8px 0; font-size: 0.875rem; color: #3b82f6; }}
        .tooltip p {{ margin: 0; color: #cbd5e1; line-height: 1.4; }}
        
        .legend {{ display: flex; gap: 24px; margin-top: 40px; background: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid #1e293b; }}
        .legend-item {{ display: flex; align-items: center; gap: 10px; font-size: 0.875rem; font-weight: 600; color: #94a3b8; }}
        .box {{ width: 16px; height: 16px; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>TNF Intelligence Density Map</h1>
        <span class="status-badge">[STATUS: SYNCHRONIZED]</span>
    </div>

    <div class="stats-grid">
        <div class="stat-card"><span class="stat-val">{total}</span><span class="stat-label">Master Library</span></div>
        <div class="stat-card"><span class="stat-val">{len([v for v in artifacts.values() if v['class'] != 'Purged'])}</span><span class="stat-label">Actionable Artifacts</span></div>
        <div class="stat-card"><span class="stat-val">{len([v for v in artifacts.values() if v['class'] == 'Procedural'])}</span><span class="stat-label">Procedural Forge</span></div>
        <div class="stat-card"><span class="stat-val">{len([v for v in artifacts.values() if v['class'] == 'Governance'])}</span><span class="stat-label">Governance Gates</span></div>
    </div>

    <div class="filters">
        <button class="filter-btn active" onclick="filterCells('all')">Show All</button>
        <button class="filter-btn" onclick="filterCells('Strategic')">Strategic</button>
        <button class="filter-btn" onclick="filterCells('Procedural')">Procedural</button>
        <button class="filter-btn" onclick="filterCells('Governance')">Governance</button>
        <button class="filter-btn" onclick="filterCells('Purged')">Purged/Duplicate</button>
    </div>

    <div class="grid">
"""

for i in range(1, total + 1):
    data = artifacts.get(i, {"url": "#", "summary": "No data extracted yet.", "class": "empty"})
    cl = data["class"]
    url = data["url"]
    summary = data["summary"]
    
    html += f"""
        <div class="cell c-{cl}" data-class="{cl}" onclick="window.open('{url}', '_blank')">
            <div class="tooltip">
                <h4>Video #{i}</h4>
                <p>{summary[:200]}{'...' if len(summary) > 200 else ''}</p>
                <div style="margin-top:8px; color:#94a3b8; font-style:italic;">Click to open source →</div>
            </div>
        </div>
"""

html += """
    </div>

    <div class="legend">
        <div class="legend-item"><div class="box c-Strategic"></div> Strategic</div>
        <div class="legend-item"><div class="box c-Procedural"></div> Procedural</div>
        <div class="legend-item"><div class="box c-Governance"></div> Governance</div>
        <div class="legend-item"><div class="box c-Purged"></div> Purged</div>
        <div class="legend-item"><div class="box c-Duplicate"></div> Duplicate</div>
    </div>

    <script>
        function filterCells(className) {
            const cells = document.querySelectorAll('.cell');
            const buttons = document.querySelectorAll('.filter-btn');
            
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            cells.forEach(cell => {
                if (className === 'all') {
                    cell.style.opacity = '1';
                    cell.style.transform = 'scale(1)';
                } else if (cell.dataset.class === className) {
                    cell.style.opacity = '1';
                    cell.style.transform = 'scale(1.1)';
                } else if (className === 'Purged' && (cell.dataset.class === 'Purged' || cell.dataset.class === 'Duplicate')) {
                    cell.style.opacity = '1';
                    cell.style.transform = 'scale(1.1)';
                } else {
                    cell.style.opacity = '0.1';
                    cell.style.transform = 'scale(0.9)';
                }
            });
        }
    </script>
</body>
</html>
"""

with open(OUTPUT_PATH, 'w') as f:
    f.write(html)
print(f"FORGE: Dashboard 2.0 generated at {OUTPUT_PATH}")
