#!/usr/bin/env python3
"""Install the bounded archival job on macOS. Plan unless --apply is supplied."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import plistlib
import shutil
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if sys.platform != 'darwin':
        raise SystemExit('This installer supports macOS launchd only.')
    home = Path.home()
    source = Path(__file__).with_name('artifact-retention.py')
    # Versioned executable avoids overwriting a running job and binds deployment.
    sha = hashlib.sha256(source.read_bytes()).hexdigest()
    target = home / '.tnf/bin' / ('artifact-retention-' + sha + '.py')
    plist = home / 'Library/LaunchAgents/com.thenewfuse.artifact-retention.plist'
    label = 'com.thenewfuse.artifact-retention'
    domain = 'gui/' + str(os.getuid())
    config = dict(Label=label, ProgramArguments=[sys.executable, str(target), '--apply'],
                  StartInterval=86400, RunAtLoad=False, ProcessType='Background',
                  LowPriorityIO=True)
    print(json.dumps(dict(source=str(source), target=str(target), plist=str(plist),
                          sha256=sha, intervalSeconds=86400, apply=args.apply)))
    if not args.apply:
        return
    if plist.exists():
        raise SystemExit('Existing job must be reviewed before replacing it.')
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        with target.open('xb') as f:
            f.write(source.read_bytes())
            f.flush()
            os.fsync(f.fileno())
        target.chmod(0o700)
    if hashlib.sha256(target.read_bytes()).hexdigest() != sha:
        raise SystemExit('Installed executable hash mismatch.')
    # Prove the exact installed script can finish an authorized archival cycle.
    subprocess.run([sys.executable, str(target), '--apply'], check=True, timeout=300)
    plist.parent.mkdir(parents=True, exist_ok=True)
    with plist.open('xb') as f:
        plistlib.dump(config, f)
    try:
        subprocess.run(['plutil', '-lint', str(plist)], check=True)
        subprocess.run(['launchctl', 'bootstrap', domain, str(plist)], check=True)
        subprocess.run(['launchctl', 'kickstart', domain + '/' + label], check=True)
    except Exception:
        # Keep deployment evidence; do not silently remove a possibly loaded job.
        raise SystemExit('Deployment incomplete; inspect launchctl and retained plist before retry.')
    print('Installed; verify launchctl print ' + domain + '/' + label + ' after first run.')


if __name__ == '__main__':
    main()
