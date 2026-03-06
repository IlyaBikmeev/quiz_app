package ru.bikmeev.quizz.controller.rest;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.bikmeev.quizz.dto.*;
import ru.bikmeev.quizz.service.QuizService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/quizzes")
public class QuizRestController {

    private final QuizService quizService;

    @GetMapping
    public ResponseEntity<Page<QuizDto>> getQuizPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(quizService.getQuizPageForDisplay(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizDto> getQuiz(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuizForDisplay(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuizDto> updateQuiz(@PathVariable Long id, @RequestBody CreateQuizRequest request) {
        return ResponseEntity.ok(quizService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long id) {
        quizService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<QuizResponse> createQuiz(@RequestBody CreateQuizRequest request) {
        QuizResponse response = quizService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/import")
    public ResponseEntity<CreatedQuizResponse> importQuiz(@RequestParam("file") MultipartFile file) {
        long id = quizService.importQuizFromFile(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(CreatedQuizResponse.builder().id(id).build());
    }
}
