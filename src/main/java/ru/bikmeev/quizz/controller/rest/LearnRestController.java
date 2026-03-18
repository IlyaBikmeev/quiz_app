package ru.bikmeev.quizz.controller.rest;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.bikmeev.quizz.dto.LearnAnswerRequest;
import ru.bikmeev.quizz.dto.LearnAnswerResponse;
import ru.bikmeev.quizz.service.LearnService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/learn")
public class LearnRestController {

    private final LearnService learnService;

    @PostMapping("/sessions/{sessionId}/answer")
    public ResponseEntity<LearnAnswerResponse> submitAnswer(
            @PathVariable Long sessionId,
            @RequestBody LearnAnswerRequest request) {
        return ResponseEntity.ok(learnService.submitAnswer(sessionId, request));
    }

    @PostMapping("/sessions/{sessionId}/complete")
    public ResponseEntity<Void> completeSession(@PathVariable Long sessionId) {
        learnService.completeSession(sessionId);
        return ResponseEntity.noContent().build();
    }
}
