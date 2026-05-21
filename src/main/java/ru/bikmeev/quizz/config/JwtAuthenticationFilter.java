package ru.bikmeev.quizz.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
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
import ru.bikmeev.quizz.service.UserDetailsServiceImpl;

import java.io.IOException;

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
            String userAgent = request.getHeader("User-Agent");
            String requestURI = request.getRequestURI();

            String jwt = extractJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {
                log.debug("JWT токен найден для запроса: {} (User-Agent: {})", requestURI, userAgent);

                if (!jwtService.isTokenFormatValid(jwt)) {
                    log.warn("Недействительный формат токена для запроса: {} (User-Agent: {})", requestURI, userAgent);

                    filterChain.doFilter(request, response);
                    return;
                }

                String userEmail = jwtService.extractUsername(jwt);
                log.debug("Извлечен email из токена: {} для запроса: {}", userEmail, requestURI);

                if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
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

                        } else {
                            log.warn("Токен недействителен для пользователя: {} (срок действия или подпись)", userEmail);
                        }
                    } catch (Exception e) {
                        log.warn("Пользователь с email {} не найден или произошла ошибка при загрузке: {} (User-Agent: {})",
                                userEmail, e.getMessage(), userAgent);
                    }
                }
            } else {
                log.debug("JWT токен не найден для запроса: {} (User-Agent: {})", requestURI, userAgent);
            }
        } catch (Exception e) {
            log.error("Не удалось установить аутентификацию пользователя", e);
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        return null;
    }
} 