package com.vku.flashcard_ai.modules.auth;

import com.vku.flashcard_ai.core.mail.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Controller
public class AuthController {

    private final AuthService authService;
    private final EmailService emailService;

    public AuthController(AuthService authService, EmailService emailService) {
        this.authService = authService;
        this.emailService = emailService;
    }

    // Hiển thị trang đăng nhập
    @GetMapping("/login")
    public String loginPage() {
        return "login";
    }

    // Hiển thị trang đăng ký
    @GetMapping("/register")
    public String registerPage() {
        return "register";
    }

    // API đăng nhập dành riêng cho ứng dụng Mobile (React Native / Expo)
    @PostMapping("/api/auth/mobile-login")
    public ResponseEntity handleMobileLogin(@RequestBody Map body) {
        String username = body.get("username") != null ? String.valueOf(body.get("username")).trim() : "";
        String password = body.get("password") != null ? String.valueOf(body.get("password")).trim() : "";

        if (username.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!"));
        }

        UserAccount user = authService.getUserProfile(username);
        if (user == null || user.getPassword() == null || !user.getPassword().equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Tên đăng nhập hoặc mật khẩu không chính xác!"));
        }

        Map userPayload = new HashMap();
        userPayload.put("userId", user.getUserId());
        userPayload.put("username", user.getUsername());
        userPayload.put("email", user.getEmail() != null ? user.getEmail() : "");
        userPayload.put("avatarKey", user.getAvatarKey() != null ? user.getAvatarKey() : "avatar_0");
        userPayload.put("password", user.getPassword());
        userPayload.put("createdAt", user.getCreatedAt());

        return ResponseEntity.ok(userPayload);
    }

    // Xử lý đăng ký nhận dữ liệu từ form HTML (username & password)
    @PostMapping("/register")
    public String handleRegister(
                                @RequestParam("username") String username, 
                                @RequestParam("email") String email,
                                @RequestParam("password") String password, 
                                Model model) {
        try {
            UserAccount user = new UserAccount();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(password);
            
            authService.register(user);
            
            return "redirect:/login?registered";
        } catch (Exception e) {
            model.addAttribute("error", "Đăng ký thất bại: " + e.getMessage());
            return "register";
        }
    }

    // API gửi email khôi phục mật khẩu từ trang Đăng nhập (Không cần đăng nhập trước)
    @PostMapping("/api/auth/forgot-password")
    public ResponseEntity handlePublicForgotPassword(@RequestBody Map body) {
        String username = body.get("username") != null ? String.valueOf(body.get("username")) : null;
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng nhập tên đăng nhập (username)!");
        }

        try {
            UserAccount user = authService.getUserProfile(username.trim());
            if (user == null) {
                return ResponseEntity.badRequest().body("Không tìm thấy tài khoản với tên đăng nhập này!");
            }
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Tài khoản này chưa liên kết địa chỉ Email!");
            }

            String resetLink = "http://localhost:8080/reset-password?username="
                    + URLEncoder.encode(user.getUsername(), StandardCharsets.UTF_8);

            emailService.sendResetPasswordEmail(user.getEmail(), resetLink);
            return ResponseEntity.ok("Đã gửi liên kết đặt lại mật khẩu tới email: " + maskEmail(user.getEmail()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi khi gửi email: " + e.getMessage());
        }
    }

    @PostMapping("/api/auth/reset-password")
    public ResponseEntity handleResetPassword(@RequestBody Map body) {
        String username = body.get("username") != null ? String.valueOf(body.get("username")) : null;
        String newPassword = body.get("newPassword") != null ? String.valueOf(body.get("newPassword")) : null;

        if (username == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body("Dữ liệu không hợp lệ!");
        }

        try {
            authService.resetPasswordDirectly(username, newPassword);
            return ResponseEntity.ok("Đặt lại mật khẩu thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    private String maskEmail(String email) {
        int atIndex = email.indexOf("@");
        if (atIndex <= 2) return email;
        return email.substring(0, 2) + "***" + email.substring(atIndex);
    }
}