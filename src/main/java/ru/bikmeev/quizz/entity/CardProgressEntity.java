package ru.bikmeev.quizz.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "card_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(CardProgressEntity.CardProgressId.class)
public class CardProgressEntity {
    @Id
    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private UserEntity user;

    @Id
    @ManyToOne
    @JoinColumn(name = "flashcard_id", referencedColumnName = "id")
    private FlashcardEntity flashcard;

    @Column(name = "next_review_at")
    private Instant nextReviewAt;

    @Column(name = "interval_days")
    private Integer intervalDays;

    @Column(name = "ease_factor")
    private Double easeFactor;

    @Column(name = "repetitions")
    private Integer repetitions;

    @Column(name = "last_reviewed_at")
    private Instant lastReviewedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CardProgressId implements java.io.Serializable {
        private Long user;
        private Long flashcard;
    }
}
