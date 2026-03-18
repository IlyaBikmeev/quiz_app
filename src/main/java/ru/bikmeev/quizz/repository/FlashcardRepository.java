package ru.bikmeev.quizz.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.bikmeev.quizz.entity.FlashcardEntity;

import java.util.List;

public interface FlashcardRepository extends JpaRepository<FlashcardEntity, Long> {

    List<FlashcardEntity> findByCardSet_IdOrderByIdAsc(Long cardSetId);
}
