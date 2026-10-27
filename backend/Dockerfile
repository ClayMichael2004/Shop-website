FROM golang:1.27-alpine AS builder

WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/server

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata

RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/server .
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

COPY assets /assets

USER appuser

EXPOSE 8080
ENV PORT=8080
ENV DB_PATH=/app/data/electrical_shop.db

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0 || exit 1

CMD ["./server"]
