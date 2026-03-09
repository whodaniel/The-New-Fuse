#!/usr/bin/env python3
import argparse
from pathlib import Path


def collect_names(path: Path):
    if not path.exists():
        return []
    return sorted([p.name for p in path.iterdir() if p.is_dir()])


def collect_workflows(path: Path):
    if not path.exists():
        return []
    return sorted([p.name for p in path.glob('*.yml')])


def node_id(prefix: str, value: str):
    return f"{prefix}_{value.replace('-', '_').replace('.', '_')}"


def build_mermaid(apps, packages, workflows):
    lines = [
        "flowchart LR",
        "  subgraph Surface[User Surface]",
        "    Web[apps/frontend]",
        "    Router[React Router + Route Catalog]",
        "    Flow[ReactFlow Workflow UI]",
        "  end",
        "  subgraph Backend[Backend Systems]",
        "    Gateway[apps/api-gateway (NestJS)]",
        "    Core[Core APIs + Services]",
        "    Data[(Postgres + Redis + VectorDB)]",
        "  end",
        "  subgraph Ops[Continuous Assurance]",
        "    CI[GitHub Actions live-link-monitor]",
        "    Audits[Link/Semantic/Auth audits]",
        "    Scorecard[Self-improvement scorecard]",
        "  end",
        "  Web --> Router",
        "  Router --> Gateway",
        "  Flow --> Gateway",
        "  Gateway --> Core",
        "  Core --> Data",
        "  CI --> Audits",
        "  Audits --> Scorecard",
        "  Scorecard --> Web",
        "",
        "  subgraph Apps[Detected apps/*]",
    ]

    for name in apps:
        lines.append(f"    {node_id('app', name)}[{name}]")

    lines += [
        "  end",
        "  subgraph Packages[Detected packages/*]",
    ]

    for name in packages:
        lines.append(f"    {node_id('pkg', name)}[{name}]")

    lines += [
        "  end",
        "  subgraph Workflows[Detected .github/workflows]",
    ]

    for name in workflows:
        lines.append(f"    {node_id('wf', name)}[{name}]")

    lines += ["  end"]

    for name in apps:
        lines.append(f"  Web -.maps.-> {node_id('app', name)}")

    for name in packages:
        lines.append(f"  Gateway -.depends on.-> {node_id('pkg', name)}")

    for name in workflows:
        lines.append(f"  {node_id('wf', name)} --> Audits")

    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    out = Path(args.out).resolve()

    apps = collect_names(repo / "apps")
    packages = collect_names(repo / "packages")
    workflows = collect_workflows(repo / ".github" / "workflows")

    mermaid = build_mermaid(apps, packages, workflows)

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(mermaid, encoding="utf-8")

    md_out = out.with_suffix('.md')
    md_out.write_text(
        "# TNF Master Framework\n\n"
        "Generated from repository structure for continuous architecture visibility.\n\n"
        "```mermaid\n" + mermaid + "```\n",
        encoding='utf-8',
    )

    print(f"Wrote {out}")
    print(f"Wrote {md_out}")


if __name__ == "__main__":
    main()
