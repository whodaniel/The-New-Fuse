import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))

def load_env(path):
    env = {}
    if not os.path.exists(path):
        return env
    with open(path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                env[key.strip()] = val.strip()
    return env

project_env_path = os.path.join(PROJECT_ROOT, '.env')
hermes_env_path = os.path.join(os.path.expanduser('~'), '.hermes', '.env.clean')

project_env = load_env(project_env_path)
hermes_env = load_env(hermes_env_path)

merged_env = {}
# Use hermes_env as base to preserve order/keys
with open(hermes_env_path, 'r') as f:
    for line in f:
        original_line = line.strip()
        if not original_line or original_line.startswith('#'):
            print(original_line)
            continue
        if '=' in original_line:
            key, val = original_line.split('=', 1)
            key = key.strip()
            val = val.strip()
            
            new_val = val
            if val == '***' and key in project_env:
                new_val = project_env[key]
                print(f"{key}={new_val}")
            else:
                print(original_line)
        else:
            print(original_line)
