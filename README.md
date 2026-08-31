# StroyCompare

Кроссплатформенное приложение (Expo) + API (Go) для сравнения цен на стройматериалы и услуги + локальная доска объявлений.

> За 60 секунд — лучшая цена в регионе.

## Стек

| Слой | Технологии |
|------|------------|
| Mobile / Web | Expo SDK 54, Expo Router, TypeScript, Zustand, Axios |
| API | Go, Gin, GORM, JWT |
| Data | PostgreSQL 16, Redis 7 |
| Files | MinIO / S3 |

## Быстрый старт

### 1. Инфраструктура

```bash
docker-compose up -d