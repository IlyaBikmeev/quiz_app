package ru.bikmeev.quizz.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import ru.bikmeev.quizz.config.JwtService;
import ru.bikmeev.quizz.service.UserDetailsServiceImpl;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            // Логируем полезную информацию для отладки
            String userAgent = request.getHeader("User-Agent");
            String requestURI = request.getRequestURI();
            
            // Получаем токен из разных источников (заголовок, куки, параметр)
            String jwt = extractJwtFromRequest(request);
            
            if (StringUtils.hasText(jwt)) {
                log.debug("JWT токен найден для запроса: {} (User-Agent: {})", requestURI, userAgent);
                
                // Проверяем формат и валидность токена перед проверкой пользователя
                if (!jwtService.isTokenFormatValid(jwt)) {
                    log.warn("Недействительный формат токена для запроса: {} (User-Agent: {})", requestURI, userAgent);
                    // Если токен имеет неверный формат, очищаем куки
                    clearAuthCookie(response);
                    filterChain.doFilter(request, response);
                    return;
                }
                
                String userEmail = jwtService.extractUsername(jwt);
                log.debug("Извлечен email из токена: {} для запроса: {}", userEmail, requestURI);
                
                if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // Проверяем существование пользователя
                    try {
                        UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                        if (jwtService.isTokenValid(jwt, userDetails)) {
                            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );
                            authToken.setDetails(
                                    new WebAuthenticationDetailsSource().buildDetails(request)
                            );
                            SecurityContextHolder.getContext().setAuthentication(authToken);
                            log.debug("Успешная аутентификация пользователя: {} для запроса: {}", userEmail, requestURI);
                            
                            // Обновляем куки для поддержания сессии
                            updateAuthCookie(response, jwt);
                        } else {
                            log.warn("Токен недействителен для пользователя: {} (срок действия или подпись)", userEmail);
                            clearAuthCookie(response);
                        }
                    } catch (Exception e) {
                        log.warn("Пользователь с email {} не найден или произошла ошибка при загрузке: {} (User-Agent: {})", 
                                userEmail, e.getMessage(), userAgent);
                        // Очищаем куки, чтобы предотвратить повторные запросы с тем же токеном
                        clearAuthCookie(response);
                    }
                }
            } else {
                log.debug("JWT токен не найден для запроса: {} (User-Agent: {})", requestURI, userAgent);
            }
        } catch (Exception e) {
            log.error("Не удалось установить аутентификацию пользователя", e);
            // Очищаем куки для предотвращения повторных ошибок
            clearAuthCookie(response);
        }
        
        filterChain.doFilter(request, response);
    }
    
    /**
     * Обновляет куки с токеном аутентификации
     */
    private void updateAuthCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("authToken", token);
        cookie.setMaxAge(86400); // 1 день
        cookie.setPath("/");
        cookie.setHttpOnly(true); // Только для HTTP запросов (не доступен для JavaScript)
        cookie.setSecure(false); // Для dev; установите true в production для HTTPS
        response.addCookie(cookie);
    }
    
    /**
     * Очищает куки с токеном аутентификации
     */
    private void clearAuthCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("authToken", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        response.addCookie(cookie);
    }
    
    /**
     * Извлекает JWT токен из запроса, проверяя различные источники:
     * 1. Заголовок Authorization
     * 2. Куки authToken
     * 3. Параметр запроса token
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        // 1. Из заголовка Authorization
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        
        // 2. Из куки
        if (request.getCookies() != null) {
            Optional<Cookie> jwtCookie = Arrays.stream(request.getCookies())
                    .filter(cookie -> "authToken".equals(cookie.getName()))
                    .findFirst();
            
            if (jwtCookie.isPresent()) {
                return jwtCookie.get().getValue();
            }
        }
        
        // 3. Из параметра запроса
        String tokenParam = request.getParameter("token");
        if (StringUtils.hasText(tokenParam)) {
            return tokenParam;
        }
        
        return null;
    }
} 