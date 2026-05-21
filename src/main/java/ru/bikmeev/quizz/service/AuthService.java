package ru.bikmeev.quizz.service;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.bikmeev.quizz.dto.AuthResponse;
import ru.bikmeev.quizz.dto.LoginRequest;
import ru.bikmeev.quizz.dto.RegisterRequest;
import ru.bikmeev.quizz.dto.VerifyOtpRequest;
import ru.bikmeev.quizz.entity.UserEntity;
import ru.bikmeev.quizz.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final OtpService otpService;

    @Transactional
    public AuthResponse register(RegisterRequest request) throws MessagingException {
        String email = request.getEmail();
        String name = request.getName();

        if (userRepository.existsByEmail(email)) {
            return AuthResponse.builder()
                    .message("Пользователь с таким email уже существует")
                    .build();
        }

        if (userRepository.existsByName(name)) {
            return AuthResponse.builder()
                    .message("Пользователь с таким именем уже существует")
                    .build();
        }

        UserEntity newUser = UserEntity.builder()
                .email(email)
                .name(name)
                .build();

        userRepository.save(newUser);

        String otp = otpService.generateOtp(email);
        emailService.sendOtpEmail(email, otp);

        return AuthResponse.builder()
                .message("Регистрация успешна. Код подтверждения отправлен на вашу почту")
                .build();
    }

    public AuthResponse generateOtp(LoginRequest request) throws MessagingException {
        String email = request.getEmail();

        if (!userRepository.existsByEmail(email)) {
            return AuthResponse.builder()
                    .message("Пользователь с таким email не найден. Пожалуйста, зарегистрируйтесь")
                    .build();
        }

        String otp = otpService.generateOtp(email);

        emailService.sendOtpEmail(email, otp);

        return AuthResponse.builder()
                .message("Код подтверждения отправлен на вашу почту")
                .build();
    }

    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail();
        String otp = request.getOtp();

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (!otpService.verifyOtp(email, otp)) {
            throw new RuntimeException("Неверный код подтверждения или срок его действия истек");
        }

        otpService.clearOtp(email);

        String token = jwtService.generateToken(user);

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
