# ── Build stage ──────────────────────────────────────────────────────────────
FROM golang:1.26-alpine AS builder

# Install build dependencies for cgo (needed by lib/pq on some Alpine versions)
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build a statically linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /bin/api ./cmd/api/main.go

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM scratch

# Embed timezone data and CA certificates from the builder
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy the compiled binary
COPY --from=builder /bin/api /api

EXPOSE 8080

ENTRYPOINT ["/api"]
