import os
import sys
import argparse
import shutil
from datetime import datetime

def backup_env(env_path):
    if os.path.exists(env_path):
        backup_path = f"{env_path}.{datetime.now().strftime('%Y%m%d%H%M%S')}.bak"
        shutil.copy2(env_path, backup_path)
        return backup_path
    return None

def set_env_var(env_path, key, value):
    lines = []
    found = False

    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            lines = f.readlines()

    for i, line in enumerate(lines):
        if line.startswith(f"{key}="):
            lines[i] = f"{key}={value}\n"
            found = True
            break

    if not found:
        if lines and not lines[-1].endswith('\n'):
            lines.append('\n')
        lines.append(f"{key}={value}\n")

    with open(env_path, 'w') as f:
        f.writelines(lines)
    return True

def get_env_var(env_path, key):
    if not os.path.exists(env_path):
        return None
    with open(env_path, 'r') as f:
        for line in f:
            if line.startswith(f"{key}="):
                return line.split('=', 1)[1].strip()
    return None

def list_env_vars(env_path):
    if not os.path.exists(env_path):
        return []
    envs = []
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                envs.append(line)
    return envs

def main():
    parser = argparse.ArgumentParser(description="Programmatic Environment Variable Manager")
    parser.add_argument("--path", default=".env", help="Path to the .env file")
    parser.add_argument("--action", required=True, choices=["get", "set", "list", "check"], help="Action to perform")
    parser.add_argument("--key", help="Variable key")
    parser.add_argument("--value", help="Variable value")
    parser.add_argument("--no-backup", action="store_true", help="Skip backup before modification")

    args = parser.parse_args()

    if args.action == "get":
        if not args.key:
            print("Error: --key required for get action")
            sys.exit(1)
        val = get_env_var(args.path, args.key)
        if val is not None:
            print(val)
        else:
            sys.exit(1)

    elif args.action == "set":
        if not args.key or args.value is None:
            print("Error: --key and --value required for set action")
            sys.exit(1)

        if not args.no_backup:
            bak = backup_env(args.path)
            if bak:
                print(f"Backup created: {bak}")

        if set_env_var(args.path, args.key, args.value):
            print(f"Successfully set {args.key}")
        else:
            print(f"Failed to set {args.key}")
            sys.exit(1)

    elif args.action == "list":
        envs = list_env_vars(args.path)
        for e in envs:
            print(e)

    elif args.action == "check":
        if not args.key:
            print("Error: --key required for check action")
            sys.exit(1)
        val = get_env_var(args.path, args.key)
        if val is not None:
            print(f"EXISTS: {args.key}")
        else:
            print(f"MISSING: {args.key}")
            sys.exit(1)

if __name__ == "__main__":
    main()
