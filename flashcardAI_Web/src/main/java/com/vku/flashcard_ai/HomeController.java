package com.vku.flashcard_ai;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "flashcard";
    }

    @GetMapping("/login")
    public String loginPage() {
        return "login"; // Trỏ tới file login.html trong templates
    }
}