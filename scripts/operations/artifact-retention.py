#!/usr/bin/env python3
"""Bounded, lossless cold-file archival. Plan by default; no live-state pruning."""
import argparse
import base64
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import tempfile
import sys
import time


def digest(stream):
    h = hashlib.sha256()
    for block in iter(lambda: stream.read(1024 * 1024), b''):
        h.update(block)
    return h.hexdigest()


def identity(p):
    s = p.lstat()
    if not stat.S_ISREG(s.st_mode) or p.resolve() != p.absolute():
        raise ValueError('only regular files without symlink ancestors are eligible')
    return (s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns, s.st_ctime_ns)


def assert_closed(p):
    # Missing tooling, timeout, stderr, and ambiguous status all fail closed.
    r = subprocess.run(['lsof', '-nP', '--', str(p)], capture_output=True, timeout=20)
    if r.returncode != 1 or r.stdout or r.stderr:
        raise ValueError('file open or active-use check inconclusive: ' + str(p))


def sync_dir(p):
    fd = os.open(p, os.O_RDONLY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def receipt_write(path, value):
    fd, tmp = tempfile.mkstemp(prefix='.receipt-', dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as f:
            json.dump(value, f, indent=2)
            f.write('\n')
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
        sync_dir(path.parent)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def read_xattrs(p):
    if hasattr(os, 'listxattr'):
        return {key: base64.b64encode(os.getxattr(p, key)).decode() for key in os.listxattr(p)}
    if sys.platform != 'darwin':
        raise ValueError('extended-attribute adapter unavailable')
    names = subprocess.check_output(['xattr', str(p)], text=True, timeout=10).splitlines()
    return {key: base64.b64encode(bytes.fromhex(subprocess.check_output(
        ['xattr', '-px', key, str(p)], text=True, timeout=10))).decode() for key in names}


def write_xattrs(p, attrs):
    for key, value in attrs.items():
        raw = base64.b64decode(value)
        if hasattr(os, 'setxattr'):
            os.setxattr(p, key, raw)
        elif sys.platform == 'darwin':
            subprocess.run(['xattr', '-wx', key, raw.hex(), str(p)], check=True, timeout=10)
        else:
            raise ValueError('extended-attribute adapter unavailable')


def archive(p, root, *, reason, min_age_days=14):
    p = p.absolute()
    before = identity(p)
    if time.time_ns() - before[3] < min_age_days * 86400 * 10**9:
        raise ValueError('source is too recent')
    assert_closed(p)
    source_stat = p.stat()
    if source_stat.st_uid != os.getuid() or getattr(source_stat, 'st_flags', 0):
        raise ValueError('foreign-owned or flagged source requires a dedicated adapter')
    mode = stat.S_IMODE(source_stat.st_mode)
    xattrs = read_xattrs(p)
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    if root.is_symlink() or root.resolve() != root.absolute():
        raise ValueError('archive root must not be redirected')
    os.chmod(root, 0o700)
    with p.open('rb') as src:
        sha = digest(src)
    obj = root / (sha + '.gz')
    record = root / (hashlib.sha256(str(p).encode()).hexdigest() + '.json')
    if record.exists():
        raise ValueError('existing restore receipt; reconcile before reusing source path')
    if not obj.exists():
        fd, tmp = tempfile.mkstemp(prefix='.archive-', dir=root)
        try:
            with os.fdopen(fd, 'wb') as dst:
                with gzip.GzipFile(filename='', mode='wb', fileobj=dst, mtime=0) as gz:
                    with p.open('rb') as src:
                        shutil.copyfileobj(src, gz, 1024 * 1024)
                dst.flush()
                os.fsync(dst.fileno())
            # Publish without clobbering an existing content object.
            os.link(tmp, obj)
            sync_dir(root)
        finally:
            os.unlink(tmp)
    identity(obj)
    with gzip.open(obj, 'rb') as src:
        if digest(src) != sha:
            raise ValueError('archive verification failed; source retained')
    if identity(p) != before:
        raise ValueError('source changed; source retained')
    assert_closed(p)
    data = dict(spec='tnf/artifact-retention/1', source=str(p), object=str(obj),
                sha256=sha, bytes=before[2], mode=mode, mtime_ns=before[3],
                uid=source_stat.st_uid, gid=source_stat.st_gid, xattrs=xattrs,
                reason=reason, state='prepared', observedAt=time.time())
    receipt_write(record, data)
    # No source unlink until verified archive AND durable restore receipt exist.
    if identity(p) != before:
        raise ValueError('source changed after receipt; source retained')
    p.unlink()
    sync_dir(p.parent)
    data['state'] = 'archived'
    receipt_write(record, data)
    return dict(receipt=str(record), sourceBytes=before[2], archiveBytes=obj.stat().st_size)


def restore(record):
    data = json.loads(record.read_text())
    p = Path(data['source'])
    obj = Path(data['object'])
    if data['spec'] != 'tnf/artifact-retention/1' or p.exists() or p.is_symlink():
        raise ValueError('invalid receipt or restore destination already exists')
    if not p.parent.is_dir() or p.parent.resolve() != p.parent.absolute():
        raise ValueError('restore parent missing or redirected')
    identity(obj)
    fd, tmp = tempfile.mkstemp(prefix='.restore-', dir=p.parent)
    try:
        with os.fdopen(fd, 'wb') as dst, gzip.open(obj, 'rb') as src:
            shutil.copyfileobj(src, dst, 1024 * 1024)
            dst.flush()
            os.fsync(dst.fileno())
        with open(tmp, 'rb') as src:
            if digest(src) != data['sha256']:
                raise ValueError('restore hash mismatch')
        os.chown(tmp, data['uid'], data['gid'])
        write_xattrs(tmp, data.get('xattrs', {}))
        os.chmod(tmp, data['mode'])
        os.utime(tmp, ns=(data['mtime_ns'], data['mtime_ns']))
        os.link(tmp, p)  # atomic no-clobber publication
        sync_dir(p.parent)
    finally:
        os.unlink(tmp)
    return str(p)


def candidates(home):
    # Only sealed, timestamp-named heartbeat segments. cron.log remains live.
    logs = home / '.tnf/terminal-heartbeat/logs'
    return sorted(p for p in logs.glob('cron.*.log')
                  if re.fullmatch(r'cron\.\d{8}T\d{6}Z\.log', p.name))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--restore', type=Path)
    ap.add_argument('--sealed-backup', type=Path, action='append', default=[])
    args = ap.parse_args()
    if args.restore:
        if not args.apply:
            raise ValueError('restore requires --apply')
        print(json.dumps({'restored': restore(args.restore.absolute())}))
        return
    home = Path.home()
    root = home / '.tnf/artifact-retention'
    paths = [(p, 14, 'sealed heartbeat segment; verbatim cold retention') for p in candidates(home)]
    # Explicit operator selection only, never included in scheduled scans.
    for p in args.sealed_backup:
        p = p.absolute()
        backup_root = home / '.claude/backups'
        if not p.is_relative_to(backup_root) or p.name not in ('claude', 'claude.exe'):
            raise ValueError('sealed backup must be an explicitly selected Claude rollback executable')
        paths.append((p, 1, 'operator-selected rollback executable; verbatim cold retention'))
    if args.apply:
        root.mkdir(parents=True, exist_ok=True, mode=0o700)
        lock = root / '.apply-lock'
        # Exclusive run lock; stale locks require inspection, never auto-removal.
        lock.mkdir()
        try:
            for p, age, reason in paths:
                if time.time() - p.lstat().st_mtime < age * 86400:
                    continue
                print(json.dumps(archive(p, root, reason=reason, min_age_days=age)), flush=True)
        finally:
            lock.rmdir()
    else:
        for p, age, reason in paths:
            s = p.lstat()
            print(json.dumps({'path': str(p), 'bytes': s.st_size, 'minimumAgeDays': age,
                              'oldEnough': time.time() - s.st_mtime >= age * 86400,
                              'action': 'archive-verify-receipt-unlink', 'reason': reason}))


if __name__ == '__main__':
    main()
