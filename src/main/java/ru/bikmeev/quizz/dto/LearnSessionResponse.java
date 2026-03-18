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
public class LearnSessionResponse {
    private Long sessionId;
    private Long cardSetId;
    private List<LearnCardDto> cards;
    /** Текущая карточка (первая в очереди) */
    private LearnCardDto currentCard;
}
