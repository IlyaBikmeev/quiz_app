package ru.bikmeev.quizz.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.bikmeev.quizz.entity.AttemptEntity;

public interface AttemptRepository extends JpaRepository<AttemptEntity, Long> {
}
