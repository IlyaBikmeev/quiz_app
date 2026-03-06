package ru.bikmeev.quizz.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttemptResponse {
    private Long id;
    private Long quizId;
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
    }
}
