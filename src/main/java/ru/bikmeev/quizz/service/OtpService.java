package ru.bikmeev.quizz.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import ru.bikmeev.quizz.config.CacheConfig;

import java.security.SecureRandom;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final CacheManager cacheManager;
    private final SecureRandom random = new SecureRandom();

    /**
     * Генерирует и сохраняет новый OTP для указанного email
     */
    public String generateOtp(String email) {
        String otp = generateRandomOtp();
        Cache otpCache = cacheManager.getCache(CacheConfig.OTP_CACHE);
        if (otpCache != null) {
            otpCache.put(email, otp);
        }
        return otp;
    }

    /**
     * Проверяет правильность OTP для указанного email
     */
    public boolean verifyOtp(String email, String otp) {
        Cache otpCache = cacheManager.getCache(CacheConfig.OTP_CACHE);
        if (otpCache != null) {
            return Optional.ofNullable(otpCache.get(email))
                    .map(Cache.ValueWrapper::get)
                    .map(cachedOtp -> cachedOtp.toString().equals(otp))
                    .orElse(false);
        }
        return false;
    }

    /**
     * Удаляет OTP для указанного email
     */
    public void clearOtp(String email) {
        Cache otpCache = cacheManager.getCache(CacheConfig.OTP_CACHE);
        if (otpCache != null) {
            otpCache.evict(email);
        }
    }

    /**
     * Генерирует случайный 6-значный OTP код
     */
    private String generateRandomOtp() {
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
} 