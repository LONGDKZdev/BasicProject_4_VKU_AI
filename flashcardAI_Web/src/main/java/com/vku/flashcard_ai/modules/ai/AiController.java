package com.vku.flashcard_ai.modules.ai;

import com.vku.flashcard_ai.modules.ai.model.AiChatHistory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private final AiService aiService;
    private final ChatHistoryService chatHistoryService;

    // Inject cả AiService và ChatHistoryService vào constructor
    public AiController(AiService aiService, ChatHistoryService chatHistoryService) {
        this.aiService = aiService;
        this.chatHistoryService = chatHistoryService;
    }

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

    @PostMapping("/chat/send")
    public ResponseEntity<Map<String, String>> sendChatMessage(@RequestBody Map<String, String> request, Principal principal) {
        try {
            String message = request.get("message");
            String modelType = request.get("modelType");
            String chatId = request.get("chatId"); // Nhận ID phiên chat hiện tại nếu có

            String aiReply = "";
            if ("ai-personal".equals(modelType)) {
                aiReply = aiService.callCustomMachineLearningModel(message);
            } else {
                aiReply = aiService.callAiModel(message);
            }

            // Lưu hoặc cập nhật tin nhắn vào Database nếu có chatId
            if (chatId != null && !chatId.isEmpty() && principal != null) {
                chatHistoryService.saveMessageToSession(chatId, message, aiReply);
            }

            return ResponseEntity.ok(Map.of("reply", aiReply));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("reply", "Lỗi xử lý AI: " + e.getMessage()));
        }
    }

    // Endpoint lấy danh sách lịch sử chat của user hiện tại
    @GetMapping("/chat/histories")
    public ResponseEntity<List<AiChatHistory>> getChatHistories(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).build();
            }
            List<AiChatHistory> list = chatHistoryService.getHistoriesByUser(principal.getName());
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    @PostMapping("/chat/create")
    public ResponseEntity<AiChatHistory> createChatSession(@RequestBody Map<String, String> request, Principal principal) {
        try {
            if (principal == null) return ResponseEntity.status(401).build();
            String title = request.getOrDefault("title", "Đoạn chat mới");
            String topicId = request.get("topicId");
            
            AiChatHistory session = chatHistoryService.createNewChatSession(principal.getName(), title, topicId);
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}