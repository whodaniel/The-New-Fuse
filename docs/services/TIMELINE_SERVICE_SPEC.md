# TNF Timeline Service: Feature Specification

**Project Goal:** To implement a high-performance, multitenant Timeline and
Board service inspired by the legacy "Timelinr" software, optimized for The New
Fuse (TNF).

---

## 1. Core Service Architecture

### 1.1 Multitenancy

- Each user/tenant has their own isolated workspace for Timelines and Boards.
- Projects are represented as "Cards" on an overview page.

### 1.2 The "Now" Bar

- A real-time vertical indicator on the timeline showing the current moment.
- **Differentiator:** Support for "Minute-Level Planning" (ultra-granular zoom).

---

## 2. Functional Feature Set

### 2.1 Timeline Engine

- **In-place Editing:** Click-to-edit for project names and task (bar) names.
- **Dynamic Manipulation:**
  - Drag-and-drop to move bars.
  - Edge-dragging to adjust start/end times.
  - Multi-level zooming (Mouse + Shift, UI controls, preset levels).
- **Visualization:** Custom colors for bars to represent priority, team, or
  status.

### 2.2 Integration: Boards <-> Timelines

- **Unified Cards:** Data maps 1:1 between Kanban cards and Timeline bars.
- **Linking System:**
  - Ability to "Push to Timeline" from a Kanban card.
  - One card can link to multiple timelines.
- **Stakeholder Macro-View:** A "Master Timeline" that aggregates linked bars
  from various team boards.

### 2.3 Task Detail Sidebar

- **Properties:** Name, timeframe, assigned team members, color.
- **Rich Content:**
  - Markdown-capable descriptions.
  - **Nested To-Dos:** Support for sub-tasks (indent/outdent).
  - **Tiered Comments:** One-level deep threading for replies.

### 2.4 Collaboration & Sharing

- **SimulCollab™ Equivalent:** Real-time state syncing over the TNF Relay
  (WebSockets).
- **Public Sharing:** Toggleable public links (no login required for viewing).
- **Activity Feed:** Global log of team updates across all projects.
- **Notifications:** Mention system (@user) with deep-linking to specific tasks.

---

## 3. Design Philosophy

- **Dark UI Priority:** Native "Developer-First" aesthetic to match IDEs and
  system tools.
- **Minimalistic Management:** The UI should facilitate "attacking the work"
  rather than forcing rigid administrative ceremonies.

---

## 4. Visual Reference (Legacy Product Shots)

For UI inspiration and architectural reference:

1. [Project Overview](https://cdnp2.stackassets.com/ff141e6d62771e5bd8f6705f07a99528ce12bd82/store/d7eb7cd8e9bedf54213d5d439afbcf17553242124868263973d66247736d/product_22810_product_shots1_image.jpg)
2. [Timeline Detail View](https://cdnp1.stackassets.com/95bbdf6c7e7d29ac2e473b23590ac3d40c11bc1a/store/f8ec3c1f38cf3e215ff695682efe5bbfe7518fddac0e55b300c658ccd0d0/product_22810_product_shots2_image.jpg)
3. [Kanban Board Interaction](https://cdnp2.stackassets.com/1e6cef539c0b009860302d562841eeec31deda65/store/fd89c28310c08df51f38de2386657c9d3c7008f7ee88d9569234effbe6bc/product_22810_product_shots3_image.jpg)
4. [Mobile Responsiveness](https://cdnp1.stackassets.com/8ad89bf224b126bfedd8ea0b8026efeaaecefbfa/store/2efd3285db763030b50457f484295ffaece39f5369e1771743c7cfb8191e/product_22810_product_shots4_image.jpg)
5. [Dashboard Analytics](https://cdnp1.stackassets.com/1b6ac614783de73be5bff007048ebc1144883863/store/de41d26f220ead29598c57a76d1f2a1c7114d252ffcee03fe58e488354c0/product_22810_product_shots5_image.jpg)

---

## 5. Next Steps for Implementation

1. **Database Schema:** Extend the TNF Postgres schema to handle `Timeline`,
   `Board`, `Task`, `Link`, and `Activity` models.
2. **Relay Events:** Define the WebSocket event set for real-time collaboration.
3. **Frontend Components:** Build the Timeline visualization using a
   high-performance canvas or optimized SVG.
