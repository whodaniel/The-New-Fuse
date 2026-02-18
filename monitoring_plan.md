# Implementation Plan - Real-time Agent Monitoring

The goal is to create a comprehensive, real-time "Super Admin Control Panel" for
monitoring all agents and their interactions across the TNF/OpenClaw network.

## 1. Security & Access Control

- [ ] **Restrict Frontend Routes**: Update `ComprehensiveRouter.tsx` to wrap
      administrative pages (Command Center, Observatory, Live View, and the new
      Super Admin Panel) in `RequirePermission roles={['SUPER_ADMIN']}`.
- [ ] **Restrict Backend Endpoints**: Ensure sensitive endpoints like
      `/api/orchestrator/*` and `/api/autonomous/*` check for the Super Admin
      role/token.
- [ ] **Master Admin Integration**: leverage the existing
      `isBizSynthMasterAdmin` check in `useAuthorization.ts`.

## 2. Super Admin Control Panel (`SuperAdminControlPanel.tsx`)

- [ ] **Mesh Health Visualization**: Show status of all OpenClaw/ZeroClaw
      instances and their LLM backends.
- [ ] **Agent Swarm Monitoring**: Real-time list of online agents, their current
      task, and heartbeats.
- [ ] **Unified Interaction Stream**:
  - [ ] Leverage the Relay `/activity/recent` endpoint to show a live feed of
        agent-to-agent and agent-to-user messages.
  - [ ] Integrate WebSocket for real-time updates.
- [ ] **System Metrics**: Embed CPU/Memory/Network stats from the backend
      monitoring service.
- [ ] **Control Actions**:
  - [ ] Emergency stop for agents/swarms.
  - [ ] Manual task dispatch.
  - [ ] Channel management.

## 3. Premium UI/UX

- [ ] **Rich Aesthetic**: Use a dark, "Command Center" aesthetic with
      glassmorphism and subtle animations.
- [ ] **Responsive Design**: Ensure it works well on desktop.
- [ ] **Dynamic Visualization**: Use ReactFlow or D3 (if available) for the
      network topology (enhancing the existing `SystemObservatory`).

## 4. Documentation

- [ ] Update `GEMINI.md` to document the new monitoring infrastructure and
      security rules.

## 5. Verification

- [ ] Test that a regular user cannot access the control panel.
- [ ] Test that the activity stream correctly displays real-time messages.
- [ ] Verify that ZeroClaw (Anthropic OAuth) is correctly reporting its status
      to the mesh.
