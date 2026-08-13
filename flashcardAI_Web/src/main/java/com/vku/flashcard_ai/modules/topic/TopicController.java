package com.vku.flashcard_ai.modules.topic;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/topics")
@CrossOrigin(origins = "*")
public class TopicController {

    private final TopicService topicService;

    public TopicController(TopicService topicService) {
        this.topicService = topicService;
    }

    @GetMapping("/current-user")
    public ResponseEntity<String> getCurrentUser(Principal principal) {
        if (principal != null) {
            return ResponseEntity.ok(principal.getName());
        }
        return ResponseEntity.status(401).body("Unauthorized");
    }

    @GetMapping
    public ResponseEntity<List<Topic>> getTopics(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).build();
            }
            String realUserId = topicService.getUserIdByUsername(principal.getName());
            List<Topic> topics = topicService.getTopicsByUser(realUserId);
            return ResponseEntity.ok(topics);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<String> saveTopic(@RequestBody Topic topic, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }
            
            // Gán cả userId (mã bảo mật) và username (tên hiển thị)
            String currentUsername = principal.getName();
            String realUserId = topicService.getUserIdByUsername(currentUsername);
            
            topic.setUserId(realUserId);
            topic.setUsername(currentUsername); // Lưu trực tiếp username vào topic

            String result = topicService.saveTopic(topic);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTopic(@PathVariable String id, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }
            String result = topicService.deleteTopic(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
    @PostMapping("/append-json")
    public ResponseEntity<String> appendJsonToTopic(@RequestBody Map<String, String> request) {
        try {
            String topicId = request.get("topicId");
            String newJson = request.get("json");

            if (topicId == null || newJson == null) {
                return ResponseEntity.badRequest().body("Thiếu thông tin topicId hoặc json");
            }

            // Gọi service và nhận câu thông báo kết quả chi tiết
            String resultMessage = topicService.appendJsonToTopic(topicId, newJson);
            return ResponseEntity.ok(resultMessage);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi: " + e.getMessage());
        }
    }
}