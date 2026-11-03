# QuizForge

Веб-приложение для создания и прохождения квизов (тестов). Бэкенд — REST API (Spring Boot), фронтенд — SPA на React (Vite). Регистрация и вход по email с подтверждением через OTP.

## Локальный запуск

### Требования

- Java 17
- Node.js 22 и npm
- PostgreSQL 14+
- Docker — только если PostgreSQL удобнее запускать в контейнере

### 1. База данных

Поднимите PostgreSQL на порту `5432` и создайте базу `quizz`. Готовый локальный compose-файл запускает только базу данных:

```bash
docker compose -f local/docker-compose.yaml up -d
```

При использовании другого PostgreSQL передайте настройки Spring Boot:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/quizz
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=postgres
```

Flyway применит миграции автоматически при запуске приложения.

### Вариант A: frontend и backend в dev-режиме

Запустите backend из корня проекта:

```bash
./gradlew bootRun
```

В отдельном терминале запустите Vite:

```bash
cd frontend
npm ci
npm run dev
```

Откройте [http://localhost:5173](http://localhost:5173). Backend доступен на `http://localhost:8080`.

Для нестандартного адреса API создайте `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:8080
```

### Вариант B: единый адрес без CORS

Соберите frontend с относительными API-путями:

```bash
cd frontend
npm ci
VITE_API_URL="" npm run build
cd ..
```

Запустите Spring Boot и подключите собранную статику:

```bash
SPRING_WEB_RESOURCES_STATIC_LOCATIONS="file:$PWD/frontend/dist/" ./gradlew bootRun
```

Всё приложение будет доступно на [http://localhost:8080](http://localhost:8080). Frontend обращается к `/api` и `/auth` на том же origin, поэтому CORS в этом режиме не используется.

### Запуск с телефона в локальной сети

В едином режиме откройте на телефоне `http://<локальный-IP-компьютера>:8080`. Телефон и компьютер должны находиться в одной сети, а локальный firewall должен разрешать входящие подключения к порту `8080`.

### Почта и авторизация

Для реальной отправки OTP задайте `MAIL_USERNAME` и `MAIL_PASSWORD`. При необходимости также можно переопределить `JWT_SECRET`, `JWT_EXPIRATION` и `CORS_ALLOWED_ORIGINS`.

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
