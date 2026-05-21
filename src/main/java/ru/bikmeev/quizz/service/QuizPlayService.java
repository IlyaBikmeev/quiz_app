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
import ru.bikmeev.quizz.entity.UserEntity;
import ru.bikmeev.quizz.mapper.AttemptMapper;
import ru.bikmeev.quizz.repository.AnswerRepository;
import ru.bikmeev.quizz.repository.AttemptRepository;
import ru.bikmeev.quizz.repository.QuizRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizPlayService {
    private final AttemptRepository attemptRepository;
    private final QuizRepository quizRepository;
    private final AnswerRepository answerRepository;
    private final AuthService authService;
    private final AttemptMapper attemptMapper;

    @Transactional
    public AttemptResponse createAttempt(Long quizId) {
        UserEntity currentUser = authService.getCurrentUser();  //TODO выпилить и чисто айдишник юзера в сущности сетить
        QuizEntity quiz = quizRepository.findById(quizId).orElseThrow();

        AttemptEntity attempt = new AttemptEntity();
        attempt.setQuiz(quiz);
        attempt.setUser(currentUser);
        attempt.setStartedAt(Instant.now());

        AttemptEntity savedAttempt = attemptRepository.save(attempt);

        return attemptMapper.toResponse(savedAttempt);
    }

    @Transactional
    public AttemptResponse startOrResumeAttempt(Long quizId) {
        return attemptRepository.findFirstByQuizIdAndUserIdAndCompletedAtIsNullOrderByIdDesc(
                        quizId, authService.getCurrentUser().getId())
                .map(attemptMapper::toResponse)
                .orElseGet(() -> createAttempt(quizId));
    }

    @Transactional(readOnly = true)
    public AttemptResponse getAttemptForReview(Long attemptId) {
        return attemptRepository.findById(attemptId)
                .map(attemptMapper::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No attempt with id %d found".formatted(attemptId)));
    }

    @Transactional
    public void completeAttempt(Long attemptId) {
        UserEntity currentUser = authService.getCurrentUser();
        AttemptEntity attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No attempt with id %d found".formatted(attemptId)));
        if (!attempt.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "У вас нет доступа к этой попытке");
        }
        if (attempt.getCompletedAt() == null) {
            attempt.setCompletedAt(Instant.now());
            attemptRepository.save(attempt);
            log.info("Attempt with id {} completed early", attempt.getId());
        }
    }

    @Transactional
    public AnswerResponse answer(Long attemptId, AnswerRequest request) {
        UserEntity currentUser = authService.getCurrentUser();

        AttemptEntity attempt = attemptRepository.findById(attemptId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No attempt with id %d found".formatted(attemptId))
        );

        // Проверяем, что попытка принадлежит текущему пользователю
        if (!attempt.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "У вас нет доступа к этой попытке");
        }

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

        int totalQuestions = quiz.getQuestions().size();
        long answeredCount = answerRepository.countByAttemptId(attemptId);
        if (answeredCount == totalQuestions) {
            attempt.setCompletedAt(Instant.now());
            attemptRepository.save(attempt);
            log.info("Attempt with id {} has been successfully completed!", attempt.getId());
        }

        int answeredQuestions = (int) answeredCount;
        List<AnswerEntity> answersForAttempt = answerRepository.findByAttemptIdWithQuestion(attemptId);
        int correctAnswersCount = (int) answersForAttempt.stream()
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
