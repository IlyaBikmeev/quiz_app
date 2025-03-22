package ru.bikmeev.quizz.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import ru.bikmeev.quizz.entity.UserEntity;
import ru.bikmeev.quizz.service.AuthService;

@Controller
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {
    
    private final AuthService authService;
    
    @GetMapping("/profile")
    public String showProfile(Model model) {
        UserEntity currentUser = authService.getCurrentUser();
        model.addAttribute("user", currentUser);
        return "user/profile";
    }
    
    @GetMapping("/settings")
    public String showSettings(Model model) {
        UserEntity currentUser = authService.getCurrentUser();
        model.addAttribute("user", currentUser);
        return "user/settings";
    }
} 