-- Создание таблицы пользователей
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255)
);

-- Создание таблицы квизов
CREATE TABLE quizzes (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    creator_id BIGINT REFERENCES users(id)
);

-- Создание таблицы вопросов
CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    text TEXT,
    quiz_id BIGINT REFERENCES quizzes(id)
);

-- Создание таблицы опций вопросов
CREATE TABLE question_options (
    question_id BIGINT REFERENCES questions(id),
    options VARCHAR(255)
);

-- Создание таблицы правильных ответов
CREATE TABLE question_correct_answers (
    question_id BIGINT REFERENCES questions(id),
    correct_answers INTEGER
);

-- Создание таблицы попыток
CREATE TABLE attempts (
    id BIGSERIAL PRIMARY KEY,
    completed BOOLEAN DEFAULT FALSE,
    quiz_id BIGINT REFERENCES quizzes(id),
    user_id BIGINT REFERENCES users(id)
);

-- Создание таблицы ответов
CREATE TABLE answers (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT REFERENCES questions(id),
    attempt_id BIGINT REFERENCES attempts(id)
);

-- Создание таблицы выбранных ответов
CREATE TABLE answer_selected_answers (
    answer_id BIGINT REFERENCES answers(id),
    selected_answers INTEGER
);

-- Создание индексов для оптимизации
CREATE INDEX idx_quizzes_creator_id ON quizzes(creator_id);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_attempts_quiz_id ON attempts(quiz_id);
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_attempt_id ON answers(attempt_id); 