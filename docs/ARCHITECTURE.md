---

### 2. `docs/ARCHITECTURE.md`

```markdown
# StroyCompare Architecture Overview

Проект представляет собой MVP платформы сравнения цен на строительные материалы и услуги с разделением ролей покупателей (`buyer`) и поставщиков (`supplier`).

---

## 1. Технологический стек
- **Язык:** Go (версия 1.22+)
- **Фреймворк:** Gin (веб-роутинг, middleware)
- **ORM:** GORM
- **База данных:** PostgreSQL
- **Кеширование / Лимитеры:** Redis (go-redis v9)
- **Аутентификация:** JWT (Access Token на 15 минут + Refresh Token на 30 дней с хэшированием SHA-256 в БД).

---

## 2. Структура проекта (Backend)

```text
backend/
├── cmd/
│   └── server/         # Точка входа (main.go)
├── internal/
│   ├── auth/           # Хендлеры, роуты и логика авторизации / токенов
│   ├── catalog/        # Каталог товаров и категорий
│   ├── config/         # Загрузка конфигурации и валидация секретов (fail-fast)
│   ├── database/       # Подключения к PostgreSQL и Redis
│   ├── listings/       # Объявления / позиции
│   ├── middleware/     # JWT Auth, CORS, RequestID, Rate Limiting
│   ├── models/         # GORM-модели данных
│   ├── offers/         # Ценовые предложения поставщиков
│   ├── subscriptions/  # Управление подписками
│   └── users/          # Управление пользователями и профилями
├── pkg/
│   └── response/       # Унифицированные хелперы для JSON-ответов API
└── .env.example        # Шаблон конфигурации окружения