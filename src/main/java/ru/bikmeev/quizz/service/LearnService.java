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
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearnService {

    private static final double DEFAULT_EASE_FACTOR = 2.5;
    private static final double MIN_EASE_FACTOR = 1.3;

    private final LearnSessionRepository learnSessionRepository;
    private final LearnSessionQueueRepository learnSessionQueueRepository;
    private final CardSetRepository cardSetRepository;
    private final FlashcardRepository flashcardRepository;
    private final CardProgressRepository cardProgressRepository;
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

        List<FlashcardEntity> allFlashcards = flashcardRepository.findByCardSet_IdOrderByIdAsc(cardSetId);
        if (allFlashcards.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "В наборе нет карточек");
        }

        Instant now = Instant.now();
        List<FlashcardEntity> dueFlashcards = getDueFlashcards(user, allFlashcards, now);
        if (dueFlashcards.isEmpty()) {
            dueFlashcards = allFlashcards;
        }
        List<FlashcardEntity> shuffled = new ArrayList<>(dueFlashcards);
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

        FlashcardEntity flashcard = current.getFlashcard();
        if (Boolean.TRUE.equals(request.getCorrect())) {
            updateCardProgressOnCorrect(user, flashcard);
            learnSessionQueueRepository.delete(current);
        } else {
            updateCardProgressOnIncorrect(user, flashcard);
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

    private List<FlashcardEntity> getDueFlashcards(UserEntity user, List<FlashcardEntity> allFlashcards, Instant now) {
        List<Long> flashcardIds = allFlashcards.stream().map(FlashcardEntity::getId).toList();
        List<CardProgressEntity> progressList = cardProgressRepository.findByUser_IdAndFlashcard_IdIn(user.getId(), flashcardIds);
        Set<Long> notDueIds = progressList.stream()
                .filter(p -> p.getNextReviewAt() != null && p.getNextReviewAt().isAfter(now))
                .map(p -> p.getFlashcard().getId())
                .collect(Collectors.toSet());
        return allFlashcards.stream()
                .filter(f -> !notDueIds.contains(f.getId()))
                .toList();
    }

    private void updateCardProgressOnCorrect(UserEntity user, FlashcardEntity flashcard) {
        CardProgressEntity progress = cardProgressRepository
                .findByUser_IdAndFlashcard_Id(user.getId(), flashcard.getId())
                .orElse(CardProgressEntity.builder()
                        .user(user)
                        .flashcard(flashcard)
                        .intervalDays(0)
                        .repetitions(0)
                        .easeFactor(DEFAULT_EASE_FACTOR)
                        .build());

        int reps = (progress.getRepetitions() == null ? 0 : progress.getRepetitions());
        int interval = (progress.getIntervalDays() == null ? 0 : progress.getIntervalDays());
        double ef = (progress.getEaseFactor() == null ? DEFAULT_EASE_FACTOR : progress.getEaseFactor());

        int newInterval;
        if (reps == 0) {
            newInterval = 1;
        } else if (reps == 1) {
            newInterval = 6;
        } else {
            newInterval = Math.max(1, (int) Math.round(interval * ef));
        }

        progress.setRepetitions(reps + 1);
        progress.setIntervalDays(newInterval);
        progress.setLastReviewedAt(Instant.now());
        progress.setNextReviewAt(Instant.now().plus(newInterval, ChronoUnit.DAYS));
        progress.setEaseFactor(Math.max(MIN_EASE_FACTOR, ef + 0.1));

        cardProgressRepository.save(progress);
    }

    private void updateCardProgressOnIncorrect(UserEntity user, FlashcardEntity flashcard) {
        CardProgressEntity progress = cardProgressRepository
                .findByUser_IdAndFlashcard_Id(user.getId(), flashcard.getId())
                .orElse(CardProgressEntity.builder()
                        .user(user)
                        .flashcard(flashcard)
                        .intervalDays(0)
                        .repetitions(0)
                        .easeFactor(DEFAULT_EASE_FACTOR)
                        .build());

        progress.setRepetitions(0);
        progress.setIntervalDays(0);
        progress.setLastReviewedAt(Instant.now());
        progress.setNextReviewAt(Instant.now());

        cardProgressRepository.save(progress);
    }
}
