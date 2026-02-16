# ============================================================
# Stage 1: Build the picoclaw binary
# ============================================================
FROM golang:1.26.0-alpine AS builder

RUN apk add --no-cache git make

WORKDIR /src

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY . .
RUN make build

# ============================================================
# Stage 2: Minimal runtime image
# ============================================================
FROM alpine:3.23

RUN apk add --no-cache ca-certificates tzdata curl

# Copy binary
COPY --from=builder /src/build/picoclaw /usr/local/bin/picoclaw

# Copy railway entrypoint
COPY entrypoint-railway.sh /usr/local/bin/entrypoint-railway.sh
RUN chmod +x /usr/local/bin/entrypoint-railway.sh

# Create picoclaw home directory
RUN mkdir -p /root/.picoclaw/workspace

ENTRYPOINT ["/usr/local/bin/entrypoint-railway.sh"]
