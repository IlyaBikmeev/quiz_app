package ru.bikmeev.quizz.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.bikmeev.quizz.entity.QuizEntity;

public interface QuizRepository extends JpaRepository<QuizEntity, Long> {
}
