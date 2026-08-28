# Сборка приложения
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/api ./cmd/api

# Финальный легкий образ
FROM alpine:3.19
RUN apk --no-cache add ca-certificates
RUN adduser -D -g '' appuser
WORKDIR /home/appuser
COPY --from=builder /app/api /home/appuser/api
RUN chown -R appuser:appuser /home/appuser
USER appuser
EXPOSE 8090
CMD ["./api"]