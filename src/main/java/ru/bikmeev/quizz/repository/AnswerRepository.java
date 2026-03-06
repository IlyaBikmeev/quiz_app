package ru.bikmeev.quizz.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.bikmeev.quizz.entity.AnswerEntity;

import java.util.List;

public interface AnswerRepository extends JpaRepository<AnswerEntity, Long> {

    @Query("SELECT ans FROM AnswerEntity ans JOIN FETCH ans.question WHERE ans.attempt.id = :attemptId")
    List<AnswerEntity> findByAttemptIdWithQuestion(@Param("attemptId") Long attemptId);
}
