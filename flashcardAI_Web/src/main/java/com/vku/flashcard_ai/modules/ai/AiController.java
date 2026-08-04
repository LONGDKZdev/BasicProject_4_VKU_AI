package com.vku.flashcard_ai.modules.ai;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private AiService aiService;

    @PostMapping("/generate")
    public ResponseEntity<String> generateFlashcards(@RequestBody AiRequestDTO request) {
        try {
            String prompt = aiService.generatePrompt(request.getTopicName(), request.getCount());
            String jsonResult = aiService.callAiModel(prompt);
            return ResponseEntity.ok(jsonResult);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error generating AI content: " + e.getMessage());
        }
    }
}