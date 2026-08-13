#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * TNF growth audit — read-only inventory of AI/runtime data stores.
 * Diffs against the last snapshot; appends JSONL history; never deletes.
 *
 * Usage:
 *   node scripts/operations/tnf-growth-audit.cjs [--json] [--quiet] [--no-save]
 */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = process.cwd();
const HOME = os.homedir();
const TNF_HOME = process.env.TNF_HOME || path.join(HOME, ".tnf");
const AUDIT_DIR = path.join(TNF_HOME, "growth-audit");
const SNAPSHOT_PATH = path.join(AUDIT_DIR, "last-snapshot.json");
const HISTORY_PATH = path.join(ROOT, ".agent/runtime-logs/growth-audit.jsonl");

const WARN_FREE_MB = Number(process.env.TNF_GROWTH_WARN_FREE_MB || 500);
const CRIT_FREE_MB = Number(process.env.TNF_GROWTH_CRIT_FREE_MB || 200);
const GROWTH_WARN_PCT = Number(process.env.TNF_GROWTH_WARN_PCT || 25);

const TARGETS = [
  {
    id: "hermes-state-db",
    label: "Hermes session store",
    path: path.join(HOME, ".hermes/state.db"),
    kind: "file",
    owner: "hermes",
    remediation: "pnpm ops:hermes:retention (after ≥1GB free on volume)",
  },
  {
    id: "hermes-logs",
    label: "Hermes logs",
    path: path.join(HOME, ".hermes/logs"),
    kind: "dir",
    owner: "hermes",
    remediation: "rotate or truncate files older than 7d (manual approval)",
  },
  {
    id: "hermes-snapshots",
    label: "Hermes state snapshots",
    path: path.join(HOME, ".hermes/state-snapshots"),
    kind: "dir",
    owner: "hermes",
    remediation: "pnpm ops:hermes:retention removes duplicate pre-update dirs",
  },
  {
    id: "hermes-cron-output",
    label: "Hermes cron output",
    path: path.join(HOME, ".hermes/cron/output"),
    kind: "dir",
    owner: "hermes",
  },
  {
    id: "tnf-home",
    label: "TNF home (~/.tnf)",
    path: TNF_HOME,
    kind: "dir",
    owner: "tnf",
  },
  {
    id: "tnf-local-json",
    label: "TNF local JSON store",
    path: path.join(HOME, ".local/share/tnf"),
    kind: "dir",
    owner: "tnf",
  },
  {
    id: "runtime-logs",
    label: "Repo runtime logs",
    path: path.join(ROOT, ".agent/runtime-logs"),
    kind: "dir",
    owner: "tnf-swarm",
    remediation: "bash scripts/operations/swarm-disk-retention.sh",
  },
  {
    id: "cursor-chats",
    label: "Cursor chat stores",
    path: path.join(HOME, ".cursor/chats"),
    kind: "dir",
    owner: "cursor-ide",
    remediation: "IDE-side; prune old chat DBs from Cursor settings",
  },
  {
    id: "opencode-store",
    label: "OpenCode local store",
    path: path.join(HOME, ".local/share/opencode"),
    kind: "dir",
    owner: "opencode",
  },
  {
    id: "huggingface-cache",
    label: "HuggingFace cache",
    path: path.join(HOME, ".cache/huggingface"),
    kind: "dir",
    owner: "ml",
    remediation: "safe to delete unused model weights when disk critical",
  },
  {
    id: "turbo-cache",
    label: "Turbo build cache",
    path: path.join(ROOT, ".turbo"),
    kind: "dir",
    owner: "build",
    remediation: "rm -rf .turbo when disk critical (rebuilds on next build)",
  },
  {
    id: "pnpm-store",
    label: "pnpm content store",
    path: path.join(HOME, "Library/pnpm/store"),
    kind: "dir",
    owner: "build",
    remediation: "pnpm store prune (included in swarm-disk-retention)",
  },
];

