package ru.bikmeev.quizz.controller.rest;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ru.bikmeev.quizz.dto.AnswerRequest;
import ru.bikmeev.quizz.dto.AnswerResponse;
import ru.bikmeev.quizz.dto.AttemptResponse;
import ru.bikmeev.quizz.service.QuizPlayService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class QuizPlayRestController {

    private final QuizPlayService quizPlayService;

    /** Returns active unfinished attempt (with progress) or creates a new one. Single entry point for play page — call on every load/refresh. */
    @GetMapping("/quizzes/{quizId}/attempts")
    public ResponseEntity<AttemptResponse> getOrCreateAttempt(@PathVariable Long quizId) {
        return ResponseEntity.ok(quizPlayService.startOrResumeAttempt(quizId));
    }

    /** Returns attempt with full review data (for owner). Used for "Посмотреть ответы" after finish and for resuming. */
    @GetMapping("/attempts/{attemptId}")
    public ResponseEntity<AttemptResponse> getAttemptForReview(@PathVariable Long attemptId) {
        return ResponseEntity.ok(quizPlayService.getAttemptForReview(attemptId));
    }

    @PostMapping("/attempts/{attemptId}/answer")
    public ResponseEntity<AnswerResponse> answerToQuestion(@PathVariable Long attemptId,
                                                           @RequestBody AnswerRequest request) {
        return ResponseEntity.ok(quizPlayService.answer(attemptId, request));
    }

    /** Marks attempt as completed (early finish). */
    @PostMapping("/attempts/{attemptId}/complete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void completeAttempt(@PathVariable Long attemptId) {
        quizPlayService.completeAttempt(attemptId);
    }
}
