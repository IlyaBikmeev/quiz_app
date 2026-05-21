package ru.bikmeev.quizz.config.properties;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
@NoArgsConstructor
@AllArgsConstructor
@Getter
public class JwtProperties {
    private String secretKey;
    private long jwtExpiration;
}
