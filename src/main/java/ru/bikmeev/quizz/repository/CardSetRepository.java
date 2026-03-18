package ru.bikmeev.quizz.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.bikmeev.quizz.entity.CardSetEntity;

public interface CardSetRepository extends JpaRepository<CardSetEntity, Long> {
}
