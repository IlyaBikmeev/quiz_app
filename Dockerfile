# Этап 1: Кеширование зависимостей
FROM gradle:8.13-jdk17 AS dependencies
WORKDIR /home/gradle/project
COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle
RUN gradle dependencies --no-daemon

# Этап 2: Сборка приложения
FROM gradle:8.13-jdk17 AS builder
WORKDIR /home/gradle/project
COPY --from=dependencies /home/gradle/.gradle /home/gradle/.gradle
COPY . .
RUN gradle build --no-daemon -x test

# Этап 3: Формирование финального образа
FROM amazoncorretto:17.0.12-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY --from=builder /home/gradle/project/build/libs/*.jar app.jar
EXPOSE 8080
ENV JAVA_OPTS="-Xmx512m"
ENTRYPOINT ["java", "-jar", "app.jar"]
