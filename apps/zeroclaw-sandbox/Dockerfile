# ============================================================
# ZeroClaw Railway Sandbox — Multi-stage Rust build
# ============================================================
# syntax=docker/dockerfile:1.7

# ── Stage 1: Build the zeroclaw binary ───────────────────────
FROM rust:1.88-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
        pkg-config \
        git \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Clone zeroclaw source
ARG ZEROCLAW_VERSION=master
RUN git clone --depth 1 --branch ${ZEROCLAW_VERSION} \
        https://github.com/zeroclaw-labs/zeroclaw.git .

# Build release binary
RUN cargo build --release --locked \
    && cp target/release/zeroclaw /app/zeroclaw-bin \
    && strip /app/zeroclaw-bin

# Prepare runtime directory structure and default config
RUN mkdir -p /zeroclaw-data/.zeroclaw /zeroclaw-data/workspace \
    && chown -R 65534:65534 /zeroclaw-data

# ── Stage 2: Minimal Production Runtime ──────────────────────
FROM debian:trixie-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy binary and data dir
COPY --from=builder /app/zeroclaw-bin /usr/local/bin/zeroclaw
COPY --from=builder /zeroclaw-data  /zeroclaw-data

# Copy Railway entrypoint
COPY entrypoint-railway.sh /usr/local/bin/entrypoint-railway.sh
RUN chmod +x /usr/local/bin/entrypoint-railway.sh

# Environment
ENV ZEROCLAW_WORKSPACE=/zeroclaw-data/workspace
ENV HOME=/zeroclaw-data
ENV PROVIDER="openai-codex"
ENV ZEROCLAW_GATEWAY_PORT=3000

WORKDIR /zeroclaw-data
EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint-railway.sh"]
