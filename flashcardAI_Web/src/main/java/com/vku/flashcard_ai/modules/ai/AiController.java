package com.vku.flashcard_ai.modules.ai;

import com.vku.flashcard_ai.modules.ai.engine.PersonalAiBrainService;
import com.vku.flashcard_ai.modules.ai.model.AiChatHistory;
import com.vku.flashcard_ai.modules.ai.model.PersonalAiBrain;
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
    private final PersonalAiBrainService brainService;

    public AiController(AiService aiService, ChatHistoryService chatHistoryService, PersonalAiBrainService brainService) {
        this.aiService = aiService;
        this.chatHistoryService = chatHistoryService;
        this.brainService = brainService;
    }

    @GetMapping("/personal-brain")
    public ResponseEntity getPersonalAiBrain(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).build();
            }
            String realUserId = chatHistoryService.getUserIdByUsername(principal.getName());
            PersonalAiBrain brain = brainService.getOrCreateBrain(realUserId);
            return ResponseEntity.ok(brain);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/generate")
    public ResponseEntity generateFlashcards(@RequestBody AiRequestDTO request) {
        try {
            String prompt = aiService.generatePrompt(request.getTopicName(), request.getCount());
            String jsonResult = aiService.callAiModel(prompt);
            return ResponseEntity.ok(jsonResult);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error generating AI content: " + e.getMessage());
        }
    }

    @PostMapping("/chat/send")
    public ResponseEntity sendChatMessage(@RequestBody Map request, Principal principal) {
        try {
            String message = (String) request.get("message");
            String modelType = (String) request.get("modelType");
            String chatId = (String) request.get("chatId");
            String username = (principal != null) ? principal.getName() : "anonymous";

            if (chatId == null || chatId.trim().isEmpty() || chatId.endsWith("-origin")) {
                AiChatHistory newSession = chatHistoryService.createNewChatSession(username, "Đoạn chat mới", null, "GENERAL");
                chatId = newSession.getChatId();
            }

            String historyMessagesJson = chatHistoryService.getMessagesJsonByChatId(chatId);
            String sessionTitle = "";
            try {
                List<AiChatHistory> userHistories = chatHistoryService.getHistoriesByUser(username);
                for (AiChatHistory h : userHistories) {
                    if (chatId.equals(h.getChatId())) {
                        sessionTitle = h.getTitle();
                        break;
                    }
                }
            } catch (Exception ignored) {}

            String aiReply = "";
            if ("ai-personal".equals(modelType)) {
                aiReply = aiService.callCustomMachineLearningModel(message, username, historyMessagesJson, sessionTitle);
            } else {
                aiReply = aiService.callAiModelWithHistory(message, historyMessagesJson);
            }

            chatHistoryService.saveMessageToSession(chatId, "user", message, null);
            chatHistoryService.saveMessageToSession(chatId, "ai", aiReply, modelType);

            return ResponseEntity.ok(Map.of("reply", aiReply, "chatId", chatId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("reply", "Lỗi xử lý AI: " + e.getMessage()));
        }
    }

    @GetMapping("/chat/histories")
    public ResponseEntity getChatHistories(Principal principal) {
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
    public ResponseEntity createChatSession(@RequestBody Map request, Principal principal) {
        try {
            if (principal == null) return ResponseEntity.status(401).build();
            String title = String.valueOf(request.getOrDefault("title", "Đoạn chat mới"));
            String topicId = request.get("topicId") != null ? String.valueOf(request.get("topicId")) : null;
            String chatType = String.valueOf(request.getOrDefault("chatType", "GENERAL"));

            AiChatHistory session = chatHistoryService.createNewChatSession(principal.getName(), title, topicId, chatType);
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/chat/rename")
    public ResponseEntity renameChatSession(@RequestBody Map request) {
        try {
            String chatId = (String) request.get("chatId");
            String newTitle = (String) request.get("title");
            chatHistoryService.renameChatSession(chatId, newTitle);
            return ResponseEntity.ok("Success");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error");
        }
    }

    @DeleteMapping("/chat/{chatId}")
    public ResponseEntity deleteChatSession(@PathVariable String chatId) {
        try {
            chatHistoryService.deleteChatSession(chatId);
            return ResponseEntity.ok("Success");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error");
        }
    }
}