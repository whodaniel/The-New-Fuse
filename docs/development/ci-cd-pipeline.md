# CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for The New Fuse project.

## Overview

The CI/CD pipeline is implemented using GitHub Actions and consists of the following stages:

1. **Lint**: Code quality checks
2. **Test**: Unit and integration tests
3. **Build**: Building packages and Docker images
4. **Deploy**: Deploying to staging and production environments
5. **Notify**: Sending notifications about deployment status

## Workflow Configuration

The pipeline is defined in `.github/workflows/consolidated-ci-cd.yml` and is triggered on:
- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches

## Pipeline Stages

### Lint

- Runs code linting using ESLint
- Ensures code follows project style guidelines
- Fails fast if linting errors are found

### Test

- Runs unit and integration tests
- Uploads test coverage to Codecov
- Requires linting to pass before running

### Build

The build stage follows a specific order to ensure dependencies are built correctly:

1. Generate database client (Prisma)
2. Build types package first
3. Build utils package
4. Build core package
5. Build database package
6. Build remaining packages
7. Build Docker images for API and frontend

### Deploy to Staging

When code is pushed to the `develop` branch:

1. Run database migrations on staging database
2. Deploy to Kubernetes staging environment
3. Verify deployment status

### Deploy to Production

When code is pushed to the `main` branch:

1. Run database migrations on production database
2. Deploy to Kubernetes production environment
3. Verify deployment status

### Notify

After deployment (success or failure):
- Send notification to Slack with deployment status

## Required Secrets

The following secrets must be configured in GitHub repository settings:

- `CODECOV_TOKEN`: Token for uploading coverage reports
- `KUBE_CONFIG`: Kubernetes configuration for deployment
- `STAGING_DATABASE_URL`: Database URL for staging environment
- `PRODUCTION_DATABASE_URL`: Database URL for production environment
- `SLACK_BOT_TOKEN`: Token for Slack notifications

## Local Development

For local development, you can use the following commands:

```bash
# Install dependencies
yarn install

# Run linting
yarn lint

# Run tests
yarn test

# Build packages in correct order
yarn build:types
yarn build:utils
yarn build:core
yarn build:database
yarn build

# Generate database client
yarn db:generate

# Run database migrations
yarn db:migrate
```

## Troubleshooting

If the pipeline fails, check the following:

1. Linting errors: Run `yarn lint` locally to identify and fix issues
2. Test failures: Run `yarn test` locally to debug failing tests
3. Build errors: Check if all dependencies are correctly installed and configured
4. Deployment errors: Verify Kubernetes configuration and database connection

## Maintenance

The CI/CD pipeline should be regularly reviewed and updated to ensure it remains efficient and effective. Consider:

- Updating GitHub Actions versions
- Optimizing build times
- Adding new test types
- Improving deployment strategies