function parseArgs(argv) {
  const flags = { json: false, quiet: false, save: true };
  for (const arg of argv) {
    if (arg === "--json") flags.json = true;
    if (arg === "--quiet") flags.quiet = true;
    if (arg === "--no-save") flags.save = false;
    if (arg === "-h" || arg === "--help") flags.help = true;
  }
  return flags;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "n/a";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function duBytes(targetPath, kind) {
  if (!fs.existsSync(targetPath)) {
    return { bytes: 0, exists: false };
  }
  if (kind === "file") {
    const st = fs.statSync(targetPath);
    return { bytes: st.size, exists: true, mtime: st.mtime.toISOString() };
  }
  const result = spawnSync("du", ["-sk", targetPath], { encoding: "utf8", timeout: 120_000 });
  if (result.status !== 0 || !result.stdout) {
    return { bytes: null, exists: true, error: (result.stderr || "du failed").trim() };
  }
  const kb = Number.parseInt(result.stdout.split(/\s+/)[0], 10);
  return { bytes: Number.isFinite(kb) ? kb * 1024 : null, exists: true };
}

function diskFreeBytes() {
  const result = spawnSync("df", ["-k", "/"], { encoding: "utf8" });
  if (result.status !== 0 || !result.stdout) return null;
  const lines = result.stdout.trim().split("\n");
  if (lines.length < 2) return null;
  const cols = lines[1].trim().split(/\s+/);
  const availKb = Number.parseInt(cols[3], 10);
  const capacity = cols[4] || "";
  return {
    bytes: Number.isFinite(availKb) ? availKb * 1024 : null,
    capacity,
  };
}

function loadSnapshot() {
  try {
    return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
  } catch {
    return null;
  }
}

function pctGrowth(prev, next) {
  if (!prev || prev <= 0) return next > 0 ? 100 : 0;
  return ((next - prev) / prev) * 100;
}

function severityForTarget(entry, prevBytes) {
  const issues = [];
  if (entry.bytes == null) return issues;
  if (entry.bytes >= 500 * 1024 * 1024) issues.push("large");
  if (prevBytes != null && prevBytes > 0) {
    const growth = pctGrowth(prevBytes, entry.bytes);
    if (growth >= GROWTH_WARN_PCT) issues.push(`grew_${Math.round(growth)}pct`);
  }
  return issues;
}

function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    console.log("Usage: node scripts/operations/tnf-growth-audit.cjs [--json] [--quiet] [--no-save]");
    process.exit(0);
  }

  const timestamp = new Date().toISOString();
  const prev = loadSnapshot();
  const disk = diskFreeBytes();
  const freeMb = disk?.bytes != null ? disk.bytes / (1024 * 1024) : null;

  const targets = TARGETS.map((t) => {
    const measured = duBytes(t.path, t.kind);
    const prevEntry = prev?.targets?.find((p) => p.id === t.id);
    const prevBytes = prevEntry?.bytes ?? null;
    const issues = severityForTarget(measured, prevBytes);
    return {
      id: t.id,
      label: t.label,
      path: t.path,
      owner: t.owner,
      remediation: t.remediation || null,
      exists: measured.exists,
      bytes: measured.bytes,
      bytesHuman: measured.bytes != null ? formatBytes(measured.bytes) : "n/a",
      mtime: measured.mtime || null,
      error: measured.error || null,
      prevBytes,
      prevBytesHuman: prevBytes != null ? formatBytes(prevBytes) : null,
      growthPct: prevBytes != null && measured.bytes != null ? pctGrowth(prevBytes, measured.bytes) : null,
      issues,
    };
  });

  const diskSeverity =
    freeMb == null ? "unknown" : freeMb <= CRIT_FREE_MB ? "critical" : freeMb <= WARN_FREE_MB ? "warn" : "ok";

  const report = {
    schema: "tnf.growth-audit/v1",
    timestamp,
    repoRoot: ROOT,
    disk: {
      path: "/",
      freeBytes: disk?.bytes ?? null,
      freeHuman: disk?.bytes != null ? formatBytes(disk.bytes) : "n/a",
      capacity: disk?.capacity ?? null,
      severity: diskSeverity,
    },
    targets,
    flags: {
      warnFreeMb: WARN_FREE_MB,
      critFreeMb: CRIT_FREE_MB,
      growthWarnPct: GROWTH_WARN_PCT,
    },
    summary: {
      targetCount: targets.length,
      missing: targets.filter((t) => !t.exists).length,
      large: targets.filter((t) => t.issues.includes("large")).length,
      growing: targets.filter((t) => t.issues.some((i) => i.startsWith("grew_"))).length,
      topBySize: [...targets]
        .filter((t) => t.bytes != null)
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 5)
        .map((t) => ({ id: t.id, bytesHuman: t.bytesHuman, path: t.path })),
    },
  };

  if (flags.save) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
    fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(report, null, 2));
    fs.appendFileSync(HISTORY_PATH, `${JSON.stringify(report)}\n`);
  }

  const exitCode = diskSeverity === "critical" ? 2 : diskSeverity === "warn" || report.summary.growing > 0 ? 1 : 0;

  if (flags.json) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(exitCode);
  }

  if (!flags.quiet) {
    console.log("\nTNF Growth Audit");
    console.log("=".repeat(60));
    console.log(`Time:     ${timestamp}`);
    console.log(
      `Disk:     ${report.disk.freeHuman} free (${report.disk.capacity || "?"} used) — ${diskSeverity.toUpperCase()}`
    );
    console.log(`Snapshot: ${SNAPSHOT_PATH}`);
    console.log(`History:  ${HISTORY_PATH}`);
    console.log("");
    console.log("Top targets by size:");
    for (const t of report.summary.topBySize) {
      const row = targets.find((x) => x.id === t.id);
      const growth =
        row?.growthPct != null && Number.isFinite(row.growthPct)
          ? ` (${row.growthPct >= 0 ? "+" : ""}${row.growthPct.toFixed(1)}% since last)`
          : "";
      const flag = row?.issues?.length ? ` [${row.issues.join(", ")}]` : "";
      console.log(`  ${t.bytesHuman.padStart(10)}  ${t.id}${growth}${flag}`);
      console.log(`             ${t.path}`);
    }
    console.log("");
    if (diskSeverity !== "ok") {
      console.log("Disk headroom is low — defer heavy builds/VACUUM until space is recovered.");
      console.log("Suggested: pnpm ops:growth-audit && pnpm ops:hermes:retention (when ≥1GB free)");
    }
    console.log("");
  }

  process.exit(exitCode);
}

main();
