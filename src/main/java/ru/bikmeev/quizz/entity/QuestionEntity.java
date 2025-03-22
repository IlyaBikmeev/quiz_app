package ru.bikmeev.quizz.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String text;

    @ElementCollection
    @CollectionTable(
            name = "question_options",
            joinColumns = @JoinColumn(name = "question_id")
    )
    private List<String> options;

    @ElementCollection
    @CollectionTable(
            name = "question_correct_answers",
            joinColumns = @JoinColumn(name = "question_id")
    )
    private List<Integer> correctAnswers;

    @ManyToOne
    @JoinColumn(name = "quiz_id")
    private QuizEntity quiz;
}
