-- Keep the most recently created answer when historical data contains
-- multiple answers for the same question in one attempt.
WITH duplicate_answers AS (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY attempt_id, question_id
                   ORDER BY id DESC
               ) AS row_number
        FROM answers
    ) ranked_answers
    WHERE row_number > 1
)
DELETE FROM answer_selected_answers
WHERE answer_id IN (SELECT id FROM duplicate_answers);

WITH duplicate_answers AS (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY attempt_id, question_id
                   ORDER BY id DESC
               ) AS row_number
        FROM answers
    ) ranked_answers
    WHERE row_number > 1
)
DELETE FROM answers
WHERE id IN (SELECT id FROM duplicate_answers);

ALTER TABLE answers
    ADD CONSTRAINT uk_answers_attempt_question
        UNIQUE (attempt_id, question_id);
