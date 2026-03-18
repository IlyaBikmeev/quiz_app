package ru.bikmeev.quizz.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.bikmeev.quizz.entity.CardProgressEntity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CardProgressRepository extends JpaRepository<CardProgressEntity, CardProgressEntity.CardProgressId> {

    Optional<CardProgressEntity> findByUser_IdAndFlashcard_Id(Long userId, Long flashcardId);

    List<CardProgressEntity> findByUser_IdAndNextReviewAtLessThanEqual(Long userId, Instant instant);

    List<CardProgressEntity> findByUser_IdAndFlashcard_IdIn(Long userId, List<Long> flashcardIds);
}
