# TNF Crawl4AI Integration Guide

This guide explains how to use and manage the Crawl4AI-powered web scraping
service in **The New Fuse (TNF)** framework.

## Overview

The TNF Crawl4AI Integration provides high-quality, LLM-optimized markdown
scraping. It is implemented as a Python-based engine that can be accessed via a
Node.js bridge in `WebScrapingService.ts`.

## 🛠 Setup & Startup

You have two options for running the crawler:

### Option 1: Local Execution (Recommended for Development)

This method creates a local virtual environment in the project root and starts
the FastAPI server.

```bash
pnpm run tnf:start:crawler:local
```

_Note: This script handles `pip install` and `playwright install`
automatically._

### Option 2: Dockerized Execution (Recommended for Production/CI)

This method runs the crawler in an isolated container.

```bash
pnpm run tnf:start:crawler
```

## 🤖 AI Agent Usage (MCP)

Once the crawler is running, agents (like Gemini or Claude) gain access to the
following tool:

- **`scrape_website_crawl4ai`**: Scrapes any URL and returns "Fit Markdown"
  optimized for AI context.

## ⚙️ Configuration

The Node.js services connect to the crawler via:

- **Default URL**: `http://localhost:8000/scrape`
- **Override Variable**: `CRAWL4AI_SERVICE_URL` in your `.env` file.

## 🛡️ Robust Fallback

If the Crawl4AI service is not running or fails, the `WebScrapingService`
automatically falls back to the Puppeteer-based `scrapeFull` method, ensuring no
interruption to your workflows.
