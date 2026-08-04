package com.vku.flashcard_ai.modules.topic;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/topics")
@CrossOrigin(origins = "*")
public class TopicController {


    private TopicService topicService;

    @GetMapping
    public ResponseEntity<List<Topic>> getTopics(@RequestParam String userId) {
        try {
            List<Topic> topics = topicService.getTopicsByUser(userId);
            return ResponseEntity.ok(topics);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<String> saveTopic(@RequestBody Topic topic) {
        try {
            String result = topicService.saveTopic(topic);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTopic(@PathVariable String id) {
        try {
            String result = topicService.deleteTopic(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}