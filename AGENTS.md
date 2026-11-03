# AGENTS.md

## Project intent

QuizForge is a small quiz application primarily intended for simple personal use. Optimize for clarity, reliability, and low cognitive load rather than SaaS-style marketing or visual spectacle.

Communicate with the user in Russian unless asked otherwise. Direct, informal language is welcome.

## Product and UI rules

- Keep the UI maximally simple and task-oriented.
- Use Mantine components and their props. Do not add custom CSS, CSS modules, inline `style`, or a new design system unless the user explicitly changes this rule.
- Do not reintroduce card-learning mode into the primary quiz flow.
- Quiz questions must remain freely navigable; users are not forced to answer strictly in order.
- An unfinished attempt is server-side state and must be resumable on another device after signing into the same account.
- A user has at most one active attempt per quiz. If it exists, show `Продолжить`; do not offer reset/restart while it is active.
- Early completion is a normal completed attempt.
- Completed attempts may be reviewed. Never expose another user's attempt.
- Avoid landing-page language, promotional blocks, dashboards, gamification, charts, and decorative metrics unless requested.

## Repository layout

This is a monorepo on the `feat/serve-frontend-from-backend` line of development:

- `src/main/java/ru/bikmeev/quizz/` — Spring Boot backend.
- `src/main/resources/db/migration/` — Flyway migrations.
- `src/main/resources/static/` — packaged static resources; production frontend files are copied here during the Docker build.
- `frontend/` — React 19 + Vite + Mantine SPA. This is the frontend source used by the root Dockerfile.
- `local/docker-compose.yaml` — local PostgreSQL helper.
- `Dockerfile` — builds frontend, copies `frontend/dist` into Spring Boot, and produces one runtime image.

The old standalone repository at `/Users/ilyabikmeev/VueProjects/quizz-frontend` may still exist, but it is not the source used by this repository's Dockerfile. Do not edit or publish it unless the user explicitly asks for the standalone frontend.

## Technology

- Java 17
- Spring Boot 3.4
- Spring Security OAuth2 resource server with JWT
- Spring Data JPA / Hibernate
- PostgreSQL and Flyway
- React 19, Vite 7, Mantine 9
- Node.js 22 in Docker

## Local development

Start PostgreSQL if it is not already running:

```bash
docker compose -f local/docker-compose.yaml up -d
```

Preferred single-origin local run, with the frontend built into `frontend/dist` and served by Spring:

```bash
VITE_API_URL= npm --prefix frontend run build && SPRING_PROFILES_ACTIVE=local SPRING_WEB_RESOURCES_STATIC_LOCATIONS="file:$PWD/frontend/dist/" ./gradlew bootRun
```

Open `http://localhost:8080`.

Separate dev servers when hot reload is useful:

```bash
SPRING_PROFILES_ACTIVE=local ./gradlew bootRun
```

```bash
cd frontend
npm run dev
```

For separate dev servers, `frontend/.env` normally contains:

```dotenv
VITE_API_URL=http://localhost:8080
```

`frontend/.env` is local and must not be committed.

## Verification commands

Run checks proportional to the change. For a full-stack feature, use all of these:

```bash
cd frontend && npm run lint && npm run build
```

```bash
./gradlew test
./gradlew bootJar
```

```bash
docker build -t quizz-local-check .
```

For a focused backend change, targeted tests are acceptable during iteration, but run the relevant build before handoff.

## Authentication and CORS

- Frontend stores the JWT in `localStorage` under `authToken`.
- Protected API requests send `Authorization: Bearer <token>`.
- Production single-origin builds set `VITE_API_URL=` so requests use relative `/api` and `/auth` paths.
- `CORS_ALLOWED_ORIGINS` is a comma-separated list parsed by `SecurityConfig`.
- Vite's generated module and stylesheet requests may include an `Origin` header even when served by the backend. The deployed backend's own public origin must therefore be present in `CORS_ALLOWED_ORIGINS`, otherwise assets can receive `403 Invalid CORS request` and the page appears blank.
- When an old standalone frontend and the embedded frontend both need access, include both exact origins, without spaces.

## Attempt domain rules

`AttemptEntity` owns the lifecycle of one user's run through one quiz:

- `completedAt == null` means active.
- `completedAt != null` means completed, including early completion.
- Persisted `AnswerEntity` rows are the source of truth for progress and score.
- Do not rely on browser state or `AttemptResponse.progress` as the only progress source. `questions[].correct` and `questions[].selectedAnswers` represent persisted answers.
- Database constraint `uk_answers_attempt_question` permits only one answer per `(attempt_id, question_id)`.
- Repeated submissions must never be implemented by removing this constraint.
- The attempts list API returns summaries only; do not load full question content for list views.
- `GET /api/v1/attempts/{attemptId}` must enforce ownership.

Current attempt-related routes include:

- `GET /api/v1/users/me/attempts` — current user's attempt summaries.
- `GET /api/v1/quizzes/{quizId}/attempts/active` — current user's active attempt summary, or 404.
- `GET /api/v1/quizzes/{quizId}/attempts` — resume the active attempt or create one.
- `GET /api/v1/attempts/{attemptId}` — full owned attempt for resume/review.
- `POST /api/v1/attempts/{attemptId}/answer` — submit an answer.
- `POST /api/v1/attempts/{attemptId}/complete` — finish early.

## Frontend behavior

- `/attempts` shows unfinished attempts first and completed attempts below.
- Continuing an attempt opens the first unanswered question.
- Completed review URLs use `/quizzes/{quizId}/play?attempt={attemptId}` so refresh does not create a new attempt.
- The quiz detail CTA is `Начать квиз` when no active attempt exists and `Продолжить · X из Y` otherwise.
- Direct SPA routes must be added to both `SpaController` and the public static-route matchers in `SecurityConfig`.

## Deployment

The root `Dockerfile` is the authoritative production build path:

1. Build `frontend/` with relative API URLs.
2. Copy `frontend/dist` into Spring resources.
3. Build the Spring Boot JAR.
4. Run one Java container on port `8080`.

The image healthcheck uses `/actuator/health/readiness` and has a long startup grace period because application startup may wait for PostgreSQL.

Inspect `docker-compose.yaml` before using it: it may represent an older separate-nginx/frontend deployment and should not be assumed to match the current single-image architecture.

## Safe working practices

- Inspect `git status` before editing and before committing.
- Preserve unrelated user changes. In particular, local `application.properties`, `application-local.properties`, `.env`, and `.DS_Store` changes may be present.
- Never stage `.env`, secrets, `.DS_Store`, or unrelated modified files.
- Do not switch branches, reset, clean, or rewrite history to implement a change when a worktree or focused edit will preserve the user's state.
- Use Flyway for schema changes; do not depend on manual production SQL.
- Keep API authorization checks server-side even when the UI hides an action.
- Do not remove database constraints to hide application bugs.
- When committing, stage explicit paths rather than `git add .`.
