# Multi-stage build for Go Backend
FROM golang:1.27-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

# Copies all backend components into the build staging environment
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/server

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata

# Security: Create non-root system user and group
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/server .
# Create data directory with permissions for unprivileged user
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

# FIXED: Pulls the assets folder cleanly out of the container cache stage
COPY --from=builder /app/assets /assets

USER appuser

EXPOSE 8080
ENV PORT=8080
ENV DB_PATH=/app/data/electrical_shop.db

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0 || exit 1

CMD ["./server"]
