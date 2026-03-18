-- Очередь карточек в сессии заучивания (для отслеживания порядка и непройденных)
CREATE TABLE learn_session_queue (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES learn_sessions(id) ON DELETE CASCADE,
    flashcard_id BIGINT REFERENCES flashcards(id),
    position INTEGER NOT NULL
);

CREATE INDEX idx_learn_session_queue_session_position ON learn_session_queue(session_id, position);
