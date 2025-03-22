package ru.bikmeev.quizz.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.bikmeev.quizz.entity.AnswerEntity;

public interface AnswerRepository extends JpaRepository<AnswerEntity, Long> {
}
