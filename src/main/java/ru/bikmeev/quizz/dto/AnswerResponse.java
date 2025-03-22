package ru.bikmeev.quizz.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerResponse {
    private boolean correct;
    private int answeredQuestions;
    private int totalQuestions;
    private int correctAnswersCount;
}
