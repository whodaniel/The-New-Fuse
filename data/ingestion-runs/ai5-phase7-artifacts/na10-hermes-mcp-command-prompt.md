# NA10 Hermes MCP Command Prompt

Directive: `act-2102cf2f511590b6`

This artifact preserves the Hermes prompt and credential checklist without storing NA10 secrets in the repo.

## Hermes Prompt

```text
Hey there, NA10 very recently released an MCP. I'm going to give you the credentials to connect to that NA10 MCP. And I want you to give me a command that I can run in the terminal that will allow me to give you the full connection/control for that MCP.
```

## Required Credential Inputs

- NA10 MCP configuration JSON from `app.net.cloud/s/mcp` -> `connected clients` -> `connection details`
- Freshly rotated NA10 MCP access token
- Transport details from the configuration JSON, such as URL, headers, client identifier, workspace/tenant identifier, and any required scope fields

## Safe Transmission Procedure

1. Open Hermes using `hermes chat`.
2. Paste the prompt above.
3. Paste the NA10 configuration JSON only from an active operator-controlled secret source.
4. Ask Hermes for a terminal command that stores the token securely and leaves a placeholder for the raw token.
5. Paste the raw token only into the interactive prompt or secret store requested by that command.
6. Validate with Hermes: `Could you go ahead and validate that this is fully added in please and that you have access to NA10`.

## Guardrails

- Do not commit NA10 tokens, bearer headers, or copied configuration JSON to git.
- Do not run a generated command unless the command writes secrets to a local secret store or Hermes-managed config path.
- Do not print the raw access token in logs, command history, reports, or evidence artifacts.
