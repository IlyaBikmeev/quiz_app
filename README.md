# QuizForge

Веб-приложение для создания и прохождения квизов (тестов). Бэкенд — REST API (Spring Boot), фронтенд — SPA на React (Vite). Регистрация и вход по email с подтверждением через OTP.

## Быстрый старт (разные порты)

### 1. База данных

Поднимите PostgreSQL (порт 5432), создайте БД `quizz`:

```bash
# Вариант: только БД через Docker
cd local && docker-compose up -d
```

Или используйте существующий PostgreSQL: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.

### 2. Бэкенд (порт 8080)

```bash
./gradlew bootRun
```

Настройте при необходимости: `DB_*`, `MAIL_*`, `JWT_SECRET`. CORS по умолчанию разрешён для `http://localhost:5173`.

### 3. Фронтенд (порт 5173)

```bash
cd frontend
cp .env.example .env   # при необходимости отредактировать VITE_API_URL
npm install
npm run dev
```

Откройте в браузере: http://localhost:5173

Переменная окружения для API: **`VITE_API_URL`** (по умолчанию `http://localhost:8080`). Указывайте URL бэкенда, если он на другом хосте/порту.

### Production

- **Бэкенд**: сборка `./gradlew build`, запуск jar или Docker (см. `docker-compose.yaml`).
- **Фронтенд**: `cd frontend && npm run build`. Раздавайте каталог `frontend/dist` через nginx или другой веб-сервер. Укажите в nginx проксирование запросов к API на бэкенд или настройте CORS на бэкенде для домена фронта (`cors.allowed-origins`).
- В `application.properties` (или env): `cors.allowed-origins=https://your-frontend-domain.com`.

Подробная документация: [DOCUMENTATION.md](DOCUMENTATION.md).
