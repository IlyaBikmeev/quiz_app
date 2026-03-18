package ru.bikmeev.quizz.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.bikmeev.quizz.entity.LearnSessionEntity;

import java.util.Optional;

public interface LearnSessionRepository extends JpaRepository<LearnSessionEntity, Long> {

    /** Active session = not completed (completedAt is null). */
    Optional<LearnSessionEntity> findFirstByCardSet_IdAndUser_IdAndCompletedAtIsNullOrderByIdDesc(Long cardSetId, Long userId);
}
