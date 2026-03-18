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
public class CardSetDto {
    private Long id;
    private String title;
    private String creatorName;
    private List<FlashcardDto> flashcards;
    /** true, если текущий пользователь — автор набора */
    private Boolean canEdit;
}
