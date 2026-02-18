# ============================================================
# Stage 1: Build the picoclaw binary
# ============================================================
FROM golang:1.26.0-alpine AS builder

# APP_PATH defaults to repo-root-relative path (railway up / git deploys).
# Override with APP_PATH=. if build context is apps/picoclaw-overseer directly.
ARG APP_PATH=apps/picoclaw-overseer

RUN apk add --no-cache git make

WORKDIR /src

# Cache dependencies
COPY ${APP_PATH}/go.mod ${APP_PATH}/go.sum ./
RUN go mod download

# Copy source and build
COPY ${APP_PATH}/ .
RUN make build

# ============================================================
# Stage 2: Minimal runtime image
# ============================================================
FROM alpine:3.23

ARG APP_PATH=apps/picoclaw-overseer

RUN apk add --no-cache ca-certificates tzdata curl busybox-extras

# Copy binary
COPY --from=builder /src/build/picoclaw /usr/local/bin/picoclaw

# Copy railway entrypoint
COPY ${APP_PATH}/entrypoint-railway.sh /usr/local/bin/entrypoint-railway.sh
RUN chmod +x /usr/local/bin/entrypoint-railway.sh

# Create picoclaw home directory
RUN mkdir -p /root/.picoclaw/workspace

ENTRYPOINT ["/usr/local/bin/entrypoint-railway.sh"]
