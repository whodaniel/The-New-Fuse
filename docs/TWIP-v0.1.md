# Internet-Draft: TWIP

- Document: `draft-twip-00`
- Title: Terminal Window Identity Protocol (TWIP)
- Intended Status: Informational
- Expires: September 18, 2026
- Updated: March 18, 2026

## Abstract

This document specifies the Terminal Window Identity Protocol (TWIP), a unified identity model and discovery protocol for terminal panes, tabs, and windows across terminal emulators, shells, and multiplexers. TWIP defines a canonical identifier (`twid`), a normalized schema for legacy identifiers (for example, `tty`, process/session IDs, emulator-specific IDs, and multiplexer IDs), and standardized discovery surfaces via environment variables, OSC query/reply, and optional local IPC APIs. TWIP also defines lifecycle events, capabilities advertisement, security/privacy controls, and conformance levels.

## Status of This Memo

This Internet-Draft is a work in progress and may change without notice. It is published for implementation feedback and interoperability testing.

## 1. Introduction

Terminal automation and observability workflows currently rely on fragmented identity signals:

1. kernel PTY/TTY paths;
2. process/session metadata;
3. terminal-emulator-specific environment variables;
4. multiplexer-specific identifiers;
5. optional GUI window handles or titles.

These signals are not standardized into one interoperable object. TWIP defines a common protocol for deriving, representing, and querying terminal runtime identity.

## 2. Conventions and Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHOULD", "SHOULD NOT", and "MAY" in this document are to be interpreted as described in RFC 2119 and RFC 8174 when, and only when, they appear in all capitals.

### 2.1. Terms

- **Window**: top-level GUI terminal container.
- **Tab**: GUI tab within a window.
- **Pane**: visual region bound to one active PTY stream.
- **Session**: runtime grouping (emulator- or multiplexer-defined).
- **twid**: canonical TWIP pane identity (UUIDv7 string).
- **Incarnation**: monotonic integer incremented when identity is explicitly reconstituted (for example, clone/restore with explicit rotation).

## 3. Design Goals and Non-Goals

### 3.1. Goals

1. Provide one canonical `twid` per pane lifetime.
2. Normalize legacy identity sources into one schema.
3. Support local automation, telemetry, and tooling portability.
4. Operate with or without GUI and with or without multiplexers.
5. Emit lifecycle events for machine-consumable state transitions.

### 3.2. Non-Goals

1. Replacing kernel PTY/process semantics.
2. Standardizing terminal rendering behavior.
3. Mandating GUI metadata exposure by default.

## 4. Protocol Overview

TWIP defines three layers:

1. **Identity Object**: canonical JSON structure.
2. **Discovery Surfaces**: env vars, OSC query/reply, optional IPC.
3. **Event and Capability Model**: lifecycle streams and feature flags.

A conformant implementation MAY expose only a subset of discovery surfaces, subject to conformance level requirements in Section 13.

## 5. Canonical Identity Object

A TWIP identity object MUST include these top-level fields:

1. `twid` (UUIDv7 string)
2. `created_at` (RFC 3339 UTC timestamp)
3. `incarnation` (non-negative integer)
4. `scope`
5. `process` (if available)
6. `pty` (if available)
7. `multiplexer` (if available)
8. `legacy` (normalized observations)

### 5.1. `scope` Object

`scope` SHOULD include:

1. `host_id` (pseudonymous host identifier)
2. `emulator_id` (implementation-defined terminal ID)
3. `window_id` (nullable)
4. `tab_id` (nullable)
5. `pane_id` (nullable)

### 5.2. Identity Stability

1. `twid` MUST remain stable for a pane lifetime.
2. `twid` MUST rotate when a pane is duplicated into a distinct runtime object.
3. `incarnation` MUST increase when explicit identity reconstitution occurs.

## 6. Legacy Identifier Normalization

Each observed legacy identifier MUST be represented as:

```json
{
  "key": "tty",
  "value": "/dev/ttys003",
  "source": "kernel",
  "confidence": 1.0,
  "observed_at": "2026-03-18T14:30:00Z"
}
```

Required fields:

1. `key` (string)
2. `value` (string, number, or structured scalar)
3. `source` (enumeration such as `kernel`, `process`, `env`, `multiplexer`, `gui`)
4. `confidence` (0.0 to 1.0)
5. `observed_at` (RFC 3339 UTC)

Recommended `key` values:

1. `tty`
2. `pty_inode`
3. `shell_pid`
4. `pgid`
5. `sid`
6. `iterm_session_id`
7. `term_session_id`
8. `windowid`
9. `tmux_session`
10. `tmux_window`
11. `tmux_pane`
12. `screen_window`
13. `gui_window_handle`
14. `gui_window_title`

## 7. Discovery Mechanisms

TWIP defines three discovery surfaces.

### 7.1. Environment Variables

Implementations SHOULD expose:

1. `TERMINAL_TWID`
2. `TERMINAL_TWIP_VERSION`
3. `TERMINAL_PANE_ID`
4. `TERMINAL_TAB_ID` (optional)
5. `TERMINAL_WINDOW_ID` (optional)
6. `TERMINAL_TWIP_SOCKET` (optional)

