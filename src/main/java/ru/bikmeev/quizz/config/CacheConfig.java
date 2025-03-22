package ru.bikmeev.quizz.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    @Value("${otp.cache.expire-after-write:300}")
    private int otpExpireAfterWriteSeconds;

    /**
     * Название кеша для хранения OTP
     */
    public static final String OTP_CACHE = "otpCache";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCacheNames(Arrays.asList(OTP_CACHE));
        cacheManager.setCaffeine(otpCacheBuilder());
        return cacheManager;
    }

    private Caffeine<Object, Object> otpCacheBuilder() {
        return Caffeine.newBuilder()
                .initialCapacity(100)
                .maximumSize(1000)
                .expireAfterWrite(otpExpireAfterWriteSeconds, TimeUnit.SECONDS)
                .recordStats();
    }
} 