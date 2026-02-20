# ============================================================
# Stage 1: Build the picoclaw binary
# ============================================================
FROM golang:1.26.0-alpine AS builder

RUN apk add --no-cache git make

WORKDIR /src

# Copy context and normalize source location.
# Supports both:
# 1) repo root context (expects apps/picoclaw-overseer/*)
# 2) app root context (expects ./go.mod)
COPY . /tmp/context
RUN if [ -f /tmp/context/go.mod ]; then \
      cp -R /tmp/context/. /src/; \
    elif [ -f /tmp/context/apps/picoclaw-overseer/go.mod ]; then \
      cp -R /tmp/context/apps/picoclaw-overseer/. /src/; \
    else \
      echo "picoclaw source not found in build context" >&2; \
      exit 1; \
    fi

RUN go mod download
RUN make build

# ============================================================
# Stage 2: Minimal runtime image
# ============================================================
FROM alpine:3.23

RUN apk add --no-cache ca-certificates tzdata curl busybox-extras jq

# Copy binary
COPY --from=builder /src/build/picoclaw /usr/local/bin/picoclaw

# Copy railway entrypoint
COPY --from=builder /src/entrypoint-railway.sh /usr/local/bin/entrypoint-railway.sh
RUN chmod +x /usr/local/bin/entrypoint-railway.sh

# Create picoclaw home directory
RUN mkdir -p /root/.picoclaw/workspace

ENTRYPOINT ["/usr/local/bin/entrypoint-railway.sh"]
