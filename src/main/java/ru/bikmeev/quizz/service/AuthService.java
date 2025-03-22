package ru.bikmeev.quizz.service;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import ru.bikmeev.quizz.config.JwtService;
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
    private final UserDetailsServiceImpl userDetailsService;
    private final OtpService otpService;

    /**
     * Метод для регистрации нового пользователя
     * @param request данные для регистрации
     * @return ответ с сообщением о статусе регистрации
     * @throws MessagingException если не удалось отправить email
     */
    public AuthResponse register(RegisterRequest request) throws MessagingException {
        String email = request.getEmail();
        String name = request.getName();
        
        // Проверяем, существует ли пользователь с таким email
        if (userRepository.existsByEmail(email)) {
            return AuthResponse.builder()
                    .message("Пользователь с таким email уже существует")
                    .build();
        }
        
        // Проверяем, существует ли пользователь с таким именем
        if (userRepository.existsByName(name)) {
            return AuthResponse.builder()
                    .message("Пользователь с таким именем уже существует")
                    .build();
        }
        
        // Создаем нового пользователя
        UserEntity newUser = UserEntity.builder()
                .email(email)
                .name(name)
                .build();
        
        userRepository.save(newUser);
        
        // Генерируем и отправляем OTP для подтверждения
        String otp = otpService.generateOtp(email);
        emailService.sendOtpEmail(email, otp);
        
        return AuthResponse.builder()
                .message("Регистрация успешна. Код подтверждения отправлен на вашу почту")
                .build();
    }

    /**
     * Метод для генерации OTP для авторизации существующего пользователя
     */
    public AuthResponse generateOtp(LoginRequest request) throws MessagingException {
        String email = request.getEmail();
        
        // Проверяем существование пользователя
        if (!userRepository.existsByEmail(email)) {
            return AuthResponse.builder()
                    .message("Пользователь с таким email не найден. Пожалуйста, зарегистрируйтесь")
                    .build();
        }

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

    /**
     * Получение пользователя по email
     * @param email email пользователя
     * @return сущность пользователя
     * @throws RuntimeException если пользователь не найден
     */
    public UserEntity getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }
} 