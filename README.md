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

### Деплой одним docker-compose (production)

Фронт собирается в образе, статика раздаётся через nginx; API проксируется на бэкенд. Один входной порт — 80.

```bash
# Обязательно: MAIL_USERNAME и MAIL_PASSWORD для OTP
export MAIL_USERNAME=your@mail.ru
export MAIL_PASSWORD=...

docker-compose up -d --build
```

Откройте http://localhost (порт 80). Бэкенд снаружи не публикуется, всё идёт через nginx.

- **frontend**: сборка Vite (`npm run build`) с `VITE_API_URL=` (пусто — запросы на тот же хост), nginx раздаёт `dist` и проксирует `/api/` и `/auth/` на контейнер `app`.
- **app**: Spring Boot, порт 8080 только внутри сети.
- При необходимости задайте `VITE_API_URL` при сборке фронта (например полный URL API), если не используете общий nginx.

### Production (раздельный деплой)

- **Бэкенд**: сборка `./gradlew build`, запуск jar или Docker (см. `docker-compose.yaml`).
- **Фронтенд**: `cd frontend && npm run build`. Раздавайте каталог `frontend/dist` через nginx с проксированием `/api` и `/auth` на бэкенд.
- В `application.properties` (или env): `cors.allowed-origins` для домена фронта, если фронт и API на разных доменах.

Подробная документация: [DOCUMENTATION.md](DOCUMENTATION.md).
