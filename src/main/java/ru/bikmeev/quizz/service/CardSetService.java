package ru.bikmeev.quizz.service;

import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import ru.bikmeev.quizz.dto.*;
import ru.bikmeev.quizz.entity.CardSetEntity;
import ru.bikmeev.quizz.entity.FlashcardEntity;
import ru.bikmeev.quizz.entity.UserEntity;
import ru.bikmeev.quizz.repository.CardSetRepository;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CardSetService {

    private final CardSetRepository cardSetRepository;
    private final AuthService authService;

    @Transactional
    public CreatedCardSetResponse create(CreateCardSetRequest request) {
        UserEntity currentUser = authService.getCurrentUser();

        CardSetEntity cardSet = CardSetEntity.builder()
                .title(request.getTitle())
                .creator(currentUser)
                .build();

        List<FlashcardEntity> flashcards = new ArrayList<>();
        if (request.getCards() != null) {
            for (CreateCardRequest card : request.getCards()) {
                if (card != null && (card.getTerm() != null || card.getDefinition() != null)) {
                    FlashcardEntity flashcard = FlashcardEntity.builder()
                            .term(card.getTerm() != null ? card.getTerm() : "")
                            .definition(card.getDefinition() != null ? card.getDefinition() : "")
                            .cardSet(cardSet)
                            .build();
                    flashcards.add(flashcard);
                }
            }
        }
        cardSet.setFlashcards(flashcards);

        CardSetEntity saved = cardSetRepository.save(cardSet);
        return CreatedCardSetResponse.builder().id(saved.getId()).build();
    }

    public Page<CardSetDto> getCardSetPage(int page, int size) {
        UserEntity currentUser = authService.getCurrentUser();
        return cardSetRepository.findAll(PageRequest.of(page, size))
                .map(entity -> toDtoForDisplay(entity, currentUser));
    }

    public CardSetDto getCardSet(long id) {
        UserEntity currentUser = authService.getCurrentUser();
        CardSetEntity entity = cardSetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Набор карточек не найден"));
        return toDtoForDisplay(entity, currentUser);
    }

    private CardSetDto toDto(CardSetEntity entity) {
        return CardSetDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .creatorName(entity.getCreator() != null ? entity.getCreator().getName() : "Неизвестный")
                .flashcards(entity.getFlashcards().stream()
                        .map(f -> FlashcardDto.builder()
                                .id(f.getId())
                                .term(f.getTerm())
                                .definition(f.getDefinition())
                                .build())
                        .toList())
                .build();
    }

    private CardSetDto toDtoForDisplay(CardSetEntity entity, UserEntity currentUser) {
        boolean canEdit = currentUser != null && entity.getCreator() != null
                && entity.getCreator().getId().equals(currentUser.getId());
        return CardSetDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .creatorName(entity.getCreator() != null ? entity.getCreator().getName() : "Неизвестный")
                .flashcards(entity.getFlashcards().stream()
                        .map(f -> FlashcardDto.builder()
                                .id(f.getId())
                                .term(f.getTerm())
                                .definition(f.getDefinition())
                                .build())
                        .toList())
                .canEdit(canEdit)
                .build();
    }

    @Transactional
    @SneakyThrows
    public long importFromFile(MultipartFile file) {
        UserEntity currentUser = authService.getCurrentUser();
        String content = new String(file.getBytes(), StandardCharsets.UTF_8);

        List<FlashcardEntity> flashcards = parseFlashcards(content);
        CardSetEntity cardSet = CardSetEntity.builder()
                .title("Импортированный набор " + LocalDateTime.now())
                .creator(currentUser)
                .build();
        cardSet.setFlashcards(flashcards);
        flashcards.forEach(f -> f.setCardSet(cardSet));

        CardSetEntity saved = cardSetRepository.save(cardSet);
        return saved.getId();
    }

    /**
     * Парсит файл в формате: term\tdefinition (табуляция, одна карточка на строку).
     * Пример:
     * жаропонижающий	antipyretic
     * утомление	fatigue/ tiredness
     */
    private List<FlashcardEntity> parseFlashcards(String content) {
        List<FlashcardEntity> result = new ArrayList<>();
        for (String line : content.split("\\r?\\n")) {
            if (line.contains("\t")) {
                String[] parts = line.split("\\t", 2);
                String term = parts[0].trim();
                String definition = parts.length > 1 ? parts[1].trim() : "";
                if (!term.isEmpty() || !definition.isEmpty()) {
                    result.add(FlashcardEntity.builder()
                            .term(term)
                            .definition(definition)
                            .build());
                }
            }
        }
        return result;
    }
}
