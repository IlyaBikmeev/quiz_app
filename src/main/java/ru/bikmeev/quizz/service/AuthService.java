package ru.bikmeev.quizz.service;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import ru.bikmeev.quizz.config.JwtService;
import ru.bikmeev.quizz.dto.AuthResponse;
import ru.bikmeev.quizz.dto.LoginRequest;
import ru.bikmeev.quizz.dto.VerifyOtpRequest;
import ru.bikmeev.quizz.entity.UserEntity;
import ru.bikmeev.quizz.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;
    private final OtpService otpService;

    public AuthResponse generateOtp(LoginRequest request) throws MessagingException {
        String email = request.getEmail();
        
        // Создаем пользователя, если не существует
        UserEntity user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    // Создаем нового пользователя, если email не найден
                    UserEntity newUser = UserEntity.builder()
                            .email(email)
                            .name(email.split("@")[0]) // Используем часть email до @ как имя по умолчанию
                            .build();
                    return userRepository.save(newUser);
                });

        // Генерация OTP и сохранение в кеше
        String otp = otpService.generateOtp(email);

        // Отправка OTP на email
        emailService.sendOtpEmail(email, otp);

        return AuthResponse.builder()
                .message("Код подтверждения отправлен на вашу почту")
                .build();
    }

    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail();
        String otp = request.getOtp();

        // Проверяем существование пользователя
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Проверяем правильность OTP
        boolean isOtpValid = otpService.verifyOtp(email, otp);
        if (!isOtpValid) {
            throw new RuntimeException("Неверный код подтверждения или срок его действия истек");
        }

        // Очистка OTP после успешной проверки
        otpService.clearOtp(email);

        // Генерация JWT токена
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .message("Аутентификация успешна")
                .build();
    }

    public UserEntity getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }
} 