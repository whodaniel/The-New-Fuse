# The New Fuse CI/CD & Automation Strategy

## 🌍 Overview

"The New Fuse" (TNF) aims to be a self-improving platform. To achieve this, we
harness **Continuous Integration/Continuous Deployment (CI/CD)** not just as a
tool for deploying code, but as a core feature of the framework itself.

This document outlines our hybrid strategy leveraging **Self-Hosted Runners**
and **GitHub Actions**, and introduces advanced Git concepts like **Worktrees**
to maximize developer efficiency.

---

## 🏃‍♂️ Self-Hosted Runners: The "Power User" Approach

### What is it?

A Self-Hosted Runner allows you to use your own machine (or a dedicated local
server) to execute GitHub Action workflows. Instead of renting a generic, slow,
and expensive cloud server from GitHub, the "build job" is sent securely to your
powerful local hardware.

### Why is this strategic for TNF?

1.  **Cost Efficiency**: Building native applications (macOS/iOS) on GitHub's
    cloud costs **10x** standard minutes. Self-hosted runners are **free**.
2.  **Performance**: Your M-series Mac is significantly faster than the shared
    generic runners provided by GitHub.
3.  **Local Ecosystem Access**: A local runner has access to your local signing
    certificates, connected devices, and local testing environments without
    complex secret management.
4.  **Security**: Compiling code on your own hardware ensures tighter control
    over the build artifacts.

### Integration into TNF Framework

We can build a "Runner Manager" module into TNF that:

- **Auto-Registration**: A script that automatically configures the current
  machine as a runner for the repo.
- **Resource Awareness**: The runner can check its own CPU/RAM usage before
  accepting jobs (using our `system-status` logic).
- **Hybrid Scaling**: Use local runners for heavy lifting (Build/Package) and
  cloud runners for lightweight tasks (Linting/Unit Tests).

---

## ☁️ GitHub Cloud Runners: The "Universal" Approach

### When to use them?

- **Linting & Unit Tests**: Fast, lightweight Linux tasks (1x cost multiplier).
- **Public Contributions**: Security boundaries are better when running
  untrusted code from PRs in ephemeral cloud environments.
- **Availability**: When your local machine is offline.

---

## 🌳 Git Worktrees: Parallel Development Power

### The Concept

Standard Git uses **one** working directory. To switch branches, you must
"replace" all files in your current folder.

- _Problem_: You are compiling a huge app on `feature-A`, but need to fix a bug
  on `main`. Switching branches wipes your build cache and uncommitted work.

**Git Worktrees** allow you to check out multiple branches into **different
folders** simultaneously, all linked to the same `.git` history.

### Strategic Use in TNF

1.  **Parallel Testing**: Run the "Stable" version of `apps/frontend` in one
    terminal (Folder A) while developing "Next-Gen" features in another (Folder
    B).
2.  **Zero-Context Switching**: Fix a bug on `main` without stashing or closing
    your IDE windows for the feature branch.
3.  **CI/CD Optimization**: Our Self-Hosted Runner can use worktrees to run
    multiple pipeline jobs in parallel on the same machine without file
    conflicts.

### Example Workflow

```bash
# You are in your main repo
git worktree add ../tnf-hotfix main
cd ../tnf-hotfix
# Fix bug, commit, push
cd -
git worktree remove ../tnf-hotfix
```

---

## 🚀 Implementation Plan

1.  **Immediate**: Define the `build.yml` workflow but set it to look for
    `runs-on: self-hosted`.
2.  **Short-term**: Create a `./scripts/setup-runner.sh` to automate the
    registration of the local machine.
3.  **Long-term**: Integrate "Worktree Management" into the **Browser Hub**
    Developer Tools, allowing you to spawn a new "Instance" of the codebase in a
    tab.

---

## 🤖 Convergence: CI/CD Workflows as AI Skills

### The Insight

There is a direct structural correlation between **GitHub Action Workflows**
(YAML steps) and **Agentic Skills** (sequences of tool calls).

As AI Agents (like Anthropic's "Computer Use" or our own Antigravity) evolve,
they require defined "SOPs" (Standard Operating Procedures) to execute complex
tasks reliably.

### The Opportunity

By standardizing our CI/CD pipelines as modular "Workflows", we are effectively
building a **Skill Library** for our AI Agents:

1.  **Workflows as Skills**: A `build-electron` workflow is not just a CI
    script; it is a learned skill that an AI Agent can invoke: "Agent, please
    build the electron app."
2.  **Shared Language**: Both CI pipelines and AI Agents can understand
    YAML/JSON definitions of tasks (Inputs → Steps → Outputs).
3.  **Self-Improvement Loop**:
    - **Phase 1**: Human writes a workflow (e.g., "Deploy to Production").
    - **Phase 2**: Agent learns to invoke this workflow via API.
    - **Phase 3**: Agent analyzes the workflow logs and _optimizes the workflow
      definition itself_ (e.g., "I noticed step 3 is flaky, I will add a retry
      logic").

### Strategic Alignment

This aligns perfectly with TNF's vision of a **Self-Improving Platform**. The
codebase contains the instructions for its own evolution. When we define a
robust CI/CD pipeline, we are simultaneously teaching the AI how to maintain the
system.
