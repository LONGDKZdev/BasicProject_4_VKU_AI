package com.vku.flashcard_ai.core.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:vohuylong12393@gmail.com}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendResetPasswordEmail(String toEmail, String resetLink) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject("🔒 Yêu cầu đặt lại mật khẩu - StudySpace");

        String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eae2d8; border-radius: 12px; background-color: #fcf8f2;'>"
                + "<div style='text-align: center; margin-bottom: 20px;'>"
                + "<h2 style='color: #0d6efd; margin: 0;'>StudySpace</h2>"
                + "<p style='color: #64748b; font-size: 14px;'>Nền tảng học từ vựng thông minh</p>"
                + "</div>"
                + "<div style='background-color: #ffffff; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);'>"
                + "<h3 style='color: #333333;'>Xin chào!</h3>"
                + "<p style='color: #555555; line-height: 1.6;'>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email này.</p>"
                + "<div style='text-align: center; margin: 30px 0;'>"
                + "<a href='" + resetLink + "' style='background-color: #0d6efd; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 24px; font-weight: bold; display: inline-block;'>Đặt lại mật khẩu</a>"
                + "</div>"
                + "<p style='color: #888888; font-size: 13px;'>Nếu bạn không thực hiện yêu cầu này, hãy yên tâm bỏ qua email này.</p>"
                + "</div>"
                + "<div style='text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;'>"
                + "<p>© 2026 StudySpace. All rights reserved.</p>"
                + "</div>"
                + "</div>";

        helper.setText(htmlContent, true);
        mailSender.send(message);
    }
}