package ru.bikmeev.quizz.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "card_sets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardSetEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ManyToOne
    @JoinColumn(name = "creator_id", referencedColumnName = "id")
    private UserEntity creator;

    @OneToMany(mappedBy = "cardSet", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @Builder.Default
    private List<FlashcardEntity> flashcards = new ArrayList<>();
}
