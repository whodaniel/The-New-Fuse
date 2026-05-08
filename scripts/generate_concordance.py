#!/usr/bin/env python3
"""Generate a concordance of the TNF codebase and upload to Supabase Storage.

Uses a compact binary-ish format: each word entry is stored as a single line
in a gzipped TSV-like file. This avoids the massive JSON overhead that caused
the previous version to time out during serialization.
"""

import os
import re
import json
import sys
import gzip
import time
import struct
from collections import defaultdict
from pathlib import Path

ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUTPUT = ROOT / "concordance_results"

EXCLUDE_DIRS = {
    'node_modules', '.git', '__pycache__', '.cache', 'dist', 'build',
    '.next', '.turbo', 'coverage', '.nyc_output', 'worktrees',
    '.dockerhub', 'logs', 'output', 'reports',
    '.playwright-cli', '.husky', '.vscode', '.github',
    'external', 'archive',
    'page-analysis-results', 'ui-audit-results', 'dogfood-output',
    'test-suite', 'e2e', '.kilocodemodes',
}

SOURCE_EXTENSIONS = {
    '.py', '.js', '.mjs', '.cjs', '.jsx',
    '.ts', '.tsx', '.mts', '.cts',
    '.go', '.rs', '.java', '.kt', '.scala',
    '.cpp', '.c', '.h', '.hpp', '.cc', '.cxx',
    '.sql', '.prisma', '.sh', '.bash', '.zsh',
}

def should_skip_dir(dirname):
    if dirname in EXCLUDE_DIRS:
        return True
    if dirname.endswith('node_modules') or dirname.endswith('.git'):
        return True
    return False

IDENTIFIER_RE = re.compile(r'[A-Za-z_]\w{1,}')

def generate_concordance(root):
    concordance = defaultdict(list)
    file_count = 0
    total_size = 0
    t0 = time.time()

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if not should_skip_dir(d)]
        for f in filenames:
            ext = os.path.splitext(f)[1].lower()
            if ext not in SOURCE_EXTENSIONS:
                continue
            abs_path = os.path.join(dirpath, f)
            rel_path = os.path.relpath(abs_path, root)
            try:
                total_size += os.path.getsize(abs_path)
            except OSError:
                continue
            try:
                with open(abs_path, 'r', encoding='utf-8', errors='replace') as fh:
                    for line_num, line in enumerate(fh, 1):
                        for m in IDENTIFIER_RE.finditer(line):
                            concordance[m.group()].append((rel_path, line_num))
            except Exception:
                continue
            file_count += 1
            if file_count % 2000 == 0:
                el = time.time() - t0
                sys.stderr.write(f"  {file_count} files ({file_count/el:.0f}/s)\n")
                sys.stderr.flush()

    el = time.time() - t0
    sys.stderr.write(f"  Done: {file_count} files in {el:.1f}s\n")
    return concordance, file_count, total_size


