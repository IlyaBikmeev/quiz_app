CREATE TABLE users
(
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    name           VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE quizzes
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    creator_id  BIGINT,
    FOREIGN KEY (creator_id) REFERENCES users (id)
);

CREATE TABLE questions
(
    id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    text    VARCHAR(500) NOT NULL,
    quiz_id BIGINT,
    FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
);

CREATE TABLE question_options
(
    question_id BIGINT       NOT NULL,
    options     VARCHAR(255) NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
);

CREATE TABLE question_correct_answers
(
    question_id     BIGINT  NOT NULL,
    correct_answers INTEGER NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
);


CREATE TABLE attempts
(
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    quiz_id   BIGINT NOT NULL,
    user_id   BIGINT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id)
);


CREATE TABLE answers
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    attempt_id  BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    FOREIGN KEY (attempt_id) REFERENCES attempts (id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
);

CREATE TABLE answer_selected_answers
(
    answer_id        BIGINT NOT NULL,
    selected_answers INT    NOT NULL
)
