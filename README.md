# StroyCompare

Кроссплатформенное приложение (Expo) + API (Go) для **сравнения цен** на стройматериалы и услуги и **локальной доски объявлений**.

> За 60 секунд — лучшая цена в регионе, без десяти вкладок.

Подробнее о продукте: [docs/PRODUCT.md](docs/PRODUCT.md)

## Стек

| Слой | Технологии |
|------|------------|
| Mobile / Web | Expo (SDK 54), Expo Router, TypeScript, Zustand, Axios |
| API | Go, Gin, GORM, JWT |
| Data | PostgreSQL 16, Redis 7 |
| Files (план) | MinIO / S3 |

## Структура репозитория
stroycompare/
├── app/                 # Expo-приложение
├── backend/             # Go API
├── docs/                # Продукт, архитектура, API
├── docker-compose.yml   # Postgres, Redis, MinIO
└── README.md

## Быстрый старт

### 1. Инфраструктура

```bash
docker-compose up -d