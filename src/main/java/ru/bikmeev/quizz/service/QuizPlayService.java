package ru.bikmeev.quizz.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ru.bikmeev.quizz.dto.AnswerRequest;
import ru.bikmeev.quizz.dto.AnswerResponse;
import ru.bikmeev.quizz.dto.AttemptResponse;
import ru.bikmeev.quizz.entity.AnswerEntity;
import ru.bikmeev.quizz.entity.AttemptEntity;
import ru.bikmeev.quizz.entity.QuestionEntity;
import ru.bikmeev.quizz.entity.QuizEntity;
import ru.bikmeev.quizz.repository.AnswerRepository;
import ru.bikmeev.quizz.repository.AttemptRepository;
import ru.bikmeev.quizz.repository.QuizRepository;

import java.util.ArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizPlayService {
    private final AttemptRepository attemptRepository;
    private final QuizRepository quizRepository;
    private final AnswerRepository answerRepository;

    @Transactional
    public AttemptResponse createAttempt(Long quizId) {
        QuizEntity quiz = quizRepository.findById(quizId).orElseThrow();
        AttemptEntity attempt = new AttemptEntity();
        attempt.setQuiz(quiz);

        AttemptEntity savedAttempt = attemptRepository.save(attempt);
        return AttemptResponse.builder()
                .id(savedAttempt.getId())
                .quizId(quizId)
                .questions(quiz.getQuestions()
                        .stream()
                        .map(q -> new AttemptResponse.Question(
                                q.getId(),
                                q.getText(),
                                q.getOptions()
                        )).toList())
                .build();
    }

    @Transactional
    public AnswerResponse answer(Long attemptId, AnswerRequest request) {
        AttemptEntity attempt = attemptRepository.findById(attemptId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No attempt with id %d found".formatted(attemptId))
        );
        QuizEntity quiz = quizRepository.findById(request.getQuizId()).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No quiz with id %d found".formatted(request.getQuizId()))
        );

        QuestionEntity question = quiz.getQuestions().stream()
                .filter(q -> q.getId().equals(request.getQuestionId()))
                .findFirst().orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No question with id %d found".formatted(request.getQuestionId()))
                );

        log.info("Correct answers: {}. Answers from request: {}", question.getCorrectAnswers(), request.getAnswers());
        boolean isCorrect = request.getAnswers().equals(
                new ArrayList<>(question.getCorrectAnswers())
        );
        AnswerEntity answer = AnswerEntity.builder()
                .attempt(attempt)
                .question(question)
                .selectedAnswers(request.getAnswers())
                .build();

        AnswerEntity savedAnswer = answerRepository.save(answer);
        log.info("Answer with id {} has been successfully saved: ", savedAnswer.getId());

        if (question.equals(quiz.getQuestions().get(quiz.getQuestions().size() - 1))) {
            attempt.setCompleted(true);
            attemptRepository.save(attempt);
            log.info("Attempt with id {} has been successfully completed!", attempt.getId());
        }

        int answeredQuestions = attempt.getAnswers().size();
        int totalQuestions = quiz.getQuestions().size();
        int correctAnswersCount = (int) attempt.getAnswers().stream()
                .filter(a -> new ArrayList<>(a.getQuestion().getCorrectAnswers()).equals(a.getSelectedAnswers()))
                .count();

        return AnswerResponse.builder()
                .correct(isCorrect)
                .answeredQuestions(answeredQuestions)
                .totalQuestions(totalQuestions)
                .correctAnswersCount(correctAnswersCount)
                .correctAnswers(new ArrayList<>(question.getCorrectAnswers()))
                .build();
    }
}
