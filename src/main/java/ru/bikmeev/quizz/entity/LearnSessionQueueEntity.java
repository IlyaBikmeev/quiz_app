package ru.bikmeev.quizz.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "learn_session_queue")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnSessionQueueEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "session_id", referencedColumnName = "id")
    private LearnSessionEntity session;

    @ManyToOne
    @JoinColumn(name = "flashcard_id", referencedColumnName = "id")
    private FlashcardEntity flashcard;

    private Integer position;
}
