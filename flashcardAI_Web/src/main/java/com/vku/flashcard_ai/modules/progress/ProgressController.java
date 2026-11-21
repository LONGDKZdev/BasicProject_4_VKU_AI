package com.vku.flashcard_ai.modules.progress;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@CrossOrigin(origins = "*")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping("/{topicId}")
    public ResponseEntity<StudyProgress> getTopicProgress(@PathVariable String topicId, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).build();
            }
            StudyProgress progress = progressService.getProgress(principal.getName(), topicId);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/complete")
    public ResponseEntity<StudyProgress> completeTestRound(@RequestBody Map<String, Object> body, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).build();
            }
            String topicId = String.valueOf(body.get("topicId"));
            int round = Integer.parseInt(String.valueOf(body.get("round")));

            StudyProgress updated = progressService.completeRound(principal.getName(), topicId, round);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{topicId}")
    public ResponseEntity<String> resetTopicProgress(@PathVariable String topicId, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).build();
            }
            progressService.resetProgress(principal.getName(), topicId);
            return ResponseEntity.ok("Đã đặt lại tiến độ ôn tập!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi: " + e.getMessage());
        }
    }
}