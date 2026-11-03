# QuizForge frontend

React 19 + Vite + Mantine интерфейс для создания и прохождения квизов.

## UI-правило

Интерфейс собирается только из готовых компонентов Mantine. Локальные CSS/SCSS-файлы, Bootstrap и самописные визуальные примитивы не используются.

## Локальный запуск

```bash
npm install
npm run dev
```

По умолчанию приложение доступно на `http://localhost:5173`.

Создайте `.env`:

```dotenv
VITE_API_URL=http://localhost:8080
```

## Проверки

```bash
npm run lint
npm run build
```

Backend должен разрешать CORS для адреса frontend и предоставлять API авторизации, квизов и попыток.
