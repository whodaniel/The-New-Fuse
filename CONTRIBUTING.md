# Contributing to The New Fuse

Thank you for your interest in contributing to TNF (The New Fuse).

## Development Setup

```bash
# Clone the monorepo
git clone https://github.com/whodaniel/the-new-fuse-next-gen.git
cd the-new-fuse-next-gen

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Create local runtime profile
touch .tnf.local.env

# Start development
pnpm run dev
```

## Repository Structure

```
apps/
  api/          # NestJS API server
  api-gateway/  # NestJS API gateway
  frontend/     # React + Vite frontend
  relay-server/ # WebSocket relay
  chrome-extension/
  vscode-extension/
packages/
  relay-core/   # Core relay primitives
  tnf-cli/      # CLI entrypoint
docs/           # Architecture & protocol docs
scripts/        # Deployment & sync scripts
```

## Code Standards

- **Language**: TypeScript strict mode
- **Package manager**: pnpm exclusively (no npm/yarn)
- **Formatting**: Run `pnpm run format` before commit
- **Linting**: Run `pnpm run lint` before commit
- **Type checking**: Run `pnpm run type-check` before commit
- **Tests**: All tests must pass: `pnpm test`
- **Commits**: Follow
  [Conventional Commits](https://www.conventionalcommits.org/)

## Key Conventions

- All agents must be documented in `.agent/` directory
- Agent capabilities must be registered via API
- Follow agent communication protocol in `docs/AGENT_COMMUNICATION_PROTOCOL.md`
- Test agent integration before deployment
- Use MCP for tool integration
- Never commit secrets or `.env` files
- Document agent capabilities in `.agent/agents/` directory

## Testing

```bash
# Run all tests
pnpm test

# Run type checking
pnpm tsc --noEmit

# Run linting
pnpm lint

# Run with Docker
pnpm run docker:start && pnpm run dev
```

## Deployment

```bash
# Test locally
pnpm run docker:start && pnpm run dev

# Verify CloudRuntime compatibility
# Check health endpoints before deploy
```

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes and run: `pnpm run format && pnpm run lint && pnpm test`
4. Commit using Conventional Commits: `git commit -m "feat: add new capability"`
5. Push and open a Pull Request

## Bug Reports

Open an issue with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS, etc.)

## Feature Requests

Open an issue with:

- Clear description of the proposed feature
- Problem it solves
- Any relevant use cases

## License

By contributing, you agree that your contributions will be licensed under the
MIT License.
