package ru.bikmeev.quizz.config.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-ID";

    private static final String REQUEST_ID_MDC_KEY = "requestId";
    private static final String USER_EMAIL_MDC_KEY = "userEmail";
    private static final Pattern VALID_REQUEST_ID = Pattern.compile("[A-Za-z0-9._-]{1,128}");

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestId = resolveRequestId(request.getHeader(REQUEST_ID_HEADER));
        String userEmail = resolveUserEmail();
        long startedAt = System.nanoTime();
        Throwable failure = null;

        MDC.put(REQUEST_ID_MDC_KEY, requestId);
        if (userEmail != null) {
            MDC.put(USER_EMAIL_MDC_KEY, userEmail);
        }
        response.setHeader(REQUEST_ID_HEADER, requestId);

        try {
            filterChain.doFilter(request, response);
        } catch (IOException | ServletException | RuntimeException | Error exception) {
            failure = exception;
            throw exception;
        } finally {
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;
            int status = failure == null ? response.getStatus() : Math.max(500, response.getStatus());

            logRequest(request, status, durationMs, failure);
            MDC.remove(USER_EMAIL_MDC_KEY);
            MDC.remove(REQUEST_ID_MDC_KEY);
        }
    }

    private void logRequest(HttpServletRequest request, int status, long durationMs, Throwable failure) {
        if (failure != null) {
            log.error("HTTP request failed method={} path={} status={} durationMs={}",
                    request.getMethod(), request.getRequestURI(), status, durationMs, failure);
        } else if (status >= 400) {
            log.warn("HTTP request completed method={} path={} status={} durationMs={}",
                    request.getMethod(), request.getRequestURI(), status, durationMs);
        } else {
            log.info("HTTP request completed method={} path={} status={} durationMs={}",
                    request.getMethod(), request.getRequestURI(), status, durationMs);
        }
    }

    private String resolveRequestId(String requestId) {
        if (requestId != null && VALID_REQUEST_ID.matcher(requestId).matches()) {
            return requestId;
        }
        return UUID.randomUUID().toString();
    }

    private String resolveUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        String email = authentication.getName();
        if (email == null || "anonymousUser".equals(email)) {
            return null;
        }

        return email.replaceAll("[\\r\\n\\t]", "_");
    }
}
