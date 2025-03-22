package ru.bikmeev.quizz.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.bikmeev.quizz.dto.*;
import ru.bikmeev.quizz.entity.QuestionEntity;
import ru.bikmeev.quizz.entity.QuizEntity;
import ru.bikmeev.quizz.repository.QuizRepository;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class QuizService {
    private final QuizRepository quizRepository;

    public Page<QuizDto> getQuizPage(int page, int size) {
        return quizRepository.findAll(PageRequest.of(page, size))
                .map(this::toDto);
    }

    private QuizDto toDto(QuizEntity entity) {
        return QuizDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .questions(entity.getQuestions()
                        .stream()
                        .map(this::mapQuestionDto).toList())
                .build();
    }

    private QuestionDto mapQuestionDto(QuestionEntity questionEntity) {
        return QuestionDto.builder()
                .id(questionEntity.getId())
                .text(questionEntity.getText())
                .options(new ArrayList<>(questionEntity.getOptions()))
                .correctAnswers(new ArrayList<>(questionEntity.getCorrectAnswers()))
                .build();
    }

    public QuizDto getQuiz(long id) {
        return quizRepository.findById(id)
                .map(this::toDto).orElseThrow();
    }

    @Transactional
    public QuizResponse create(CreateQuizRequest request) {
        QuizEntity quizToSave = QuizEntity.builder()
                .title(request.getTitle())
                .build();

        quizToSave.setQuestions(request.getQuestions().stream()
                .map(q -> QuestionEntity.builder()
                        .text(q.getText())
                        .options(q.getOptions())
                        .correctAnswers(q.getCorrectAnswers())
                        .quiz(quizToSave)
                        .build())
                .toList()
        );

        QuizEntity savedQuiz = quizRepository.save(quizToSave);

        return QuizResponse.builder()
                .title(savedQuiz.getTitle())
                .questions(savedQuiz.getQuestions().stream()
                        .map(q -> QuestionResponse.builder()
                                .text(q.getText())
                                .options(q.getOptions())
                                .build())
                        .toList()
                )
                .build();
    }
}
