package ru.bikmeev.quizz.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AttemptSummaryResponse {
    private Long id;
    private Long quizId;
    private String quizTitle;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant startedAt;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant completedAt;
    private int answeredQuestions;
    private int totalQuestions;
    private int correctAnswers;
}
