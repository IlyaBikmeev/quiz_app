package ru.bikmeev.quizz.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final MailProperties properties;

    public void sendOtpEmail(String to, String otp) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(properties.getUsername());
        helper.setTo(to);
        helper.setSubject("Ваш код для входа в Quizz");

        String emailContent = String.format(
                "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                        "<h2>Код для входа</h2>" +
                        "<p>Используйте следующий код для входа в систему Quizz:</p>" +
                        "<div style='background-color: #f0f0f0; padding: 15px; font-size: 24px; text-align: center; letter-spacing: 5px;'>" +
                        "<strong>%s</strong>" +
                        "</div>" +
                        "<p>Код действителен в течение 5 минут.</p>" +
                        "<p>Если вы не запрашивали этот код, проигнорируйте это сообщение.</p>" +
                        "</div>", otp);

        helper.setText(emailContent, true);
        mailSender.send(message);
    }
} 