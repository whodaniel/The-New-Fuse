#!/usr/bin/env python3
"""
The New Fuse - UI Package Backend API

Purpose: Flask API that powers the HTML UI interfaces
Enables non-technical users to execute complex operations via web UI
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import subprocess
import os
import json
from pathlib import Path
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for local HTML files

# Get project root directory
PROJECT_ROOT = Path(__file__).parent.parent

@app.route('/')
def index():
    return jsonify({
        "name": "The New Fuse UI Package API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "/api/health",
            "/api/services/check",
            "/api/agents/register",
            "/api/workflows/create",
            "/api/database/migrate"
        ]
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "api_version": "1.0.0"
    })

@app.route('/api/services/check', methods=['POST'])
def check_services():
    """Check status of all services"""
    try:
        # List of services to check
        services = [
            {"name": "Frontend", "port": 3000, "command": "lsof -i :3000"},
            {"name": "Backend API", "port": 3001, "command": "lsof -i :3001"},
            {"name": "API Gateway", "port": 3005, "command": "lsof -i :3005"},
            {"name": "Browser Hub", "port": 8080, "command": "lsof -i :8080"},
            {"name": "PostgreSQL", "port": 5433, "command": "lsof -i :5433"},
            {"name": "Redis", "port": 6380, "command": "lsof -i :6380"}
        ]

        results = []
        for service in services:
            try:
                # Check if port is in use
                result = subprocess.run(
                    service["command"],
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=5
                )

                is_running = bool(result.stdout.strip())

                results.append({
                    "name": service["name"],
                    "port": service["port"],
                    "status": "running" if is_running else "stopped",
                    "healthy": is_running
                })
            except subprocess.TimeoutExpired:
                results.append({
                    "name": service["name"],
                    "port": service["port"],
                    "status": "timeout",
                    "healthy": False
                })
            except Exception as e:
                results.append({
                    "name": service["name"],
                    "port": service["port"],
                    "status": f"error: {str(e)}",
                    "healthy": False
                })

        # Overall health status
        all_healthy = all(s["healthy"] for s in results)

        return jsonify({
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "overall_status": "healthy" if all_healthy else "degraded",
            "services": results
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/agents/register', methods=['POST'])
def register_agent():
    """Register a new agent"""
    try:
        data = request.json

        # Validate required fields
        required_fields = ['name', 'description', 'type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400

        # Create agent definition file
        agent_dir = PROJECT_ROOT / '.agent'
        agent_dir.mkdir(exist_ok=True)

        agent_filename = f"{data['name'].lower().replace(' ', '-')}.md"
        agent_file = agent_dir / agent_filename

        # Generate agent markdown
        agent_content = f"""# {data['name']}

**Type:** {data['type']}
**Focus:** {data['description']}
**Created:** {datetime.now().isoformat()}

## Capabilities

This agent specializes in:
- {data.get('capability1', 'Primary capability')}
- {data.get('capability2', 'Secondary capability')}
- {data.get('capability3', 'Additional capability')}

## Configuration

**Model:** {data.get('model', 'claude-sonnet-4.5')}
**Temperature:** {data.get('temperature', '0.7')}
**Max Tokens:** {data.get('maxTokens', '8192')}

## Tools

This agent has access to:
- {data.get('tools', 'Standard toolset')}

## Usage

To use this agent:

```bash
# Invoke via Claude Code
# Agent will automatically apply its specialized capabilities
```

## Examples

### Example 1: Basic Usage

```
User: [task description]
Agent: [agent response]
```

## Notes

