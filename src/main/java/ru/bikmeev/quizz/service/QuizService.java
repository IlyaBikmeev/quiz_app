package ru.bikmeev.quizz.service;

import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.bikmeev.quizz.dto.*;
import ru.bikmeev.quizz.entity.AttemptEntity;
import ru.bikmeev.quizz.entity.QuestionEntity;
import ru.bikmeev.quizz.entity.QuizEntity;
import ru.bikmeev.quizz.entity.UserEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import ru.bikmeev.quizz.repository.AttemptRepository;
import ru.bikmeev.quizz.repository.QuizRepository;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {
    private final QuizRepository quizRepository;
    private final AttemptRepository attemptRepository;
    private final AuthService authService;

    public Page<QuizDto> getQuizPage(int page, int size) {
        return quizRepository.findAll(PageRequest.of(page, size))
                .map(this::toDto);
    }

    private QuizDto toDto(QuizEntity entity) {
        return QuizDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .creatorName(entity.getCreator() != null ? entity.getCreator().getName() : "Неизвестный")
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

    private QuestionDto mapQuestionDtoWithoutCorrect(QuestionEntity questionEntity) {
        return QuestionDto.builder()
                .id(questionEntity.getId())
                .text(questionEntity.getText())
                .options(new ArrayList<>(questionEntity.getOptions()))
                .correctAnswers(null)
                .build();
    }

    private QuizDto toDtoForDisplay(QuizEntity entity, boolean canEdit) {
        return QuizDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .creatorName(entity.getCreator() != null ? entity.getCreator().getName() : "Неизвестный")
                .questions(entity.getQuestions()
                        .stream()
                        .map(this::mapQuestionDtoWithoutCorrect).toList())
                .canEdit(canEdit)
                .build();
    }

    public QuizDto getQuiz(long id) {
        return quizRepository.findById(id)
                .map(this::toDto).orElseThrow();
    }

    public QuizDto getQuizForDisplay(long id) {
        UserEntity currentUser = authService.getCurrentUser();
        QuizEntity entity = quizRepository.findById(id).orElseThrow();
        boolean canEdit = currentUser != null && entity.getCreator() != null
                && entity.getCreator().getId().equals(currentUser.getId());
        if (canEdit) {
            QuizDto dto = toDto(entity);
            dto.setCanEdit(true);
            return dto;
        }
        return toDtoForDisplay(entity, false);
    }

    @Transactional
    public QuizDto update(long id, CreateQuizRequest request) {
        UserEntity currentUser = authService.getCurrentUser();
        QuizEntity entity = quizRepository.findById(id).orElseThrow();
        if (entity.getCreator() == null || !entity.getCreator().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Редактировать может только автор квиза");
        }
        entity.setTitle(request.getTitle() != null ? request.getTitle() : entity.getTitle());
        entity.getQuestions().clear();
        List<QuestionEntity> newQuestions = request.getQuestions().stream()
                .map(q -> QuestionEntity.builder()
                        .text(q.getText())
                        .options(q.getOptions())
                        .correctAnswers(q.getCorrectAnswers())
                        .quiz(entity)
                        .build())
                .toList();
        entity.getQuestions().addAll(newQuestions);
        QuizEntity saved = quizRepository.save(entity);
        return toDto(saved);
    }

    @Transactional
    public void delete(long id) {
        UserEntity currentUser = authService.getCurrentUser();
        QuizEntity entity = quizRepository.findById(id).orElseThrow();
        if (entity.getCreator() == null || !entity.getCreator().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Удалить может только автор квиза");
        }
        List<AttemptEntity> attempts = attemptRepository.findByQuiz_Id(id);
        attemptRepository.deleteAll(attempts);
        quizRepository.delete(entity);
    }

    public Page<QuizDto> getQuizPageForDisplay(int page, int size) {
        UserEntity currentUser = authService.getCurrentUser();
        return quizRepository.findAll(PageRequest.of(page, size))
                .map(entity -> {
                    boolean canEdit = currentUser != null && entity.getCreator() != null
                            && entity.getCreator().getId().equals(currentUser.getId());
                    return toDtoForDisplay(entity, canEdit);
                });
    }

    @Transactional
    public QuizResponse create(CreateQuizRequest request) {
        UserEntity currentUser = authService.getCurrentUser();
        
        QuizEntity quizToSave = QuizEntity.builder()
                .title(request.getTitle())
                .creator(currentUser)
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
                .id(savedQuiz.getId())
                .title(savedQuiz.getTitle())
                .creatorName(savedQuiz.getCreator().getName())
                .questions(savedQuiz.getQuestions().stream()
                        .map(q -> QuestionResponse.builder()
                                .text(q.getText())
                                .options(q.getOptions())
                                .build())
                        .toList()
                )
                .build();
    }

    @Transactional
    @SneakyThrows
    public long importQuizFromFile(MultipartFile file) {
        UserEntity currentUser = authService.getCurrentUser();
        
        String content = new String(file.getBytes(), StandardCharsets.UTF_8);

        List<QuestionEntity> questions = parseQuestions(content);
        QuizEntity quiz = new QuizEntity();
        quiz.setTitle("Импортированный квиз " + LocalDateTime.now());
        quiz.setCreator(currentUser);
        quiz.setQuestions(questions);
        questions.forEach(question -> question.setQuiz(quiz));
        QuizEntity saved = quizRepository.save(quiz);
        return saved.getId();
    }

    private List<QuestionEntity> parseQuestions(String content) {
        List<QuestionEntity> questions = new ArrayList<>();

        // Захватываем текст вопроса между "Question:" и "Options:"
        // и блок вариантов, который идет до следующего "Question:" или конца файла
        Pattern questionPattern = Pattern.compile(
                "Question:\\s*(.*?)\\s*Options:\\s*((?:(?!Question:).)+)",
                Pattern.DOTALL);
        Matcher questionMatcher = questionPattern.matcher(content);

        while (questionMatcher.find()) {
            String questionText = questionMatcher.group(1).trim();
            String optionsBlock = questionMatcher.group(2).trim();

            List<String> options = new ArrayList<>();
            List<Integer> correctAnswers = new ArrayList<>();

            // Для вариантов ответа используем тот же шаблон
            Pattern optionPattern = Pattern.compile("\\[(\\*| )\\]\\s*(.*?)(?:\\n|$)", Pattern.DOTALL);
            Matcher optionMatcher = optionPattern.matcher(optionsBlock);
            int index = 0;
            while (optionMatcher.find()) {
                boolean isCorrect = "*".equals(optionMatcher.group(1).trim());
                String optionText = optionMatcher.group(2).trim();
                options.add(optionText);
                if (isCorrect) {
                    correctAnswers.add(index);
                }
                index++;
            }

            QuestionEntity question = QuestionEntity.builder()
                    .text(questionText)
                    .options(options)
                    .correctAnswers(correctAnswers)
                    .build();
            questions.add(question);
        }
        return questions;
    }


}
