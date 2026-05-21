package ru.bikmeev.quizz.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import ru.bikmeev.quizz.dto.AttemptResponse;
import ru.bikmeev.quizz.entity.AttemptEntity;

@Mapper(componentModel = "spring", uses = QuestionMapper.class)
public interface AttemptMapper {

    @Mapping(source = "quiz.id", target = "quizId")
    @Mapping(source = "quiz.questions", target = "questions")
    AttemptResponse toResponse(AttemptEntity attemptEntity);
}
