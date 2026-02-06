# Gemini CLI Updates and GitHub Actions Integration

## Overview

In August 2025, Google released an update to the Gemini CLI that integrates it
with GitHub Actions. This allows developers to use Gemini as an AI coding
assistant directly within their GitHub repositories.

## Key Features

- **Automated issue triage:** Gemini can automatically analyze, label, and
  prioritize new issues as they are created.
- **Pull request review:** The tool can review pull requests for quality, style,
  and correctness, and provide feedback and suggestions.
- **On-demand assistance:** Developers can delegate tasks to Gemini by
  mentioning "@gemini-cli" in GitHub issues or pull requests. This can be used
  for a variety of tasks, such as writing code, fixing bugs, or providing
  explanations.
- **Custom workflows:** The integration is open-source and customizable,
  allowing teams to create their own automated workflows.
- **Security:** To enhance security, the integration supports Google Cloud's
  Workload Identity Federation, which avoids the need for long-lived API keys.

## Getting Started

The Gemini CLI GitHub Actions integration is available for free to users with a
Google AI Studio API key. To get started, you need to install the Gemini CLI
(version 0.1.18 or later) and run the `/setup-github` command. You can find the
GitHub Action at `google-github-actions/run-gemini-cli`.
