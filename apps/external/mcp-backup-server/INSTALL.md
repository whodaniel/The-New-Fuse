# Installation Instructions

1. Install dependencies:
```bash
cd mcp-backup-server
pip install -r requirements.txt
```

2. Copy and configure environment:
```bash
cp .env.example .env
nano .env
```

3. Copy backup configuration:
```bash
cp backup_config.json.example backup_config.json
nano backup_config.json
```

4. Add to Kilo MCP servers:
```json
{
  "mcpServers": {
    "multicloud-backup": {
      "command": "python",
      "args": ["/Users/<owner>/mcp-backup-server/server.py"]
    }
  }
}
```

5. First run authentication:
```bash
python server.py
```
