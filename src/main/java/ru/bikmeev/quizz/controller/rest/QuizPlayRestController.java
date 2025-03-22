package ru.bikmeev.quizz.controller.rest;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.bikmeev.quizz.dto.AnswerRequest;
import ru.bikmeev.quizz.dto.AnswerResponse;
import ru.bikmeev.quizz.service.QuizPlayService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class QuizPlayRestController {

    private final QuizPlayService quizPlayService;

    @PostMapping("/attempts/{attemptId}/answer")
    public ResponseEntity<AnswerResponse> answerToQuestion(@PathVariable Long attemptId,
                                                           @RequestBody AnswerRequest request) {
        return ResponseEntity.ok(quizPlayService.answer(attemptId, request));
    }
}
