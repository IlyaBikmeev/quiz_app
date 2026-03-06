package ru.bikmeev.quizz.controller;

import jakarta.mail.MessagingException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ru.bikmeev.quizz.config.JwtService;
import ru.bikmeev.quizz.dto.AuthResponse;
import ru.bikmeev.quizz.dto.LoginRequest;
import ru.bikmeev.quizz.dto.RegisterRequest;
import ru.bikmeev.quizz.dto.VerifyOtpRequest;
import ru.bikmeev.quizz.entity.UserEntity;
import ru.bikmeev.quizz.service.AuthService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) throws MessagingException {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) throws MessagingException {
        return ResponseEntity.ok(authService.generateOtp(request));
    }

    @PostMapping("/verify")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.verifyOtp(request));
    }

    @GetMapping("/validate-token")
    public ResponseEntity<Map<String, Boolean>> validateToken(Authentication authentication) {
        Map<String, Boolean> response = new HashMap<>();
        boolean isValid = authentication != null && authentication.isAuthenticated();
        response.put("valid", isValid);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("authToken", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user-info")
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

    @GetMapping("/token-debug")
    public ResponseEntity<Map<String, Object>> debugToken(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @CookieValue(value = "authToken", required = false) String cookieToken,
            HttpServletRequest request
    ) {
        Map<String, Object> result = new HashMap<>();
        
        // Собираем информацию о запросе
        result.put("user_agent", request.getHeader("User-Agent"));
        result.put("remote_addr", request.getRemoteAddr());
        result.put("request_url", request.getRequestURL().toString());
        
        // Проверяем наличие токена в разных источниках
        boolean hasAuthHeader = authHeader != null && authHeader.startsWith("Bearer ");
        boolean hasCookieToken = cookieToken != null && !cookieToken.isEmpty();
        
        result.put("has_auth_header", hasAuthHeader);
        result.put("has_cookie_token", hasCookieToken);
        
        // Получаем токен из любого доступного источника
        String token = null;
        
        if (hasAuthHeader) {
            token = authHeader.substring(7);
            result.put("token_source", "header");
        } else if (hasCookieToken) {
            token = cookieToken;
            result.put("token_source", "cookie");
        }
        
        if (token != null) {
            // Анализируем токен
            result.put("token_format_valid", jwtService.isTokenFormatValid(token));
            
            try {
                String username = jwtService.extractUsername(token);
                result.put("token_username", username);
                result.put("token_expiration", jwtService.getTokenExpirationInfo(token));
                
                // Проверяем существование пользователя
                try {
                    UserEntity user = authService.getUserByEmail(username);
                    result.put("user_exists", true);
                    result.put("user_name", user.getName());
                } catch (Exception e) {
                    result.put("user_exists", false);
                    result.put("user_error", e.getMessage());
                }
            } catch (Exception e) {
                result.put("token_parse_error", e.getMessage());
            }
        } else {
            result.put("token_found", false);
        }
        
        return ResponseEntity.ok(result);
    }
} 