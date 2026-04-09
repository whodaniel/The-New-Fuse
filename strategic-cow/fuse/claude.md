# The New Fuse Global Brain

## Project Rules

# all code must follow NestJS conventions

# use pnpm exclusively, never npm or yarn

# maintain monorepo structure at all times

# document all agent capabilities in .agent/ directory

# follow TypeScript strict mode

# ensure PostgreSQL compatibility

# maintain Redis caching patterns

# follow security best practices from docs/security/

# use turbo for build orchestration

# maintain backwards compatibility

## Agent Development

# all agents must be documented in .agent/

# agent capabilities must be registered via API

# follow agent communication protocol in docs/AGENT_COMMUNICATION_PROTOCOL.md

# test agent integration before deployment

# use MCP for tool integration

## Testing Requirements

# write tests for all new features

# ensure e2e tests pass before committing

# validate with: pnpm run test

# check type safety with: pnpm run type-check

# run Docker tests with: pnpm run docker:test

## Deployment Standards

# test locally with: pnpm run docker:start && pnpm run dev

# verify Railway compatibility

# check health endpoints before deploy

# monitor service status post-deploy

# follow deployment guide in docs/deployment/

## Monorepo Conventions

# install dependencies: pnpm install (root only)

# add package dependency: pnpm --filter @the-new-fuse/[package] add [dep]

# run command in package: pnpm --filter @the-new-fuse/[package] run [cmd]

# run command in all packages: pnpm -r run [cmd]

# build all: pnpm run build

## Documentation

# update relevant docs when adding features

# follow documentation structure in docs/

# reference DOCUMENTATION_MAP.md for navigation

# maintain API documentation in respective app README files

## Security

# never commit secrets or .env files

# use environment variables for all config

# follow security checklist in docs/security/DEVELOPER_SECURITY_CHECKLIST.md

# validate all user input

# sanitize all database queries

## Code Quality

# format before commit: pnpm run format

# lint before commit: pnpm run lint

# ensure no type errors: pnpm run type-check

# write meaningful commit messages following conventional commits

## Service Architecture

# Frontend: Port 3000 (React + Vite)

# Backend API: Port 3001 (NestJS)

# API Gateway: Port 3005 (NestJS)

# Browser Hub: Port 8080 (Browser automation)

# Electron: Desktop application

# PostgreSQL: Port 5433 (Docker)

# Redis: Port 6380 (Docker)

## Development Workflow

# start infrastructure: pnpm run docker:start

# start all services: pnpm run dev

# start specific service: pnpm run dev:[service]

# check Docker status: pnpm run docker:status

# view logs: pnpm run docker:logs

# stop all: pnpm run docker:stop

## Agent Commands

# sync Claude agents: pnpm run claude:agents:sync

# register agents in DB: pnpm run claude:agents:register

# search agent ecosystem: pnpm run claude:agents:search

# check agent status: pnpm run claude:agents:status
