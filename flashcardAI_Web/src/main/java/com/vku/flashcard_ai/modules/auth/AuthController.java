package com.vku.flashcard_ai.modules.auth;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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

    @PostMapping("/api/auth/reset-password")
    public ResponseEntity<String> handleResetPassword(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String newPassword = body.get("newPassword");

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
}