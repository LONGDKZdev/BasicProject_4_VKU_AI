package com.vku.flashcard_ai; // Hoặc package tương ứng của bạn

import org.springframework.stereotype.Controller;
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
        return "study_flashcard"; // Trỏ tới templates/study_flashcard.html
    }
    
    // Trang Chat AI
    @GetMapping("/chat-ai")
    public String chatAiPage() {
        return "chat-ai";
    }

    // Trang Meet (Phòng họp / Camera / Mic / Socket)
    @GetMapping("/meet")
    public String meetPage() {
        return "meet";
    }

    // Trang Cài đặt tài khoản
    @GetMapping("/settings")
    public String settingsPage() {
        return "settings";
    }
    @GetMapping("/reset-password")
    public String resetPasswordPage(@RequestParam(name = "username", required = false) String username, org.springframework.ui.Model model) {
        model.addAttribute("username", username != null ? username : "");
        return "reset-password";
    }
}