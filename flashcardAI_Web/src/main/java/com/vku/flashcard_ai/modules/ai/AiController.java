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
            String chatId = request.get("chatId");
            String username = (principal != null) ? principal.getName() : "anonymous";

            if (chatId == null || chatId.trim().isEmpty() || chatId.endsWith("-origin")) {
                AiChatHistory newSession = chatHistoryService.createNewChatSession(username, "Đoạn chat mới", null, "GENERAL");
                chatId = newSession.getChatId();
            }

            String historyMessagesJson = chatHistoryService.getMessagesJsonByChatId(chatId);

            String aiReply = "";
            if ("ai-personal".equals(modelType)) {
                aiReply = aiService.callCustomMachineLearningModel(message);
            } else {
                aiReply = aiService.callAiModelWithHistory(message, historyMessagesJson);
            }

            // TRUYỀN ĐỦ 4 THAM SỐ CHO CẢ USER LẪN AI
            chatHistoryService.saveMessageToSession(chatId, "user", message, null);
            chatHistoryService.saveMessageToSession(chatId, "ai", aiReply, modelType);

            return ResponseEntity.ok(Map.of("reply", aiReply, "chatId", chatId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("reply", "Lỗi xử lý AI: " + e.getMessage()));
        }
    }

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
            String chatType = request.getOrDefault("chatType", "GENERAL");

            AiChatHistory session = chatHistoryService.createNewChatSession(principal.getName(), title, topicId, chatType);
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/chat/rename")
    public ResponseEntity<String> renameChatSession(@RequestBody Map<String, String> request) {
        try {
            String chatId = request.get("chatId");
            String newTitle = request.get("title");
            chatHistoryService.renameChatSession(chatId, newTitle);
            return ResponseEntity.ok("Success");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error");
        }
    }

    @DeleteMapping("/chat/{chatId}")
    public ResponseEntity<String> deleteChatSession(@PathVariable String chatId) {
        try {
            chatHistoryService.deleteChatSession(chatId);
            return ResponseEntity.ok("Success");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error");
        }
    }
}