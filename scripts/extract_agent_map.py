#!/usr/bin/env python3
import os
import json

dir_path = os.path.expanduser(
    os.getenv(
        "TNF_AGENT_PFP_OUTPUT_DIR",
        "~/.gemini/antigravity/brain/129a6f84-97a9-4c46-88c8-4b5f066454aa",
    )
)
files = sorted(
    [f for f in os.listdir(dir_path) if f.endswith(".png") and "_spaceage" in f]
)

agent_map = {}
for f in files:
    # Extract agent ID from filename: ab_testing_optimizer_agent_spaceage_1774315474808.png
    prefix = f.replace("_spaceage_", "___").split("___")[0]
    # Convert underscores to hyphens to match agent IDs
    agent_id = prefix.replace("_", "-").rstrip("-")
    agent_map[agent_id] = f

# Print as JSON for easy use
print(json.dumps(agent_map, indent=2))
