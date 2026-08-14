package com.vku.flashcard_ai.modules.auth;

import com.vku.flashcard_ai.core.mail.EmailService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserSettingsController {

    private final AuthService authService;
    private final EmailService emailService;

    @GetMapping("/profile")
    public ResponseEntity<UserAccount> getProfile(Principal principal) {
        try {
            if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            UserAccount account = authService.getUserProfile(principal.getName());
            return ResponseEntity.ok(account);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<String> updateProfile(@RequestBody Map<String, String> body, Principal principal) {
        try {
            if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập");
            String email = body.get("email");
            String avatarKey = body.get("avatarKey");

            authService.updateProfile(principal.getName(), email, avatarKey);
            return ResponseEntity.ok("Cập nhật thông tin thành công!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi: " + e.getMessage());
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestBody ChangePasswordDTO dto, Principal principal) {
        try {
            if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập");
            if (dto.getNewPassword() == null || dto.getNewPassword().length() < 6) {
                return ResponseEntity.badRequest().body("Mật khẩu mới phải có ít nhất 6 ký tự!");
            }

            authService.changePassword(principal.getName(), dto.getCurrentPassword(), dto.getNewPassword());
            return ResponseEntity.ok("Đổi mật khẩu thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/forgot-password-mail")
    public ResponseEntity<?> sendForgotPasswordEmail(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập!");
        }

        try {
            String username = principal.getName();
            UserAccount user = authService.getUserProfile(username);
            
            if (user == null || user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Tài khoản chưa liên kết Email hợp lệ!");
            }

            String resetLink = "http://localhost:8080/reset-password?username=" + URLEncoder.encode(username, StandardCharsets.UTF_8);

            emailService.sendResetPasswordEmail(user.getEmail(), resetLink);

            return ResponseEntity.ok("Đã gửi email khôi phục mật khẩu thành công!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi khi gửi email: " + e.getMessage());
        }
    }
}