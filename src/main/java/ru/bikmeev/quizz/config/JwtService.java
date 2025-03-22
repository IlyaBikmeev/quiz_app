package ru.bikmeev.quizz.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Slf4j
@Service
public class JwtService {

    @Value("${jwt.secret:secretKeyDefaultValueThatShouldBeChangedInProdEnvironment}")
    private String secretKey;

    @Value("${jwt.expiration:86400000}") // 24 часа по умолчанию
    private long jwtExpiration;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSigningKey() {
        byte[] keyBytes = secretKey.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private boolean isTokenExpired(String token) {
        try {
            Date expiration = extractExpiration(token);
            Date now = new Date();
            boolean isExpired = expiration.before(now);
            
            if (isExpired) {
                log.debug("Токен истек: действителен до {}, текущее время {}", expiration, now);
            }
            
            return isExpired;
        } catch (Exception e) {
            log.warn("Ошибка при проверке срока действия токена: {}", e.getMessage());
            return true; // Если не удалось проверить, считаем токен истекшим
        }
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            boolean usernameMatches = username.equals(userDetails.getUsername());
            boolean notExpired = !isTokenExpired(token);
            
            if (!usernameMatches) {
                log.debug("Имя пользователя в токене {} не соответствует пользователю {}", 
                        username, userDetails.getUsername());
            }
            
            return usernameMatches && notExpired;
        } catch (Exception e) {
            log.warn("Ошибка при проверке токена: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Проверяет, имеет ли токен правильный формат JWT
     * @param token токен для проверки
     * @return true, если формат верный
     */
    public boolean isTokenFormatValid(String token) {
        try {
            // Пытаемся распарсить токен, чтобы проверить его формат
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            log.debug("Токен имеет неверный формат: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Получает информацию о сроке действия токена
     * @param token JWT токен
     * @return информация о сроке действия в читаемом формате
     */
    public String getTokenExpirationInfo(String token) {
        try {
            Date expiration = extractExpiration(token);
            Date now = new Date();
            long diff = expiration.getTime() - now.getTime();
            
            if (diff <= 0) {
                return "Токен истек";
            }
            
            long diffHours = diff / (60 * 60 * 1000);
            
            if (diffHours > 24) {
                return String.format("Действителен еще %d дней", diffHours / 24);
            } else {
                return String.format("Действителен еще %d часов", diffHours);
            }
        } catch (Exception e) {
            return "Невозможно определить срок действия";
        }
    }
} 