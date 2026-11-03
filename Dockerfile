# Этап 1: Сборка фронтенда
FROM node:22-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN VITE_API_URL= npm run build

# Этап 2: Кеширование зависимостей бэкенда
FROM gradle:8.13-jdk17 AS dependencies
WORKDIR /home/gradle/project
COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle
RUN gradle dependencies --no-daemon

# Этап 3: Сборка единого Spring Boot приложения
FROM gradle:8.13-jdk17 AS builder
WORKDIR /home/gradle/project
COPY --from=dependencies /home/gradle/.gradle /home/gradle/.gradle
COPY . .
COPY --from=frontend-builder /frontend/dist/ ./src/main/resources/static/
RUN gradle bootJar --no-daemon

# Этап 4: Формирование финального образа
FROM amazoncorretto:17.0.12-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY --from=builder /home/gradle/project/build/libs/*.jar app.jar
EXPOSE 8080
ENV JAVA_OPTS="-Xmx512m"
ENV MANAGEMENT_ENDPOINT_HEALTH_PROBES_ENABLED="true"
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=4 \
    CMD wget -q --spider http://127.0.0.1:8080/actuator/health/readiness || exit 1
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
