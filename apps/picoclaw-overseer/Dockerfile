# ============================================================
# Stage 1: Build the picoclaw binary
# ============================================================
FROM golang:1.26.0-alpine AS builder

RUN apk add --no-cache git make

WORKDIR /src

# Cache dependencies - use correct path for Railway root context
COPY apps/picoclaw-overseer/go.mod apps/picoclaw-overseer/go.sum ./
RUN go mod download

# Copy source and build - use correct path for Railway root context
COPY apps/picoclaw-overseer/ .
RUN make build

# ============================================================
# Stage 2: Minimal runtime image
# ============================================================
FROM alpine:3.23

RUN apk add --no-cache ca-certificates tzdata curl busybox-extras

# Copy binary
COPY --from=builder /src/build/picoclaw /usr/local/bin/picoclaw

# Copy railway entrypoint - use correct path for Railway root context
COPY apps/picoclaw-overseer/entrypoint-railway.sh /usr/local/bin/entrypoint-railway.sh
RUN chmod +x /usr/local/bin/entrypoint-railway.sh

# Create picoclaw home directory
RUN mkdir -p /root/.picoclaw/workspace

ENTRYPOINT ["/usr/local/bin/entrypoint-railway.sh"]
