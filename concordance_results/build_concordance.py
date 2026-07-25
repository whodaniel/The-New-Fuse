#!/usr/bin/env python3
import os, re, sys, gzip, json, time
from collections import Counter

ROOT = "/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse"
OUT = os.path.join(ROOT, "concordance_results")

SKIP_DIRS = {
    "node_modules", ".git", "dist", "build", "out", ".next", ".turbo",
    "__pycache__", ".venv", "venv", "coverage", ".cache", "vendor",
    ".pnpm-store", ".yarn", "concordance_results", ".DS_Store",
}
SKIP_FILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "Cargo.lock",
    "poetry.lock", "composer.lock", "Gemfile.lock",
}
SKIP_SUFFIXES = (".min.js", ".min.css", ".map", ".lock")
MAX_SIZE = 5 * 1024 * 1024

WORD_RE = re.compile(r"[A-Za-z_][A-Za-z0-9_'-]*")

counts = Counter()
files_indexed = 0
total_bytes = 0
skipped_binary = 0
skipped_large = 0

def is_text(path):
    try:
        with open(path, "rb") as f:
            chunk = f.read(8192)
        return b"\x00" not in chunk
    except OSError:
        return False

start = time.time()
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".git")]
    for fn in filenames:
        if fn in SKIP_FILES or fn.endswith(SKIP_SUFFIXES):
            continue
        path = os.path.join(dirpath, fn)
        try:
            st = os.stat(path)
        except OSError:
            continue
        if not os.path.isfile(path) or os.path.islink(path):
            continue
        if st.st_size > MAX_SIZE:
            skipped_large += 1
            continue
        if not is_text(path):
            skipped_binary += 1
            continue
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        except OSError:
            continue
        counts.update(WORD_RE.findall(text))
        files_indexed += 1
        total_bytes += st.st_size

elapsed = time.time() - start
total_occurrences = sum(counts.values())
generated = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

with gzip.open(os.path.join(OUT, "wordcount_full.tsv.gz"), "wt", encoding="utf-8") as f:
    f.write("term\tcount\n")
    for term, c in counts.most_common():
        f.write(f"{term}\t{c}\n")

with open(os.path.join(OUT, "wordcount_summary.txt"), "w", encoding="utf-8") as f:
    f.write("TNF Codebase Word/Term Frequency Count\n")
    f.write("=" * 60 + "\n")
    f.write(f"Generated: {generated}\n")
    f.write(f"Files indexed: {files_indexed}\n")
    f.write(f"Text size: {total_bytes/1048576:.1f} MB\n")
    f.write(f"Unique terms: {len(counts)}\n")
    f.write(f"Total occurrences: {total_occurrences}\n")
    f.write(f"Skipped (binary): {skipped_binary}, (too large): {skipped_large}\n")
    f.write(f"Elapsed: {elapsed:.1f}s\n\n")
    f.write("Top 200 most frequent:\n")
    f.write(f"{'Term':<40}{'Count':>12}\n")
    f.write("-" * 52 + "\n")
    for term, c in counts.most_common(200):
        f.write(f"{term:<40}{c:>12}\n")

with open(os.path.join(OUT, "wordcount_stats.json"), "w", encoding="utf-8") as f:
    json.dump({
        "root": ROOT,
        "generated": generated,
        "files_indexed": files_indexed,
        "text_bytes": total_bytes,
        "unique_terms": len(counts),
        "total_occurrences": total_occurrences,
        "skipped_binary": skipped_binary,
        "skipped_large": skipped_large,
        "elapsed_seconds": round(elapsed, 1),
        "outputs": {
            "full_tsv_gz": os.path.join(OUT, "wordcount_full.tsv.gz"),
            "summary": os.path.join(OUT, "wordcount_summary.txt"),
        },
    }, f, indent=2)

print(f"Done: {files_indexed} files, {len(counts)} unique terms, {total_occurrences} occurrences in {elapsed:.1f}s")
