package ru.bikmeev.quizz.controller;

import jakarta.mail.MessagingException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import ru.bikmeev.quizz.dto.AuthResponse;
import ru.bikmeev.quizz.dto.LoginRequest;
import ru.bikmeev.quizz.dto.RegisterRequest;
import ru.bikmeev.quizz.dto.VerifyOtpRequest;
import ru.bikmeev.quizz.service.AuthService;
import ru.bikmeev.quizz.entity.UserEntity;
import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    
    @GetMapping("/login")
    public String getLoginPage() {
        return "login";
    }
    
    @GetMapping("/register")
    public String getRegisterPage() {
        return "register";
    }
    
    @GetMapping("/verify")
    public String getVerifyPage() {
        return "verify";
    }
    
    @PostMapping("/register")
    @ResponseBody
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) throws MessagingException {
        return ResponseEntity.ok(authService.register(request));
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
    
    @GetMapping("/validate-token")
    @ResponseBody
    public ResponseEntity<Map<String, Boolean>> validateToken(Authentication authentication) {
        Map<String, Boolean> response = new HashMap<>();
        boolean isValid = authentication != null && authentication.isAuthenticated();
        response.put("valid", isValid);
        return ResponseEntity.ok(response);
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
    
    @GetMapping("/user-info")
    @ResponseBody
    public ResponseEntity<Map<String, String>> getUserInfo() {
        Map<String, String> userInfo = new HashMap<>();
        try {
            // Получаем информацию о текущем пользователе
            UserEntity currentUser = authService.getCurrentUser();
            userInfo.put("name", currentUser.getName());
            userInfo.put("email", currentUser.getEmail());
            return ResponseEntity.ok(userInfo);
        } catch (Exception e) {
            userInfo.put("error", "Ошибка получения информации о пользователе");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(userInfo);
        }
    }
} 