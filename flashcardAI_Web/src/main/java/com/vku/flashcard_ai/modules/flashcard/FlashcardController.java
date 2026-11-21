package com.vku.flashcard_ai.modules.flashcard;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/flashcards")
@CrossOrigin(origins = "*")
public class FlashcardController {

    private final FlashcardService flashcardService;

    public FlashcardController(FlashcardService flashcardService) {
        this.flashcardService = flashcardService;
    }

    @GetMapping("/{topicId}")
    public ResponseEntity getFlashcardsByTopic(@PathVariable String topicId, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).build();
            }
            List<Flashcard> cards = flashcardService.getFlashcardsByTopicId(topicId);
            return ResponseEntity.ok(cards);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{topicId}/{englishWord}")
    public ResponseEntity deleteSingleCard(
            @PathVariable String topicId,
            @PathVariable String englishWord,
            Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }
            boolean deleted = flashcardService.deleteSingleFlashcard(topicId, englishWord);
            if (deleted) {
                return ResponseEntity.ok("Đã xóa thẻ từ vựng: " + englishWord);
            }
            return ResponseEntity.badRequest().body("Không tìm thấy từ vựng cần xóa!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi: " + e.getMessage());
        }
    }
}