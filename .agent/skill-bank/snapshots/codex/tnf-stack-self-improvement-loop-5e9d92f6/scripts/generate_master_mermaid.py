#!/usr/bin/env python3
import argparse
from pathlib import Path


def collect_nodes(repo: Path):
    apps = sorted([p.name for p in (repo / "apps").glob("*") if p.is_dir()]) if (repo / "apps").exists() else []
    packages = sorted([p.name for p in (repo / "packages").glob("*") if p.is_dir()]) if (repo / "packages").exists() else []
    workflows = sorted([p.name for p in (repo / ".github" / "workflows").glob("*.yml")]) if (repo / ".github" / "workflows").exists() else []
    return apps, packages, workflows


def make_mermaid(apps, packages, workflows):
    lines = [
        "flowchart LR",
        "  subgraph Client[Client Surface]",
        "    Frontend[apps/frontend]",
        "  end",
        "  subgraph Gateway[API Layer]",
        "    ApiGateway[apps/api-gateway]",
        "  end",
        "  subgraph Workflows[Workflow & Orchestration]",
        "    ReactFlow[ReactFlow UI]",
        "    NestWorkflow[NestJS Workflow APIs]",
        "  end",
        "  Frontend --> ApiGateway",
        "  Frontend --> ReactFlow",
        "  ReactFlow --> NestWorkflow",
        "  ApiGateway --> NestWorkflow",
        "",
        "  subgraph Apps[Detected Apps]",
    ]
    for a in apps:
        lines.append(f"    app_{a.replace('-', '_')}[{a}]")
    lines.append("  end")
    lines.append("  subgraph Packages[Detected Packages]")
    for p in packages:
        lines.append(f"    pkg_{p.replace('-', '_')}[{p}]")
    lines.append("  end")
    lines.append("  subgraph CI[Detected CI Workflows]")
    for w in workflows:
        node = w.replace(".yml", "").replace("-", "_")
        lines.append(f"    wf_{node}[{w}]")
    lines.append("  end")

    for a in apps:
        lines.append(f"  Frontend -.observes.-> app_{a.replace('-', '_')}")
    for p in packages:
        lines.append(f"  ApiGateway -.depends on.-> pkg_{p.replace('-', '_')}")
    for w in workflows:
        node = w.replace(".yml", "").replace("-", "_")
        lines.append(f"  wf_{node} --> Frontend")

    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    out = Path(args.out).resolve()

    apps, packages, workflows = collect_nodes(repo)
    mermaid = make_mermaid(apps, packages, workflows)

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(mermaid, encoding="utf-8")

    md = out.with_suffix(".md")
    md.write_text("# TNF Master Framework\n\n```mermaid\n" + mermaid + "```\n", encoding="utf-8")

    print(f"Wrote {out}")
    print(f"Wrote {md}")


if __name__ == "__main__":
    main()
