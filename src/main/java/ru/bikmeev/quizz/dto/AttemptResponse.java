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
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant startedAt;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant completedAt;
    private List<Question> questions;
    private List<Boolean> progress;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Question {
        private Long id;
        private String text;
        private List<String> options;
        private boolean isMultipleChoice;
        private List<Integer> selectedAnswers;
        private List<Integer> correctAnswers;
        private Boolean correct;
    }
}
