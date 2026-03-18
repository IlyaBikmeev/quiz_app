package ru.bikmeev.quizz.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "flashcards")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String term;

    @Column(columnDefinition = "TEXT")
    private String definition;

    @ManyToOne
    @JoinColumn(name = "card_set_id", referencedColumnName = "id")
    private CardSetEntity cardSet;
}
