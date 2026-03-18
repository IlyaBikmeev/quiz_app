package ru.bikmeev.quizz.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import ru.bikmeev.quizz.entity.LearnSessionQueueEntity;

import java.util.List;
import java.util.Optional;

public interface LearnSessionQueueRepository extends JpaRepository<LearnSessionQueueEntity, Long> {

    List<LearnSessionQueueEntity> findBySession_IdOrderByPositionAsc(Long sessionId);

    Optional<LearnSessionQueueEntity> findFirstBySession_IdOrderByPositionAsc(Long sessionId);

    @Query("SELECT COALESCE(MAX(q.position), 0) FROM LearnSessionQueueEntity q WHERE q.session.id = :sessionId")
    int findMaxPositionBySessionId(Long sessionId);

    @Modifying
    void deleteBySession_Id(Long sessionId);
}
