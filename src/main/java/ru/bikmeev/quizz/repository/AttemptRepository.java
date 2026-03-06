package ru.bikmeev.quizz.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.bikmeev.quizz.entity.AttemptEntity;

import java.util.List;

public interface AttemptRepository extends JpaRepository<AttemptEntity, Long> {

    List<AttemptEntity> findByQuiz_Id(Long quizId);
}