def write_outputs(concordance, file_count, total_size):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    sorted_words = sorted(concordance.items(), key=lambda x: -len(x[1]))
    total_occ = sum(len(v) for v in concordance.values())
    generated = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    meta = {
        "root": str(ROOT),
        "generated": generated,
        "files_indexed": file_count,
        "total_size_bytes": total_size,
        "unique_identifiers": len(concordance),
        "total_occurrences": total_occ,
    }

    # --- Compact TSV concordance (gzipped) ---
    # Format per line: WORD\tfile1:line1,line2;file2:line3,line4
    gz_path = OUTPUT / "concordance.tsv.gz"
    sys.stderr.write(f"  Writing TSV concordance...\n")
    sys.stderr.flush()
    t0 = time.time()

    with gzip.open(gz_path, 'wt', encoding='utf-8') as f:
        for word, entries in sorted_words:
            file_refs = defaultdict(list)
            for filepath, line_num in entries:
                file_refs[filepath].append(line_num)
            parts = []
            for filepath, lines in file_refs.items():
                lines_str = ','.join(str(l) for l in lines[:20])
                if len(lines) > 20:
                    lines_str += f'..+{len(lines)-20}'
                parts.append(f"{filepath}:{lines_str}")
            f.write(word + '\t' + ';'.join(parts) + '\n')

    sys.stderr.write(f"  TSV: {os.path.getsize(gz_path)/1024/1024:.1f} MB in {time.time()-t0:.1f}s\n")

    # --- Per-file index (gzipped TSV) ---
    # Format per line: FILEPATH\tword1:line1;word2:line2,line3
    idx_path = OUTPUT / "per_file_index.tsv.gz"
    sys.stderr.write(f"  Writing per-file index...\n")
    sys.stderr.flush()
    t0 = time.time()

    file_index = defaultdict(lambda: defaultdict(list))
    for word, entries in sorted_words:
        for filepath, line_num in entries:
            file_index[filepath][word].append(line_num)

    with gzip.open(idx_path, 'wt', encoding='utf-8') as f:
        for filepath in sorted(file_index):
            parts = []
            for word, lines in file_index[filepath].items():
                lines_str = ','.join(str(l) for l in lines[:10])
                if len(lines) > 10:
                    lines_str += f'..+{len(lines)-10}'
                parts.append(f"{word}:{lines_str}")
            f.write(filepath + '\t' + ';'.join(parts) + '\n')

    sys.stderr.write(f"  Per-file: {os.path.getsize(idx_path)/1024/1024:.1f} MB in {time.time()-t0:.1f}s\n")

    # --- Summary ---
    summary = OUTPUT / "concordance_summary.txt"
    with open(summary, 'w') as f:
        f.write(f"TNF Codebase Concordance\n{'='*60}\n")
        f.write(f"Generated: {generated}\n")
        f.write(f"Files indexed: {file_count}\n")
        f.write(f"Total size: {total_size/1024/1024:.1f} MB\n")
        f.write(f"Unique identifiers: {len(concordance)}\n")
        f.write(f"Total occurrences: {total_occ}\n\n")
        f.write(f"Top 100 most frequent:\n{'Identifier':<35}{'Count':<10}\n{'-'*45}\n")
        for word, entries in sorted_words[:100]:
            f.write(f"{word:<35}{len(entries):<10}\n")
        f.write(f"\nBottom 50 (rarest):\n{'Identifier':<35}{'Count':<10}\n{'-'*45}\n")
        for word, entries in sorted_words[-50:]:
            f.write(f"{word:<35}{len(entries):<10}\n")
        f.write(f"\nFiles with most identifiers:\n")
        file_counts = [(fp, len(words)) for fp, words in file_index.items()]
        file_counts.sort(key=lambda x: -x[1])
        for fp, count in file_counts[:50]:
            f.write(f"  {count:<8} {fp}\n")

    # --- Stats JSON ---
    stats = {
        **meta,
        "output_files": {
            "concordance_tsv_gz": str(gz_path),
            "per_file_index_tsv_gz": str(idx_path),
            "summary": str(summary),
        }
    }
    with open(OUTPUT / "stats.json", 'w') as f:
        json.dump(stats, f, indent=2)

    sys.stderr.write(f"  Summary: {summary}\n")
    return stats


