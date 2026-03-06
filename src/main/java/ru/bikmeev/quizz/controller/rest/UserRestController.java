package ru.bikmeev.quizz.controller.rest;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.bikmeev.quizz.dto.UserMeResponse;
import ru.bikmeev.quizz.entity.UserEntity;
import ru.bikmeev.quizz.service.AuthService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserRestController {

    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<UserMeResponse> getCurrentUser() {
        UserEntity user = authService.getCurrentUser();
        return ResponseEntity.ok(UserMeResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .build());
    }
}
