package ru.bikmeev.quizz.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.bikmeev.quizz.entity.AttemptEntity;

import java.util.List;
import java.util.Optional;

public interface AttemptRepository extends JpaRepository<AttemptEntity, Long> {

    List<AttemptEntity> findByQuiz_Id(Long quizId);

    Optional<AttemptEntity> findFirstByQuiz_IdAndUser_IdAndCompletedOrderByIdDesc(Long quizId, Long userId, boolean completed);
}