- Registered via UI Package on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- Configured with custom settings
- Ready for use in Claude Code
"""

        # Write agent file
        agent_file.write_text(agent_content)

        # Attempt to register in database (if API is running)
        try:
            registration_result = subprocess.run(
                f"cd {PROJECT_ROOT} && pnpm run claude:agents:register",
                shell=True,
                capture_output=True,
                text=True,
                timeout=30
            )

            db_registered = registration_result.returncode == 0
            db_output = registration_result.stdout if db_registered else registration_result.stderr
        except Exception as e:
            db_registered = False
            db_output = f"Database registration skipped: {str(e)}"

        return jsonify({
            "success": True,
            "message": f"Agent '{data['name']}' created successfully",
            "file_path": str(agent_file),
            "db_registered": db_registered,
            "db_output": db_output,
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/workflows/create', methods=['POST'])
def create_workflow():
    """Create a new workflow"""
    try:
        data = request.json

        # Validate required fields
        if 'name' not in data or 'steps' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required fields: name, steps"
            }), 400

        # Create workflow definition
        workflow_dir = PROJECT_ROOT / 'workflows'
        workflow_dir.mkdir(exist_ok=True)

        workflow_filename = f"{data['name'].lower().replace(' ', '-')}.json"
        workflow_file = workflow_dir / workflow_filename

        # Generate workflow JSON
        workflow_data = {
            "name": data['name'],
            "description": data.get('description', ''),
            "created": datetime.now().isoformat(),
            "steps": data['steps'],
            "config": {
                "parallel": data.get('parallel', False),
                "retry": data.get('retry', 3),
                "timeout": data.get('timeout', 300)
            }
        }

        # Write workflow file
        workflow_file.write_text(json.dumps(workflow_data, indent=2))

        return jsonify({
            "success": True,
            "message": f"Workflow '{data['name']}' created successfully",
            "file_path": str(workflow_file),
            "workflow": workflow_data,
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/database/migrate', methods=['POST'])
def database_migrate():
    """Run database migrations"""
    try:
        data = request.json

        # Get migration parameters
        migration_type = data.get('type', 'dev')  # dev, deploy, reset

        # Determine command
        commands = {
            'dev': 'pnpm run db:migrate:dev',
            'deploy': 'pnpm run db:migrate:deploy',
            'reset': 'pnpm run db:reset',
            'generate': 'npx prisma generate',
            'seed': 'npx prisma db seed'
        }

        command = commands.get(migration_type)
        if not command:
            return jsonify({
                "success": False,
                "error": f"Unknown migration type: {migration_type}"
            }), 400

        # Run migration
        result = subprocess.run(
            f"cd {PROJECT_ROOT} && {command}",
            shell=True,
            capture_output=True,
            text=True,
            timeout=120
        )

        success = result.returncode == 0

        return jsonify({
            "success": success,
            "message": f"Migration '{migration_type}' {'completed' if success else 'failed'}",
            "output": result.stdout,
            "errors": result.stderr if not success else None,
            "timestamp": datetime.now().isoformat()
        })

    except subprocess.TimeoutExpired:
        return jsonify({
            "success": False,
            "error": "Migration timed out after 120 seconds",
            "timestamp": datetime.now().isoformat()
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/setup/complete', methods=['POST'])
def complete_setup():
    """Complete setup wizard - run all initialization steps"""
    try:
        data = request.json

        results = []
        overall_success = True

        # Step 1: Install dependencies
        if data.get('installDeps', True):
            try:
                result = subprocess.run(
                    f"cd {PROJECT_ROOT} && pnpm install",
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                results.append({
                    "step": "Install Dependencies",
                    "success": result.returncode == 0,
                    "output": result.stdout[:500]  # Truncate
                })
                if result.returncode != 0:
                    overall_success = False
            except Exception as e:
                results.append({"step": "Install Dependencies", "success": False, "error": str(e)})
                overall_success = False

        # Step 2: Start Docker services
        if data.get('startDocker', True):
            try:
                result = subprocess.run(
                    f"cd {PROJECT_ROOT} && pnpm run docker:start",
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                results.append({
                    "step": "Start Docker Services",
                    "success": result.returncode == 0,
                    "output": result.stdout[:500]
                })
                if result.returncode != 0:
                    overall_success = False
            except Exception as e:
                results.append({"step": "Start Docker Services", "success": False, "error": str(e)})
                overall_success = False

        # Step 3: Run migrations
        if data.get('runMigrations', True):
            try:
                result = subprocess.run(
                    f"cd {PROJECT_ROOT} && npx prisma migrate dev --name init",
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=120
                )
                results.append({
                    "step": "Database Migrations",
                    "success": result.returncode == 0,
                    "output": result.stdout[:500]
                })
                if result.returncode != 0:
                    overall_success = False
            except Exception as e:
                results.append({"step": "Database Migrations", "success": False, "error": str(e)})
                overall_success = False

        # Step 4: Sync agents
        if data.get('syncAgents', True):
            try:
                result = subprocess.run(
                    f"cd {PROJECT_ROOT} && pnpm run claude:agents:sync",
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                results.append({
                    "step": "Sync Claude Agents",
                    "success": result.returncode == 0,
                    "output": result.stdout[:500]
                })
                if result.returncode != 0:
                    overall_success = False
            except Exception as e:
                results.append({"step": "Sync Claude Agents", "success": False, "error": str(e)})
                overall_success = False

        return jsonify({
            "success": overall_success,
            "message": "Setup completed" if overall_success else "Setup completed with errors",
            "results": results,
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    print("""
    ╔══════════════════════════════════════════════╗
    ║   The New Fuse - UI Package Backend API     ║
    ╠══════════════════════════════════════════════╣
    ║                                              ║
    ║  Status: Running                             ║
    ║  Port: 5000                                  ║
    ║  URL: http://localhost:5000                  ║
    ║                                              ║
    ║  Ready to power UI interfaces!               ║
    ║                                              ║
    ╚══════════════════════════════════════════════╝

    Available endpoints:
      → GET  /api/health
      → POST /api/services/check
      → POST /api/agents/register
      → POST /api/workflows/create
      → POST /api/database/migrate
      → POST /api/setup/complete

    Open UI interfaces in ui-package/
    """)

    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
