-- Наборы карточек (аналог Quizlet set)
CREATE TABLE card_sets (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    creator_id BIGINT REFERENCES users(id)
);

-- Карточки (term = лицевая сторона, definition = обратная)
CREATE TABLE flashcards (
    id BIGSERIAL PRIMARY KEY,
    term TEXT,
    definition TEXT,
    card_set_id BIGINT REFERENCES card_sets(id)
);

-- Прогресс пользователя по карточке (spaced repetition)
CREATE TABLE card_progress (
    user_id BIGINT REFERENCES users(id),
    flashcard_id BIGINT REFERENCES flashcards(id),
    next_review_at TIMESTAMP WITH TIME ZONE,
    interval_days INTEGER DEFAULT 0,
    ease_factor DOUBLE PRECISION DEFAULT 2.5,
    repetitions INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, flashcard_id)
);

-- Сессии заучивания
CREATE TABLE learn_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    card_set_id BIGINT REFERENCES card_sets(id),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Индексы
CREATE INDEX idx_flashcards_card_set_id ON flashcards(card_set_id);
CREATE INDEX idx_card_progress_user_next_review ON card_progress(user_id, next_review_at);
CREATE INDEX idx_learn_sessions_user_id ON learn_sessions(user_id);
CREATE INDEX idx_learn_sessions_card_set_id ON learn_sessions(card_set_id);
