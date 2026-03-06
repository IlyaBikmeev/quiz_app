package ru.bikmeev.quizz.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttemptResponse {
    private Long id;
    private Long quizId;
    /** Start time of the attempt (for timer: elapsed = now - startedAt). */
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant startedAt;
    /** When set, attempt is completed. */
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant completedAt;
    private List<Question> questions;
    /** For GET current: correct/incorrect per question index; null for unanswered. */
    private List<Boolean> progress;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Question {
        private Long id;
        private String text;
        private List<String> options;
        private boolean isMultipleChoice;
        /** Filled for answered questions: user's selected option indices. */
        private List<Integer> selectedAnswers;
        /** Filled for answered questions: correct option indices. */
        private List<Integer> correctAnswers;
        /** Filled for answered questions: whether the answer was correct. */
        private Boolean correct;
    }
}
