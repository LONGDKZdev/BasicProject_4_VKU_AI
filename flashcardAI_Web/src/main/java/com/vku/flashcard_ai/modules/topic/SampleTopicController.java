package com.vku.flashcard_ai.modules.topic;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sample-topics")
@CrossOrigin(origins = "*")
public class SampleTopicController {

    private final SampleTopicService sampleTopicService;

    public SampleTopicController(SampleTopicService sampleTopicService) {
        this.sampleTopicService = sampleTopicService;
    }

    // Public API: Lấy toàn bộ chủ đề mẫu hiển thị trên web
    @GetMapping
    public ResponseEntity<List<SampleTopic>> getSampleTopics() {
        try {
            List<SampleTopic> list = sampleTopicService.getAllSampleTopics();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Admin API: Import / Thêm chủ đề mẫu trực tiếp vào Firebase
    @PostMapping("/admin/import")
    public ResponseEntity<String> importSampleTopic(@RequestBody SampleTopic topic) {
        try {
            String result = sampleTopicService.saveSampleTopic(topic);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi: " + e.getMessage());
        }
    }

    // Admin API: Batch import nhiều chủ đề cùng lúc
    @PostMapping("/admin/batch-import")
    public ResponseEntity<String> batchImport(@RequestBody List<SampleTopic> topics) {
        try {
            for (SampleTopic t : topics) {
                sampleTopicService.saveSampleTopic(t);
            }
            return ResponseEntity.ok("Đã import thành công " + topics.size() + " chủ đề mẫu!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi: " + e.getMessage());
        }
    }
}