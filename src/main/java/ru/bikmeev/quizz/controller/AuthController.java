package ru.bikmeev.quizz.controller;

import jakarta.mail.MessagingException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import ru.bikmeev.quizz.dto.AuthResponse;
import ru.bikmeev.quizz.dto.LoginRequest;
import ru.bikmeev.quizz.dto.VerifyOtpRequest;
import ru.bikmeev.quizz.service.AuthService;

@Controller
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    
    @GetMapping("/login")
    public String getLoginPage() {
        return "login";
    }
    
    @GetMapping("/verify")
    public String getVerifyPage() {
        return "verify";
    }
    
    @PostMapping("/login")
    @ResponseBody
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) throws MessagingException {
        return ResponseEntity.ok(authService.generateOtp(request));
    }
    
    @PostMapping("/verify")
    @ResponseBody
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.verifyOtp(request));
    }
    
    @GetMapping("/logout")
    public String logout(HttpServletResponse response) {
        // Удаляем куки с токеном
        Cookie cookie = new Cookie("authToken", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);
        
        return "redirect:/auth/login";
    }
} 