# CI/CD Pipeline Documentation

This directory contains comprehensive documentation for The New Fuse CI/CD pipeline.

## Quick Links

- [Architecture Overview](../architecture/ARCHITECTURE.md) - High-level architecture and workflow diagrams
- [Workflows Guide](./workflows.md) - Detailed guide for each GitHub Actions workflow
- [Secrets Setup](./secrets-setup.md) - Required secrets and environment variables
- [Deployment Procedures](../deployment/DEPLOYMENT.md) - Step-by-step deployment guides
- [Troubleshooting](../deployment/TROUBLESHOOTING.md) - Common issues and solutions
- [Monitoring & Alerts](../deployment/MONITORING.md) - Monitoring setup and alert configuration

## Overview

The New Fuse uses a comprehensive CI/CD pipeline built on GitHub Actions to automate:

- **Testing**: Unit, integration, and E2E tests with coverage tracking
- **Building**: Automated builds for all packages and applications
- **Quality Gates**: Code quality, security scanning, and bundle size monitoring
- **Deployment**: Automated deployment to Railway for production and staging
- **PR Automation**: Automatic labeling, reviewer assignment, and checks

## Workflows

### Main Workflows

1. **test.yml** - Runs comprehensive test suite on PRs and commits
2. **build.yml** - Builds and verifies all packages and applications
3. **deploy.yml** - Deploys to Railway with health checks and rollback
4. **quality.yml** - Enforces quality gates (coverage, bundle size, security)
5. **pr-automation.yml** - Automates PR management and reviews

### Supporting Files

- **dependabot.yml** - Automated dependency updates
- **labeler.yml** - Automatic PR labeling rules
- **lighthouse/lighthouserc.json** - Performance testing configuration

## Getting Started

### For Developers

1. Read the [Workflows Guide](./workflows.md) to understand what happens when you create a PR
2. Check [Troubleshooting](../deployment/TROUBLESHOOTING.md) if you encounter CI failures
3. Review [Deployment Procedures](../deployment/DEPLOYMENT.md) before deploying

### For Maintainers

1. Review [Architecture Overview](../architecture/ARCHITECTURE.md) to understand the system
2. Set up required secrets following [Secrets Setup](./secrets-setup.md)
3. Configure monitoring using [Monitoring & Alerts](../deployment/MONITORING.md)

## Key Features

### Quality Assurance

- **Multi-stage testing**: Unit, integration, and E2E tests run in parallel
- **Code coverage**: Enforces minimum 70% coverage with Codecov integration
- **Security scanning**: Automated vulnerability checks with Trivy and npm audit
- **Performance monitoring**: Lighthouse CI for frontend performance
- **Bundle size tracking**: Prevents bloated bundles with size comparisons

### Automation

- **Auto-labeling**: PRs are automatically labeled based on changed files
- **Auto-reviewers**: Reviewers assigned based on code ownership
- **Dependabot**: Weekly dependency updates with auto-merge for minor/patch
- **First-time contributors**: Automatic welcome messages

### Deployment

- **Railway integration**: Automated deployment with health checks
- **Multi-service**: Deploys API, Gateway, Backend, and Frontend
- **Health checks**: Automated post-deployment verification
- **Rollback**: Automatic rollback on health check failures
- **Notifications**: Slack notifications for deployment status

## Metrics & Reporting

All workflows generate detailed reports:

- Test coverage reports on Codecov
- Bundle size comparisons on PRs
- Lighthouse performance scores
- Security vulnerability reports
- Build artifacts and logs

## Support

For issues with CI/CD:

1. Check [Troubleshooting Guide](../deployment/TROUBLESHOOTING.md)
2. Review workflow logs in GitHub Actions
3. Contact the DevOps team
4. Create an issue with the `ci` label
