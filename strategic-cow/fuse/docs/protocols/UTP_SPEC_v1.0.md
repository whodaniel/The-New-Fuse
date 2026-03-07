# Universal Timeline Protocol (UTP) - v1.0

**Project:** The New Fuse (TNF) **Status:** Initial Draft (Inspired by
StarTreeTV Data Capture) **Date:** 2026-02-15

## 1. Overview

The **Universal Timeline Protocol (UTP)** is a protocol primitive designed to
translate any event-driven or timestamped data stream into a normalized
"Timeline Object." This allows multi-agent swarms to ingest fragmented histories
(Discord, Slack, Git, Blockchain) and project them into unified navigable maps,
Mermaid charts, or Living Documentation.

## 2. The Core Primitive (JSON Schema)

Every UTP event must adhere to the following normalized structure:

```json
{
  "id": "uuid-or-hash",
  "timestamp": "ISO-8601",
  "actor": {
    "id": "internal-id",
    "handle": "username",
    "source_profile": "url-or-profile-ref"
  },
  "source": {
    "type": "discord | near_forum | git | blockchain | slack",
    "context": "channel-name | repo-name | contract-address",
    "origin_url": "link-to-original-post"
  },
  "content": {
    "text": "Verbatim content",
    "type": "markdown | plaintext | code | media",
    "attachments": []
  },
  "metadata": {
    "is_edited": true,
    "parent_id": "reply-to-id",
    "thread_id": "context-id"
  }
}
```

## 3. Translation Layers (Translators)

UTP relies on modular translators that map source-specific protocols to the UTP
Primitive.

### 3.1 Discord Search Translator

- **Source:** Search result item.
- **Timestamp:** Extracted from `<time datetime="...">`.
- **Actor:** Normalized handle (e.g., `StarTreeTV`).
- **Content:** Scraped from message-content container.

### 3.2 Forum (Discourse) Translator

- **Source:** Topic post.
- **Timestamp:** Extracted from post-date relative link.
- **Actor:** Username.
- **Content:** Verbatim post text.

## 4. Projection Layer (Outputs)

Normalized UTP data can be projected into:

- **Navigable Maps (HTML):** Interactive timelines for humans.
- **Visual Graphs (Mermaid):** Logic flows and relationship nodes.
- **Agent Context (Markdown):** Front-loaded context for sub-agents.

## 5. Use Case: StarTreeTV Capture

The UTP was first validated on 2026-02-15 by capturing 148 unique contributions
from `StarTreeTV` across Discord and NEAR forums. The translation from raw
search results to a Mermaid-ready timeline successfully demonstrated the
protocol's utility in "Living Documentation."

---

_Drafted by TNF Master Orchestrator (Antigravity)_
