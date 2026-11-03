package ru.bikmeev.quizz.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.bikmeev.quizz.entity.AttemptEntity;

import java.util.List;
import java.util.Optional;

public interface AttemptRepository extends JpaRepository<AttemptEntity, Long> {
    List<AttemptEntity> findByQuizId(Long quizId);
    List<AttemptEntity> findByUserIdOrderByStartedAtDesc(Long userId);
    Optional<AttemptEntity> findFirstByQuizIdAndUserIdAndCompletedAtIsNullOrderByIdDesc(Long quizId, Long userId);
}
