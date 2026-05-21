package ru.bikmeev.quizz.mapper;

import org.springframework.stereotype.Component;
import ru.bikmeev.quizz.dto.AttemptResponse;
import ru.bikmeev.quizz.entity.AnswerEntity;
import ru.bikmeev.quizz.entity.AttemptEntity;
import ru.bikmeev.quizz.entity.QuestionEntity;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class AttemptMapper {

    public AttemptResponse toResponse(AttemptEntity attemptEntity) {
        Map<Long, AnswerEntity> answerMap = attemptEntity.getAnswers()
                .stream()
                .collect(Collectors.toMap(a -> a.getQuestion().getId(), Function.identity()));

        return AttemptResponse.builder()
                .id(attemptEntity.getId())
                .quizId(attemptEntity.getQuiz().getId())
                .startedAt(attemptEntity.getStartedAt())
                .completedAt(attemptEntity.getCompletedAt())
                .questions(mapQuestions(attemptEntity, answerMap))
                .build();
    }

    private List<AttemptResponse.Question> mapQuestions(AttemptEntity attemptEntity, Map<Long, AnswerEntity> answerMap) {
        return attemptEntity.getQuiz()
                .getQuestions()
                .stream()
                .map(q -> mapQuestion(q, answerMap.get(q.getId())))
                .toList();
    }

    private AttemptResponse.Question mapQuestion(QuestionEntity question, AnswerEntity answer) {
        return AttemptResponse.Question.builder()
                .id(question.getId())
                .text(question.getText())
                .options(question.getOptions())
                .correctAnswers(question.getCorrectAnswers())
                .isMultipleChoice(question.getCorrectAnswers().size() > 1)
                .selectedAnswers(answer != null ? answer.getSelectedAnswers() : null)
                .correct(answer != null ? checkCorrect(question, answer) : null)
                .build();
    }

    private boolean checkCorrect(QuestionEntity q, AnswerEntity a) {
        return q.getCorrectAnswers() != null
                && a.getSelectedAnswers() != null
                && q.getCorrectAnswers().size() == a.getSelectedAnswers().size()
                && new HashSet<>(q.getCorrectAnswers()).containsAll(a.getSelectedAnswers());
    }
}