### 7.2. OSC Query/Reply

Until formal escape allocation is standardized, implementations MAY use a vendor-private OSC payload envelope.

1. query type: `twip.query`
2. reply type: `twip.reply`
3. reply body: Base64URL-encoded UTF-8 JSON identity object

Receivers MUST ignore unknown fields.

### 7.3. Local IPC API

If `TERMINAL_TWIP_SOCKET` is present, it MUST reference a local authenticated socket that serves JSON.

Required endpoints:

1. `GET /v1/identity`
2. `GET /v1/capabilities`
3. `GET /v1/events/stream`

## 8. Lifecycle Event Model

Event emitters SHOULD publish:

1. `pane.created`
2. `pane.focused`
3. `pane.blurred`
4. `pane.split`
5. `pane.moved`
6. `tab.created`
7. `tab.closed`
8. `window.created`
9. `window.closed`
10. `pane.closed`
11. `identity.reincarnated`

Each event MUST include:

1. `twid`
2. `timestamp` (RFC 3339 UTC)
3. `event_seq` (monotonic per emitter)
4. `event_type`

## 9. Capability Advertisement

`/v1/capabilities` MUST include:

1. `twip_version`
2. `supports_gui_metadata`
3. `supports_focus_events`
4. `supports_multiplexer_mapping`
5. `supports_pty_inode`
6. `supports_remote_propagation`

## 10. Remote Propagation

Cross-host propagation MUST be disabled by default.

When explicitly enabled, senders MAY forward:

1. `TWIP_ORIGIN_TWID`
2. `TWIP_ORIGIN_HOST_ID`
3. `TWIP_FORWARD_CHAIN`

Receivers MUST NOT overwrite local `twid`; they MAY append origin linkage metadata.

## 11. Security Considerations

1. Local IPC MUST enforce same-user filesystem permission checks.
2. Session-bound tokens SHOULD be used for IPC clients.
3. Implementations MUST treat all OSC payloads as untrusted input.
4. Event subscribers SHOULD be isolated from mutation endpoints.
5. Implementations SHOULD rate-limit query endpoints to mitigate abuse.

## 12. Privacy Considerations

1. GUI title/handle exposure MUST be opt-in.
2. Raw hostnames SHOULD NOT be exposed by default; use pseudonymous `host_id`.
3. Forwarded origin fields SHOULD be minimized in multi-hop scenarios.
4. Implementations SHOULD support per-field redaction policies.

## 13. Conformance Levels

### 13.1. Level 1 (Core)

Required:

1. identity object with `twid`, `created_at`, `incarnation`, `scope`, `legacy`;
2. env var exposure of `TERMINAL_TWID` and `TERMINAL_TWIP_VERSION`.

### 13.2. Level 2 (Observable)

Level 1 plus:

1. capability endpoint;
2. lifecycle events stream.

### 13.3. Level 3 (Full)

Level 2 plus:

1. multiplexer normalization;
2. privacy controls for GUI fields;
3. explicit remote propagation controls.

## 14. IANA Considerations

This document has no IANA actions in this revision.

Future revisions may request standardized terminal control-sequence allocation for TWIP query/reply semantics.

## 15. Reference Identity Object

```json
{
  "twid": "0195f5f1-8f8f-7b1a-b1a4-9fa3d2b2d601",
  "created_at": "2026-03-18T14:30:00Z",
  "incarnation": 0,
  "scope": {
    "host_id": "h:9af31c2e",
    "emulator_id": "wezterm",
    "window_id": "win:42",
    "tab_id": "tab:3",
    "pane_id": "pane:7"
  },
  "process": {
    "shell_pid": 84122,
    "pgid": 84122,
    "sid": 84122
  },
  "pty": {
    "path": "/dev/ttys003",
    "inode": 164889
  },
  "multiplexer": {
    "kind": "tmux",
    "session_id": "$1",
    "window_id": "@12",
    "pane_id": "%5"
  },
  "legacy": [
    {
      "key": "tty",
      "value": "/dev/ttys003",
      "source": "kernel",
      "confidence": 1.0,
      "observed_at": "2026-03-18T14:30:00Z"
    }
  ]
}
```

## 16. Deployment Guidance

1. publish schema and conformance tests;
2. ship local `twipctl` probe;
3. add emulator and multiplexer adapters;
4. collect interop results;
5. standardize control-sequence allocation.

## 17. Open Issues

1. definitive control-sequence registration strategy;
2. default confidence calibration for GUI-derived fields;
3. restored-session semantics across emulators;
4. nested multiplexer identity mapping profile.

## 18. References

### 18.1. Normative References

- RFC 2119, "Key words for use in RFCs to Indicate Requirement Levels"
- RFC 3339, "Date and Time on the Internet: Timestamps"
- RFC 8174, "Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words"
- RFC 9562, "Universally Unique IDentifiers (UUIDs)"

### 18.2. Informative References

- POSIX process/session and terminal concepts
- Common terminal emulator environment variable conventions
- Common multiplexer identifier conventions (`tmux`, `screen`)
