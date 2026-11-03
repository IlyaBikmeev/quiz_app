package ru.bikmeev.quizz.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import ru.bikmeev.quizz.dto.AttemptSummaryResponse;
import ru.bikmeev.quizz.dto.AnswerRequest;
import ru.bikmeev.quizz.dto.AnswerResponse;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class QuizPlayServiceTest {

    @Mock private AttemptRepository attemptRepository;
    @Mock private QuizRepository quizRepository;
    @Mock private AnswerRepository answerRepository;
    @Mock private AuthService authService;
    @Mock private AttemptMapper attemptMapper;

    private QuizPlayService service;

    @BeforeEach
    void setUp() {
        service = new QuizPlayService(attemptRepository, quizRepository, answerRepository, authService, attemptMapper);
    }

    @Test
    void returnsCurrentUsersAttemptsWithCalculatedProgress() {
        UserEntity user = UserEntity.builder().id(7L).build();
        QuestionEntity answeredQuestion = QuestionEntity.builder().id(101L).correctAnswers(List.of(1)).build();
        QuestionEntity unansweredQuestion = QuestionEntity.builder().id(102L).correctAnswers(List.of(0)).build();
        QuizEntity quiz = QuizEntity.builder().id(3L).title("Столицы").questions(List.of(answeredQuestion, unansweredQuestion)).build();
        AttemptEntity attempt = new AttemptEntity();
        attempt.setId(11L);
        attempt.setUser(user);
        attempt.setQuiz(quiz);
        attempt.setStartedAt(Instant.parse("2026-11-03T12:00:00Z"));
        attempt.setAnswers(List.of(AnswerEntity.builder().attempt(attempt).question(answeredQuestion).selectedAnswers(List.of(1)).build()));

        when(authService.getCurrentUser()).thenReturn(user);
        when(attemptRepository.findByUserIdOrderByStartedAtDesc(user.getId())).thenReturn(List.of(attempt));

        List<AttemptSummaryResponse> result = service.getCurrentUserAttempts();

        assertThat(result).singleElement().satisfies(summary -> {
            assertThat(summary.getId()).isEqualTo(11L);
            assertThat(summary.getQuizTitle()).isEqualTo("Столицы");
            assertThat(summary.getAnsweredQuestions()).isEqualTo(1);
            assertThat(summary.getTotalQuestions()).isEqualTo(2);
            assertThat(summary.getCorrectAnswers()).isEqualTo(1);
            assertThat(summary.getCompletedAt()).isNull();
        });
    }

    @Test
    void rejectsReviewOfAnotherUsersAttempt() {
        UserEntity currentUser = UserEntity.builder().id(7L).build();
        UserEntity owner = UserEntity.builder().id(8L).build();
        AttemptEntity attempt = new AttemptEntity();
        attempt.setId(11L);
        attempt.setUser(owner);

        when(authService.getCurrentUser()).thenReturn(currentUser);
        when(attemptRepository.findById(attempt.getId())).thenReturn(Optional.of(attempt));

        assertThatThrownBy(() -> service.getAttemptForReview(attempt.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403 FORBIDDEN");
    }

    @Test
    void completesAttemptAfterAnsweringLastQuestion() {
        UserEntity user = UserEntity.builder().id(7L).build();
        QuestionEntity question = QuestionEntity.builder().id(101L).correctAnswers(List.of(1)).build();
        QuizEntity quiz = QuizEntity.builder().id(3L).questions(List.of(question)).build();
        AttemptEntity attempt = new AttemptEntity();
        attempt.setId(11L);
        attempt.setUser(user);
        attempt.setQuiz(quiz);
        attempt.setStartedAt(Instant.parse("2026-11-03T12:00:00Z"));
        AnswerEntity savedAnswer = AnswerEntity.builder().id(21L).attempt(attempt).question(question).selectedAnswers(List.of(1)).build();

        when(authService.getCurrentUser()).thenReturn(user);
        when(attemptRepository.findById(attempt.getId())).thenReturn(Optional.of(attempt));
        when(answerRepository.save(any(AnswerEntity.class))).thenReturn(savedAnswer);
        when(answerRepository.findByAttemptIdWithQuestion(attempt.getId())).thenReturn(List.of(savedAnswer));

        AnswerResponse response = service.answer(attempt.getId(), AnswerRequest.builder()
                .questionId(question.getId())
                .answers(List.of(1))
                .build());

        assertThat(response.getAnsweredQuestions()).isEqualTo(1);
        assertThat(response.getCorrectAnswersCount()).isEqualTo(1);
        assertThat(attempt.getCompletedAt()).isNotNull();
    }
}
