package ru.bikmeev.quizz.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ru.bikmeev.quizz.dto.*;
import ru.bikmeev.quizz.entity.*;
import ru.bikmeev.quizz.repository.*;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LearnService {

    private final LearnSessionRepository learnSessionRepository;
    private final LearnSessionQueueRepository learnSessionQueueRepository;
    private final CardSetRepository cardSetRepository;
    private final FlashcardRepository flashcardRepository;
    private final AuthService authService;

    /**
     * Начать или возобновить сессию заучивания.
     * Если есть активная сессия — возвращает её. Иначе создаёт новую.
     */
    @Transactional
    public LearnSessionResponse startSession(Long cardSetId) {
        UserEntity user = authService.getCurrentUser();
        CardSetEntity cardSet = cardSetRepository.findById(cardSetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Набор карточек не найден"));

        Optional<LearnSessionEntity> existing = learnSessionRepository
                .findFirstByCardSet_IdAndUser_IdAndCompletedAtIsNullOrderByIdDesc(cardSetId, user.getId());
        if (existing.isPresent()) {
            return buildSessionResponse(existing.get());
        }

        List<FlashcardEntity> flashcards = flashcardRepository.findByCardSet_IdOrderByIdAsc(cardSetId);
        if (flashcards.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "В наборе нет карточек");
        }

        List<FlashcardEntity> shuffled = new java.util.ArrayList<>(flashcards);
        Collections.shuffle(shuffled);

        LearnSessionEntity session = LearnSessionEntity.builder()
                .user(user)
                .cardSet(cardSet)
                .startedAt(Instant.now())
                .build();
        session = learnSessionRepository.save(session);

        for (int i = 0; i < shuffled.size(); i++) {
            LearnSessionQueueEntity queueItem = LearnSessionQueueEntity.builder()
                    .session(session)
                    .flashcard(shuffled.get(i))
                    .position(i)
                    .build();
            learnSessionQueueRepository.save(queueItem);
        }

        return buildSessionResponse(session);
    }

    /**
     * Получить текущую активную сессию для набора.
     */
    @Transactional(readOnly = true)
    public Optional<LearnSessionResponse> getCurrentSession(Long cardSetId) {
        UserEntity user = authService.getCurrentUser();
        return learnSessionRepository
                .findFirstByCardSet_IdAndUser_IdAndCompletedAtIsNullOrderByIdDesc(cardSetId, user.getId())
                .map(this::buildSessionResponse);
    }

    /**
     * Отправить ответ на карточку. Возвращает следующую карточку или признак завершения.
     */
    @Transactional
    public LearnAnswerResponse submitAnswer(Long sessionId, LearnAnswerRequest request) {
        UserEntity user = authService.getCurrentUser();
        LearnSessionEntity session = learnSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Сессия не найдена"));
        if (!session.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет доступа к сессии");
        }
        if (session.getCompletedAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Сессия уже завершена");
        }

        LearnSessionQueueEntity current = learnSessionQueueRepository
                .findFirstBySession_IdOrderByPositionAsc(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Нет текущей карточки"));

        if (!current.getFlashcard().getId().equals(request.getCardId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Неверный ID карточки");
        }

        if (Boolean.TRUE.equals(request.getCorrect())) {
            learnSessionQueueRepository.delete(current);
        } else {
            int maxPos = learnSessionQueueRepository.findMaxPositionBySessionId(sessionId);
            current.setPosition(maxPos + 1);
            learnSessionQueueRepository.save(current);
        }

        Optional<LearnSessionQueueEntity> nextOpt = learnSessionQueueRepository
                .findFirstBySession_IdOrderByPositionAsc(sessionId);

        if (nextOpt.isEmpty()) {
            session.setCompletedAt(Instant.now());
            learnSessionRepository.save(session);
            return LearnAnswerResponse.builder()
                    .correct(request.getCorrect())
                    .nextCard(null)
                    .sessionComplete(true)
                    .build();
        }

        LearnCardDto nextCard = toLearnCardDto(nextOpt.get().getFlashcard());
        return LearnAnswerResponse.builder()
                .correct(request.getCorrect())
                .nextCard(nextCard)
                .sessionComplete(false)
                .build();
    }

    /**
     * Завершить сессию досрочно.
     */
    @Transactional
    public void completeSession(Long sessionId) {
        UserEntity user = authService.getCurrentUser();
        LearnSessionEntity session = learnSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Сессия не найдена"));
        if (!session.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет доступа к сессии");
        }
        if (session.getCompletedAt() == null) {
            session.setCompletedAt(Instant.now());
            learnSessionRepository.save(session);
        }
    }

    private LearnSessionResponse buildSessionResponse(LearnSessionEntity session) {
        List<LearnSessionQueueEntity> queue = learnSessionQueueRepository
                .findBySession_IdOrderByPositionAsc(session.getId());
        List<LearnCardDto> cards = queue.stream()
                .map(q -> toLearnCardDto(q.getFlashcard()))
                .toList();
        LearnCardDto currentCard = queue.isEmpty() ? null : toLearnCardDto(queue.get(0).getFlashcard());

        return LearnSessionResponse.builder()
                .sessionId(session.getId())
                .cardSetId(session.getCardSet().getId())
                .cards(cards)
                .currentCard(currentCard)
                .build();
    }

    private static LearnCardDto toLearnCardDto(FlashcardEntity f) {
        return LearnCardDto.builder()
                .id(f.getId())
                .term(f.getTerm())
                .definition(f.getDefinition())
                .build();
    }
}
