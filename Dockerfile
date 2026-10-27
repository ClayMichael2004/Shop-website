# Multi-stage build for React Frontend & Go Backend

# Stage 1: Build React Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Build Go Backend
FROM golang:1.27-alpine AS builder

WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/server

# Stage 3: Production Runtime
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata

RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/server .
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

COPY assets /assets
COPY assets /app/assets
COPY --from=frontend-builder /app/frontend/dist /app/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

USER appuser

EXPOSE 8080
ENV PORT=8080
ENV DB_PATH=/app/data/electrical_shop.db

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1

CMD ["./server"]
