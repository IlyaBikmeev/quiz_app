package ru.bikmeev.quizz.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import ru.bikmeev.quizz.dto.AttemptResponse;
import ru.bikmeev.quizz.entity.QuestionEntity;

@Mapper(componentModel = "spring")
public interface QuestionMapper {

    @Mapping(target = "multipleChoice", expression = "java(question.getCorrectAnswers().size() > 1)")
    AttemptResponse.Question toResponse(QuestionEntity question);
}
