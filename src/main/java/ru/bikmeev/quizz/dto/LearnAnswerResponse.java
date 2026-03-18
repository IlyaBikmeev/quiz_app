package ru.bikmeev.quizz.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnAnswerResponse {
    private Boolean correct;
    /** Следующая карточка или null если сессия завершена */
    private LearnCardDto nextCard;
    private Boolean sessionComplete;
}
