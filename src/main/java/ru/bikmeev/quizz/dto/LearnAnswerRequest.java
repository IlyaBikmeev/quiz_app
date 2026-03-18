package ru.bikmeev.quizz.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnAnswerRequest {
    private Long cardId;
    private Boolean correct;
    /** MULTIPLE_CHOICE, WRITTEN, TRUE_FALSE */
    private String answerType;
    /** TERM_TO_DEF или DEF_TO_TERM */
    private String direction;
}