def upload_to_supabase():
    supabase_url = "https://wslydgtgindrywldatbv.supabase.co"
    anon_key = os.environ.get("SUPABASE_ANON_KEY", "")
    bucket = "concordance"
    if not anon_key:
        sys.stderr.write("  WARN: SUPABASE_ANON_KEY not set, skipping upload\n")
        return

    import urllib.request

    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
    }

    # Check/create bucket
    req = urllib.request.Request(
        f"{supabase_url}/storage/v1/bucket/{bucket}",
        headers=headers, method="GET"
    )
    try:
        urllib.request.urlopen(req, timeout=10)
        sys.stderr.write(f"  Bucket '{bucket}' exists\n")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            sys.stderr.write(f"  Creating bucket '{bucket}'...\n")
            data = json.dumps({"id": bucket, "name": bucket, "public": True}).encode()
            req = urllib.request.Request(
                f"{supabase_url}/storage/v1/bucket",
                data=data,
                headers={**headers, "Content-Type": "application/json"},
                method="POST"
            )
            try:
                urllib.request.urlopen(req, timeout=10)
                sys.stderr.write(f"  Bucket created (public)\n")
            except urllib.error.HTTPError as e2:
                sys.stderr.write(f"  Bucket create failed: {e2.code} {e2.read().decode()}\n")
                # Try with public=False
                data2 = json.dumps({"id": bucket, "name": bucket, "public": False}).encode()
                req2 = urllib.request.Request(
                    f"{supabase_url}/storage/v1/bucket",
                    data=data2,
                    headers={**headers, "Content-Type": "application/json"},
                    method="POST"
                )
                try:
                    urllib.request.urlopen(req2, timeout=10)
                    sys.stderr.write(f"  Bucket created (private)\n")
                except urllib.error.HTTPError as e3:
                    sys.stderr.write(f"  Bucket create also failed private: {e3.code} {e3.read().decode()}\n")
                    return
        else:
            sys.stderr.write(f"  Bucket check failed: {e.code}\n")
            return

    timestamp = time.strftime("%Y%m%d_%H%M%S")

    files_to_upload = [
        ("concordance.tsv.gz", "application/gzip"),
        ("per_file_index.tsv.gz", "application/gzip"),
        ("concordance_summary.txt", "text/plain"),
        ("stats.json", "application/json"),
    ]

    uploaded = []
    for filename, content_type in files_to_upload:
        file_path = OUTPUT / filename
        if not file_path.exists():
            sys.stderr.write(f"  SKIP: {filename}\n")
            continue

        storage_path = f"{timestamp}/{filename}"
        upload_url = f"{supabase_url}/storage/v1/object/{bucket}/{storage_path}"
        size_mb = file_path.stat().st_size / 1024 / 1024

        sys.stderr.write(f"  Uploading {filename} ({size_mb:.1f} MB)...\n")
        sys.stderr.flush()

        with open(file_path, 'rb') as f:
            data = f.read()

        req = urllib.request.Request(
            upload_url, data=data,
            headers={**headers, "Content-Type": content_type, "x-upsert": "true"},
            method="POST"
        )
        try:
            resp = urllib.request.urlopen(req, timeout=120)
            result = resp.read().decode()
            sys.stderr.write(f"    OK: {result}\n")
            uploaded.append(storage_path)
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            sys.stderr.write(f"    FAIL: {e.code} {body}\n")

    if uploaded:
        base = f"{supabase_url}/storage/v1/object/public/{bucket}/{timestamp}"
        sys.stderr.write(f"\n  Uploaded to: {bucket}/{timestamp}/\n")
        sys.stderr.write(f"  URLs:\n")
        for p in uploaded:
            sys.stderr.write(f"    {supabase_url}/storage/v1/object/public/{bucket}/{p}\n")

    return uploaded


def main():
    sys.stderr.write(f"TNF Concordance Generator\n{'='*40}\nRoot: {ROOT}\n")
    t_start = time.time()

    concordance, file_count, total_size = generate_concordance(ROOT)
    sys.stderr.write(f"\nWriting outputs...\n")
    stats = write_outputs(concordance, file_count, total_size)

    sys.stderr.write(f"\n{'='*40}\n")
    sys.stderr.write(f"Files: {file_count} | Identifiers: {len(concordance)} | Occurrences: {stats['total_occurrences']}\n")
    sys.stderr.write(f"Total: {time.time()-t_start:.1f}s\n")

    sys.stderr.write(f"\nUploading to Supabase...\n")
    uploaded = upload_to_supabase()
    sys.stderr.write(f"\nDone!\n")

if __name__ == '__main__':
    main()