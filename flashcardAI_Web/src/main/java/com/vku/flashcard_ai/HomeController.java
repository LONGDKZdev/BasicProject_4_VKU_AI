package com.vku.flashcard_ai;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class HomeController {

    // Trang chủ Flashcard
    @GetMapping("/")
    public String homePage() {
        return "flashcard";
    }

    // Route điều hướng trang học lật thẻ
    @GetMapping("/study-flashcard")
    public String studyFlashcardPage() {
        return "study_flashcard";
    }

    // Route điều hướng trang kiểm tra 4 vòng
    @GetMapping("/test-flashcard")
    public String testFlashcardPage() {
        return "test_flashcard";
    }

    // Trang Chat AI
    @GetMapping("/chat-ai")
    public String chatAiPage() {
        return "chat-ai";
    }

    // Trang store (chứa chủ đề mẫu)
    @GetMapping("/store")
    public String storePage() {
        return "store";
    }

    // Trang Cài đặt tài khoản
    @GetMapping("/settings")
    public String settingsPage() {
        return "settings";
    }

    @GetMapping("/reset-password")
    public String resetPasswordPage(@RequestParam(name = "username", required = false) String username, Model model) {
        model.addAttribute("username", username != null ? username : "");
        return "reset-password";
    }
}