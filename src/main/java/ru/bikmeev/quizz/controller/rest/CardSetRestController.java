package ru.bikmeev.quizz.controller.rest;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.bikmeev.quizz.dto.*;
import ru.bikmeev.quizz.service.CardSetService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/card-sets")
public class CardSetRestController {

    private final CardSetService cardSetService;

    @GetMapping
    public ResponseEntity<Page<CardSetDto>> getCardSetPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(cardSetService.getCardSetPage(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CardSetDto> getCardSet(@PathVariable Long id) {
        return ResponseEntity.ok(cardSetService.getCardSet(id));
    }

    @PostMapping
    public ResponseEntity<CreatedCardSetResponse> createCardSet(@RequestBody CreateCardSetRequest request) {
        CreatedCardSetResponse response = cardSetService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/import")
    public ResponseEntity<CreatedCardSetResponse> importCardSet(@RequestParam("file") MultipartFile file) {
        long id = cardSetService.importFromFile(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(CreatedCardSetResponse.builder().id(id).build());
    }
}
