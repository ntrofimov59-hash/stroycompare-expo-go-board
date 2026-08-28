# StroyCompare API Documentation

Базовый URL API: `/api/v1`

Все запросы, требующие авторизации, должны содержать заголовок:
`Authorization: Bearer <access_token>`

---

## 1. Auth (`/api/v1/auth`)

### Регистрация
- **POST** `/auth/register`
- **Rate Limit:** 10 запросов / мин (на IP)
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "first_name": "Иван",
    "last_name": "Иванов",
    "phone": "+79991234567",
    "role": "buyer" // buyer | supplier
  }