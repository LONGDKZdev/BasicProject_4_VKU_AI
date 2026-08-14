package com.vku.flashcard_ai.modules.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "*")
public class UserSettingsController {

    private final AuthService authService;

    public UserSettingsController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/profile")
    public ResponseEntity<UserAccount> getProfile(Principal principal) {
        try {
            if (principal == null) return ResponseEntity.status(401).build();
            UserAccount account = authService.getUserProfile(principal.getName());
            return ResponseEntity.ok(account);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<String> updateProfile(@RequestBody Map<String, String> body, Principal principal) {
        try {
            if (principal == null) return ResponseEntity.status(401).body("Chưa đăng nhập");
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
            if (principal == null) return ResponseEntity.status(401).body("Chưa đăng nhập");
            if (dto.getNewPassword() == null || dto.getNewPassword().length() < 6) {
                return ResponseEntity.badRequest().body("Mật khẩu mới phải có ít nhất 6 ký tự!");
            }

            authService.changePassword(principal.getName(), dto.getCurrentPassword(), dto.getNewPassword());
            return ResponseEntity.ok("Đổi mật khẩu thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}