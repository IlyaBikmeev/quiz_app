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
import ru.bikmeev.quizz.repository.AnswerRepository;
import ru.bikmeev.quizz.repository.AttemptRepository;
import ru.bikmeev.quizz.repository.QuizRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizPlayService {
    private final AttemptRepository attemptRepository;
    private final QuizRepository quizRepository;
    private final AnswerRepository answerRepository;
    private final AuthService authService;

    @Transactional
    public AttemptResponse createAttempt(Long quizId) {
        UserEntity currentUser = authService.getCurrentUser();
        QuizEntity quiz = quizRepository.findById(quizId).orElseThrow();
        
        AttemptEntity attempt = new AttemptEntity();
        attempt.setQuiz(quiz);
        attempt.setUser(currentUser);
        attempt.setStartedAt(Instant.now());

        AttemptEntity savedAttempt = attemptRepository.save(attempt);
        int size = quiz.getQuestions().size();
        List<Boolean> emptyProgress = new ArrayList<>(size);
        for (int i = 0; i < size; i++) emptyProgress.add(null);
        return AttemptResponse.builder()
                .id(savedAttempt.getId())
                .quizId(quizId)
                .startedAt(savedAttempt.getStartedAt())
                .completedAt(savedAttempt.getCompletedAt())
                .questions(quiz.getQuestions()
                        .stream()
                        .map(q -> new AttemptResponse.Question(
                                q.getId(),
                                q.getText(),
                                q.getOptions(),
                                q.getCorrectAnswers().size() > 1,
                                null,
                                null,
                                null
                        )).toList())
                .progress(emptyProgress)
                .build();
    }

    /** Returns current active attempt (with progress) if exists, otherwise creates a new one. Single entry point for "start or resume". */
    @Transactional
    public AttemptResponse startOrResumeAttempt(Long quizId) {
        Optional<AttemptEntity> opt = attemptRepository.findFirstByQuiz_IdAndUser_IdAndCompletedAtIsNullOrderByIdDesc(
                quizId, authService.getCurrentUser().getId());
        if (opt.isPresent()) {
            return getCurrentAttempt(quizId);
        }
        return createAttempt(quizId);
    }

    @Transactional(readOnly = true)
    public AttemptResponse getCurrentAttempt(Long quizId) {
        UserEntity currentUser = authService.getCurrentUser();
        AttemptEntity attempt = attemptRepository.findFirstByQuiz_IdAndUser_IdAndCompletedAtIsNullOrderByIdDesc(
                quizId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No active attempt for this quiz"));
        QuizEntity quiz = attempt.getQuiz();
        List<QuestionEntity> quizQuestions = quiz.getQuestions();
        List<AttemptResponse.Question> questions = new ArrayList<>();
        for (QuestionEntity q : quizQuestions) {
            questions.add(new AttemptResponse.Question(
                    q.getId(),
                    q.getText(),
                    q.getOptions(),
                    q.getCorrectAnswers().size() > 1,
                    null,
                    null,
                    null
            ));
        }
        List<Boolean> progress = new ArrayList<>();
        for (int i = 0; i < quizQuestions.size(); i++) {
            progress.add(null);
        }
        List<AnswerEntity> answers = answerRepository.findByAttemptIdWithQuestion(attempt.getId());
        for (AnswerEntity a : answers) {
            QuestionEntity q = a.getQuestion();
            if (q == null) continue;
            List<Integer> correctSorted = (q.getCorrectAnswers() == null ? List.<Integer>of() : new ArrayList<>(q.getCorrectAnswers())).stream().sorted().toList();
            List<Integer> selectedSorted = (a.getSelectedAnswers() == null ? List.<Integer>of() : new ArrayList<>(a.getSelectedAnswers())).stream().sorted().toList();
            boolean correct = correctSorted.equals(selectedSorted);
            for (int i = 0; i < quizQuestions.size(); i++) {
                if (quizQuestions.get(i).getId().equals(q.getId())) {
                    progress.set(i, correct);
                    questions.set(i, new AttemptResponse.Question(
                            questions.get(i).getId(),
                            questions.get(i).getText(),
                            questions.get(i).getOptions(),
                            questions.get(i).isMultipleChoice(),
                            selectedSorted,
                            correctSorted,
                            correct
                    ));
                    break;
                }
            }
        }
        return AttemptResponse.builder()
                .id(attempt.getId())
                .quizId(quizId)
                .startedAt(attempt.getStartedAt())
                .completedAt(attempt.getCompletedAt())
                .questions(questions)
                .progress(progress)
                .build();
    }

    /** Returns attempt by id with full review data (selectedAnswers, correctAnswers, correct per question). For owner only. */
    @Transactional(readOnly = true)
    public AttemptResponse getAttemptForReview(Long attemptId) {
        UserEntity currentUser = authService.getCurrentUser();
        AttemptEntity attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No attempt with id %d found".formatted(attemptId)));
        if (!attempt.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "У вас нет доступа к этой попытке");
        }
        Long quizId = attempt.getQuiz().getId();
        QuizEntity quiz = attempt.getQuiz();
        List<QuestionEntity> quizQuestions = quiz.getQuestions();
        List<AttemptResponse.Question> questions = new ArrayList<>();
        for (QuestionEntity q : quizQuestions) {
            questions.add(new AttemptResponse.Question(
                    q.getId(),
                    q.getText(),
                    q.getOptions(),
                    q.getCorrectAnswers().size() > 1,
                    null,
                    null,
                    null
            ));
        }
        List<Boolean> progress = new ArrayList<>();
        for (int i = 0; i < quizQuestions.size(); i++) {
            progress.add(null);
        }
        List<AnswerEntity> answers = answerRepository.findByAttemptIdWithQuestion(attempt.getId());
        for (AnswerEntity a : answers) {
            QuestionEntity q = a.getQuestion();
            if (q == null) continue;
            List<Integer> correctSorted = (q.getCorrectAnswers() == null ? List.<Integer>of() : new ArrayList<>(q.getCorrectAnswers())).stream().sorted().toList();
            List<Integer> selectedSorted = (a.getSelectedAnswers() == null ? List.<Integer>of() : new ArrayList<>(a.getSelectedAnswers())).stream().sorted().toList();
            boolean correct = correctSorted.equals(selectedSorted);
            for (int i = 0; i < quizQuestions.size(); i++) {
                if (quizQuestions.get(i).getId().equals(q.getId())) {
                    progress.set(i, correct);
                    questions.set(i, new AttemptResponse.Question(
                            questions.get(i).getId(),
                            questions.get(i).getText(),
                            questions.get(i).getOptions(),
                            questions.get(i).isMultipleChoice(),
                            selectedSorted,
                            correctSorted,
                            correct
                    ));
                    break;
                }
            }
        }
        return AttemptResponse.builder()
                .id(attempt.getId())
                .quizId(quizId)
                .startedAt(attempt.getStartedAt())
                .completedAt(attempt.getCompletedAt())
                .questions(questions)
                .progress(progress)
                .build();
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
