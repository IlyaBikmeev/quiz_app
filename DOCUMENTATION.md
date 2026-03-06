# Документация QuizForge (quiz_app)

Веб-приложение для создания и прохождения квизов (тестов). Пользователи регистрируются по email с подтверждением через OTP, создают квизы вручную или импортируют из файла, проходят тесты и получают обратную связь по ответам.

---

## Содержание

1. [Технологический стек](#технологический-стек)
2. [Структура проекта](#структура-проекта)
3. [Модель данных](#модель-данных)
4. [Безопасность и аутентификация](#безопасность-и-аутентификация)
5. [API и маршруты](#api-и-маршруты)
6. [Сервисы и бизнес-логика](#сервисы-и-бизнес-логика)
7. [Конфигурация](#конфигурация)
8. [Запуск и развёртывание](#запуск-и-развёртывание)
9. [Импорт квизов](#импорт-квизов)

---

## Технологический стек

| Компонент | Технология |
|-----------|------------|
| Язык | Java 17 |
| Фреймворк | Spring Boot 3.4.3 |
| Сборка | Gradle (Kotlin DSL) |
| БД | PostgreSQL |
| Миграции | Flyway |
| ORM | Spring Data JPA (Hibernate) |
| Безопасность | Spring Security, JWT, OTP по email |
| Кеш | Caffeine |
| Почта | Spring Mail (JavaMailSender) |
| Контейнеризация | Docker, docker-compose |
| CI/CD | GitHub Actions (workflow_dispatch) |
| Фронтенд | React (Vite), React Router, Bootstrap 5 |

---

## Структура проекта

```
quiz_app/
├── src/main/java/ru/bikmeev/quizz/
│   ├── QuizzApplication.java          # Точка входа
│   ├── config/                         # Конфигурация
│   │   ├── CacheConfig.java            # Caffeine-кеш для OTP
│   │   ├── JwtAuthenticationFilter.java  # Фильтр JWT (заголовок/куки)
│   │   ├── JwtService.java             # Генерация и проверка JWT
│   │   └── SecurityConfig.java        # Правила доступа и CORS
│   ├── controller/
│   │   └── AuthController.java        # REST: логин, регистрация, OTP, logout
│   ├── controller/rest/
│   │   ├── QuizRestController.java   # REST: список, детали, создание, импорт квизов
│   │   ├── QuizPlayRestController.java # REST: старт попытки, отправка ответа
│   │   ├── UserRestController.java    # REST: GET /api/v1/users/me
│   │   └── RootController.java        # GET / — JSON
│   ├── dto/                            # DTO для запросов/ответов
│   ├── entity/                         # JPA-сущности
│   ├── repository/                     # JpaRepository
│   └── service/                        # Бизнес-логика
├── src/main/resources/
│   ├── application.properties
│   ├── db/migration/                   # Flyway (V1__create_schema.sql)
│   └── (import_quiz_*.md — примеры файлов для импорта)
├── frontend/                            # React SPA (Vite)
│   ├── src/
│   │   ├── api/client.js               # API-клиент (base URL, токен, 401)
│   │   ├── context/AuthContext.jsx     # Токен, проверка valid
│   │   ├── components/                 # Layout, ProtectedRoute
│   │   └── pages/                      # Страницы приложения
│   ├── .env.example                    # VITE_API_URL
│   └── package.json
├── scripts/
│   └── parse_pdf_quiz.py               # Парсинг текста из PDF в формат импорта
├── Dockerfile
├── docker-compose.yaml
└── .github/workflows/deploy.yml
```

---

## Модель данных

### Сущности (JPA)

- **UserEntity** (`users`)
  - `id`, `email` (unique), `name`
  - Связи: созданные квизы (`createdQuizzes`), попытки (`attempts`).

- **QuizEntity** (`quizzes`)
  - `id`, `title`, `creator_id` (FK → users)
  - Связь: список вопросов (`questions`).

- **QuestionEntity** (`questions`)
  - `id`, `text`, `quiz_id` (FK → quizzes)
  - `question_options` (element collection): список вариантов ответа (строки).
  - `question_correct_answers` (element collection): индексы правильных вариантов (Integer).

- **AttemptEntity** (`attempts`)
  - `id`, `completed`, `quiz_id`, `user_id`
  - Связь: список ответов (`answers`).

- **AnswerEntity** (`answers`)
  - `id`, `question_id`, `attempt_id`
  - `answer_selected_answers` (element collection): выбранные индексы вариантов.

Схема БД задаётся миграцией Flyway: `src/main/resources/db/migration/V1__create_schema.sql`. JPA работает в режиме `validate` (таблицы не создаются автоматически).

### Связи

- Пользователь → квизы (один ко многим), попытки (один ко многим).
- Квиз → вопросы (один ко многим).
- Вопрос → варианты и правильные ответы (element collection).
- Попытка → ответы (один ко многим); ответ привязан к вопросу и попытке.

---

## Безопасность и аутентификация

### Схема входа

1. **Регистрация**: `POST /auth/register` (email, name) → создаётся пользователь, генерируется OTP, отправляется на email.
2. **Вход**: `POST /auth/login` (email) → генерируется OTP и отправляется на email.
3. **Подтверждение**: `POST /auth/verify` (email, otp) → проверка OTP, при успехе возвращается JWT в теле ответа; фронтенд сохраняет его в cookie `authToken` и/или заголовке `Authorization: Bearer <token>`.

Пароли не используются; аутентификация только по email + OTP + JWT.

### JWT

- Выдаётся после успешной проверки OTP.
- Хранится в cookie `authToken` (HttpOnly) и может передаваться в заголовке `Authorization: Bearer <token>` или в query-параметре `token`.
- `JwtAuthenticationFilter` извлекает токен из этих источников, проверяет подпись и срок действия, загружает пользователя через `UserDetailsServiceImpl` (по email) и устанавливает `SecurityContext`.

Настройки: `jwt.secret`, `jwt.expiration` (мс) в `application.properties` / переменных окружения.

### OTP

- Генерируется 6-значный код, хранится в кеше Caffeine (`otpCache`).
- Время жизни задаётся `otp.cache.expire-after-write` (секунды; по умолчанию 300).
- Отправка письма с OTP — через `EmailService` (Spring Mail).

### Правила доступа (SecurityConfig)

- Публичные маршруты: `/`, `/auth/**`, `/error`.
- Все запросы к `/api/**` требуют аутентификации (JWT).
- При неавторизованном доступе к API возвращается 401 (без редиректа).
- CORS: разрешён origin фронта (по умолчанию `http://localhost:5173`), настраивается через `cors.allowed-origins`.
- Сессии отключены (`SessionCreationPolicy.STATELESS`), CSRF отключён.

---

## API и маршруты

Бэкенд отдаёт только REST (JSON). Фронтенд — SPA в каталоге `frontend/`, работает на отдельном порту (например 5173) и обращается к API по URL из `VITE_API_URL`.

### REST API

**Корень:**

- `GET /` — ответ: `{ "app": "QuizForge API" }`.

**Аутентификация (публичные):**

- `POST /auth/register` — тело: `RegisterRequest` (email, name). Ответ: `AuthResponse` (message).
- `POST /auth/login` — тело: `LoginRequest` (email). Ответ: `AuthResponse` (message).
- `POST /auth/verify` — тело: `VerifyOtpRequest` (email, otp). Ответ: `AuthResponse` (token, message).
- `GET /auth/logout` — 204 No Content, очистка cookie (клиент при выходе удаляет токен у себя).

**Для авторизованных:**

- `GET /auth/validate-token` — ответ: `{ "valid": true/false }`.
- `GET /auth/user-info` — ответ: `{ "name", "email" }` или 401.
- `GET /auth/token-debug` — отладочная информация по токену.

**Квизы (`/api/v1/quizzes`):**

- `GET /api/v1/quizzes?page=0&size=5` — постраничный список. Ответ: Spring Data `Page<QuizDto>` (content, totalElements, totalPages, size, number и т.д.). В вопросах не отдаются правильные ответы.
- `GET /api/v1/quizzes/{id}` — детали квиза. Ответ: `QuizDto` (id, title, creatorName, questions без correctAnswers).
- `POST /api/v1/quizzes` — создание вручную. Тело: `CreateQuizRequest` (title, description, questions: [{ text, options, correctAnswers }]). Ответ: 201, `QuizResponse` (id, title, creatorName, questions).
- `POST /api/v1/quizzes/import` — импорт из файла. Параметр `file` (MultipartFile). Ответ: 201, `{ "id": <id> }`.

**Прохождение квиза (`/api/v1`):**

- `POST /api/v1/quizzes/{quizId}/attempts` — начать попытку. Ответ: 201, `AttemptResponse` (id, quizId, questions: [{ id, text, options, isMultipleChoice }]).
- `POST /api/v1/attempts/{attemptId}/answer` — отправить ответ. Тело: `AnswerRequest` (quizId, questionId, answers — список индексов). Ответ: `AnswerResponse` (correct, answeredQuestions, totalQuestions, correctAnswersCount, correctAnswers).

**Пользователь:**

- `GET /api/v1/users/me` — текущий пользователь. Ответ: `{ "id", "email", "name" }`.

---

## Сервисы и бизнес-логика

- **AuthService** — регистрация, генерация OTP при логине, проверка OTP, выдача JWT; получение текущего пользователя и по email.
- **UserDetailsServiceImpl** — реализация `UserDetailsService` по email (без пароля).
- **OtpService** — генерация 6-значного OTP, сохранение/проверка/очистка в кеше.
- **EmailService** — отправка письма с OTP (HTML, тема «Код для входа в QuizForge»).
- **QuizService** — постраничный список квизов, получение квиза по id, создание квиза вручную, импорт из файла (парсинг формата Question:/Options:/[*] и [ ]).
- **QuizPlayService** — создание попытки для квиза (`createAttempt`), приём ответа на вопрос (`answer`): проверка принадлежности попытки пользователю, сохранение ответа, определение правильности, завершение попытки при ответе на последний вопрос, подсчёт количества правильных ответов.

Репозитории: `UserRepository` (findByEmail, existsByEmail, existsByName), `QuizRepository`, `AttemptRepository`, `AnswerRepository` — стандартные JpaRepository.

---

## Конфигурация

Файл: `src/main/resources/application.properties`.

- **БД**: `spring.datasource.url` (по умолчанию `jdbc:postgresql://localhost:5432/quizz`), `username`, `password`. Переменные: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.
- **CORS**: `cors.allowed-origins` — разрешённые origin для фронта (через запятую). По умолчанию `http://localhost:5173`. Переменная: `CORS_ALLOWED_ORIGINS`.
- **JWT**: `jwt.secret`, `jwt.expiration` (мс). Переменные: `JWT_SECRET`, `JWT_EXPIRATION`.
- **Почта**: `spring.mail.host`, `port`, `username`, `password`, протокол smtp, SSL. Переменные: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`.
- **OTP-кеш**: `otp.cache.expire-after-write` (секунды). Переменная: `OTP_CACHE_EXPIRATION`.
- **Flyway**: включён, `classpath:db/migration`, baseline-on-migrate.

Пример переменных окружения для production приведён в `.env.example` и в workflow деплоя.

---

## Запуск и развёртывание

### Локально (бэкенд и фронт на разных портах)

1. **БД**: поднять PostgreSQL (порт 5432), создать БД `quizz`. Вариант: `cd local && docker-compose up -d`.
2. **Бэкенд**: `./gradlew bootRun`. Приложение на порту 8080. Задать при необходимости `DB_*`, `MAIL_*`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`.
3. **Фронтенд**: `cd frontend && npm install && npm run dev`. По умолчанию порт 5173. В `.env` задать `VITE_API_URL=http://localhost:8080` (или другой URL бэкенда).

Итог: в браузере открывать http://localhost:5173; все запросы к API идут на бэкенд с CORS.

### Docker (бэкенд + PostgreSQL)

Из корня: `docker-compose up -d`. Бэкенд на 8080, БД на 5432. Для работы с локальным фронтом (localhost:5173) в контейнер бэкенда передать `CORS_ALLOWED_ORIGINS=http://localhost:5173`.

### Production

- **Бэкенд**: jar или Docker; в настройках указать `cors.allowed-origins` для домена фронта.
- **Фронтенд**: `cd frontend && npm run build`. Раздавать каталог `dist` через nginx (или другой веб-сервер). Либо настроить nginx как reverse proxy к API, либо раздавать статику с отдельного домена и настроить CORS на бэкенде.

Dockerfile: многоэтапная сборка (Gradle — jar; образ `amazoncorretto:17-alpine`, порт 8080).

### CI/CD

GitHub Actions workflow `Deploy` (`.github/workflows/deploy.yml`): запуск вручную (`workflow_dispatch`). Self-hosted runner; секреты: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION`, `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD`. Шаги: checkout, `docker-compose down`, `docker-compose build --no-cache`, `docker-compose up -d --force-recreate`. При необходимости добавить в секреты `CORS_ALLOWED_ORIGINS` и передать в контейнер.

---

## Импорт квизов

- Эндпоинт: `POST /api/v1/quizzes/import`, параметр `file` (MultipartFile).
- Ожидается текстовый файл (UTF-8), например `.txt` или `.md`. Формат блоков:
  - `Question: <текст вопроса>`
  - `Options:`
  - `[*] правильный вариант` / `[ ] неправильный вариант`
- Подробное описание и пример curl — в `IMPORT_QUIZ_FORMAT.md`.
- В проекте есть примеры готовых файлов в `src/main/resources/import_quiz_forensic_medicine*.md` и скрипт `scripts/parse_pdf_quiz.py` для генерации такого файла из текста, извлечённого из PDF.

---

## Краткая сводка по ключевым файлам

| Файл | Назначение |
|------|------------|
| `QuizzApplication.java` | Точка входа Spring Boot |
| `SecurityConfig.java` | Публичные/защищённые пути, CORS, 401 для API, JWT-фильтр |
| `JwtAuthenticationFilter.java` | Извлечение JWT из header/cookie/param, установка SecurityContext |
| `JwtService.java` | Генерация/валидация JWT |
| `AuthController.java` | REST: register, login, verify, logout, validate-token, user-info, token-debug |
| `QuizRestController.java` | REST: список, детали, создание, импорт квизов |
| `QuizPlayRestController.java` | REST: старт попытки, отправка ответа на вопрос |
| `UserRestController.java` | REST: GET /api/v1/users/me |
| `AuthService.java` | Регистрация, OTP при логине, verify OTP, текущий пользователь |
| `QuizService.java` | CRUD квизов, парсинг и импорт из файла |
| `QuizPlayService.java` | Создание попытки, приём ответа, подсчёт правильных |
| `V1__create_schema.sql` | Изначальная схема БД |
| `frontend/src/api/client.js` | API-клиент (base URL, Authorization, 401 → logout) |
| `frontend/src/context/AuthContext.jsx` | Токен, проверка valid, setToken |

Документация составлена по состоянию кода проекта и может дополняться при изменении функциональности.
