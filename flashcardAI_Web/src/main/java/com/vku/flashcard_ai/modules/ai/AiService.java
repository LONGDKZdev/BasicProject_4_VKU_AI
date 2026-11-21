package com.vku.flashcard_ai.modules.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vku.flashcard_ai.modules.ai.engine.PersonalAiEngine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Random;

@Service
public class AiService {

    @Value("${ai.api.keys}")
    private List<String> apiKeys;

    private final Random random = new Random();
    private final ObjectMapper objectMapper;
    private final PersonalAiEngine personalAiEngine;

    public AiService(ObjectMapper objectMapper, PersonalAiEngine personalAiEngine) {
        this.objectMapper = objectMapper;
        this.personalAiEngine = personalAiEngine;
    }

    public String getCurrentApiKey() {
        if (apiKeys == null || apiKeys.isEmpty() || apiKeys.get(0).contains("Placeholder")) {
            return "DEFAULT_KEY";
        }
        int index = random.nextInt(apiKeys.size());
        return apiKeys.get(index);
    }

    public String generatePrompt(String topicName, int count) {
        return String.format(
            "Bạn hãy tạo %d cặp thẻ flashcard cho chủ đề: \"%s\".\n" +
            "Mỗi thẻ phải có cấu trúc dữ liệu JSON:\n" +
            "{\n" +
            "  \"englishVocabulary\": \"Từ vựng tiếng Anh\",\n" +
            "  \"vietnameseVocabulary\": \"Từ vựng tiếng Việt\",\n" +
            "  \"example\": \"Câu ví dụ tiếng Anh. Dịch: Câu dịch tiếng Việt\",\n" +
            "  \"pronunciation\": \"Phiên âm quốc tế IPA\",\n" +
            "  \"wordPos\": \"Loại từ chính (n), (v), (adj), (adv)\"\n" +
            "}\n\n" +
            "YÊU CẦU BẮT BUỘC:\n" +
            "1. Chỉ trả về CÁC OBJECT NGOẶC NHỌN {...} ngăn cách bằng dấu phẩy. TUYỆT ĐỐI KHÔNG bọc mảng ngoặc vuông [...] ở ngoài cùng.\n" +
            "2. Tuyệt đối KHÔNG viết thêm bất kỳ lời giải thích hay ký tự Markdown nào ngoài các khối JSON.",
            count, topicName
        );
    }

    public String callAiModel(String prompt) {
        return callAiModelWithHistory(prompt, "[]");
    }

    public String callAiModelWithHistory(String prompt, String messagesJson) {
        String activeKey = getCurrentApiKey();
        if (activeKey.equals("DEFAULT_KEY")) {
            return "{\"englishVocabulary\": \"Example\", \"vietnameseVocabulary\": \"Ví dụ (Chưa cấu hình API Key)\", \"example\": \"This is a test. Dịch: Đây là bài kiểm tra.\", \"pronunciation\": \"/ɪɡˈzæmpəl/\", \"wordPos\": \"(n)\"}";
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", activeKey);

            ObjectNode rootPayload = objectMapper.createObjectNode();
            ArrayNode contentsArray = rootPayload.putArray("contents");

            if (messagesJson != null && !messagesJson.trim().isEmpty() && !messagesJson.trim().equals("[]")) {
                try {
                    JsonNode historyNode = objectMapper.readTree(messagesJson);
                    if (historyNode.isArray() && historyNode.size() > 0) {
                        int total = historyNode.size();
                        int startIdx = Math.max(0, total - 8);

                        for (int i = startIdx; i < total; i++) {
                            JsonNode item = historyNode.get(i);
                            String sender = item.path("sender").asText("user");
                            String contentText = item.path("content").asText("");
                            if (contentText.isEmpty()) continue;

                            String role = "ai".equalsIgnoreCase(sender) ? "model" : "user";
                            ObjectNode msgObj = contentsArray.addObject();
                            msgObj.put("role", role);
                            ArrayNode parts = msgObj.putArray("parts");
                            parts.addObject().put("text", contentText);
                        }
                    }
                } catch (Exception parseEx) {
                    System.err.println("⚠️ Lỗi đọc lịch sử chat JSON: " + parseEx.getMessage());
                }
            }

            ObjectNode currentUserMsg = contentsArray.addObject();
            currentUserMsg.put("role", "user");
            currentUserMsg.putArray("parts").addObject().put("text", prompt);

            String requestBody = objectMapper.writeValueAsString(rootPayload);

            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return extractTextFromGeminiResponse(response.getBody());
            }
        } catch (org.springframework.web.client.HttpServerErrorException.ServiceUnavailable e) {
            System.err.println("Gemini API 503: Máy chủ AI đang quá tải tạm thời.");
            return "Máy chủ AI hiện đang bận do lượng truy cập cao. Vui lòng bấm gửi lại sau vài giây!";
        } catch (Exception e) {
            e.printStackTrace();
            return "Lỗi khi kết nối với AI: " + e.getMessage();
        }

        return "{}";
    }

    public String callCustomMachineLearningModel(String prompt) {
        return personalAiEngine.processRequest(prompt, "anonymous", "[]", "");
    }

    public String callCustomMachineLearningModel(String prompt, String username, String historyMessagesJson, String sessionTitle) {
        return personalAiEngine.processRequest(prompt, username, historyMessagesJson, sessionTitle);
    }

    private String extractTextFromGeminiResponse(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode textNode = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            if (!textNode.isMissingNode()) {
                String extracted = textNode.asText();
                return extracted.replace("```json", "").replace("```", "").trim();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return json;
    }
}