package com.vku.flashcard_ai.modules.ai;

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

    // 1. Phương thức gọi Gemini mặc định
    public String callAiModel(String prompt) {
        return callAiModelWithHistory(prompt, "[]");
    }

    // 2. Gọi Gemini API kèm theo Memory lịch sử trò chuyện bằng Java thuần
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

            StringBuilder contentsJson = new StringBuilder("[");

            // Xử lý trích xuất mảng tin nhắn bằng chuỗi thuần Java
            if (messagesJson != null && !messagesJson.equals("[]") && !messagesJson.trim().isEmpty()) {
                try {
                    String[] items = messagesJson.substring(1, messagesJson.length() - 1).split("(?<=\\}),\\s*(?=\\{)");
                    int startIdx = Math.max(0, items.length - 8); // Lấy tối đa 8 câu gần nhất

                    for (int i = startIdx; i < items.length; i++) {
                        String item = items[i].trim();
                        if (item.isEmpty()) continue;

                        String sender = "user";
                        if (item.contains("\"sender\":\"ai\"") || item.contains("\"sender\": \"ai\"")) {
                            sender = "model";
                        }

                        int contentIndex = item.indexOf("\"content\":");
                        if (contentIndex != -1) {
                            int startQuote = item.indexOf("\"", contentIndex + 10);
                            if (startQuote != -1) {
                                int endQuote = startQuote + 1;
                                boolean escaped = false;
                                while (endQuote < item.length()) {
                                    char c = item.charAt(endQuote);
                                    if (c == '\\' && !escaped) {
                                        escaped = true;
                                    } else if (c == '"' && !escaped) {
                                        break;
                                    } else {
                                        escaped = false;
                                    }
                                    endQuote++;
                                }

                                if (endQuote < item.length()) {
                                    String contentText = item.substring(startQuote + 1, endQuote);
                                    contentsJson.append("{\"role\":\"").append(sender)
                                                .append("\",\"parts\":[{\"text\":\"").append(contentText).append("\"}]},");
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            contentsJson.append("{\"role\":\"user\",\"parts\":[{\"text\":" + escapeJson(prompt) + "}]}]");

            String requestBody = "{\"contents\":" + contentsJson.toString() + "}";

            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return extractTextFromGeminiResponse(response.getBody());
            }
        } catch (org.springframework.web.client.HttpServerErrorException.ServiceUnavailable e) {
            System.err.println(" Gemini API 503: Máy chủ AI đang quá tải tạm thời.");
            return " Máy chủ AI hiện đang bận do lượng truy cập cao. Vui lòng bấm gửi lại sau vài giây!";
        } catch (Exception e) {
            e.printStackTrace();
            return " Lỗi khi kết nối với AI: " + e.getMessage();
        }

        

        return "{}";
    }

    public String callCustomMachineLearningModel(String prompt) {
        return "🧠 [AI Personal Custom ML]: Đã tiếp nhận yêu cầu và xử lý thành công qua thuật toán tự thiết kế!";
    }

    private String escapeJson(String text) {
        return "\"" + text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "") + "\"";
    }

    private String extractTextFromGeminiResponse(String json) {
        try {
            int textIndex = json.indexOf("\"text\": \"");
            if (textIndex != -1) {
                int startIndex = textIndex + 9;
                int endIndex = startIndex;
                boolean escaped = false;
                
                while (endIndex < json.length()) {
                    char c = json.charAt(endIndex);
                    if (c == '\\' && !escaped) {
                        escaped = true;
                    } else if (c == '"' && !escaped) {
                        break;
                    } else {
                        escaped = false;
                    }
                    endIndex++;
                }
                
                String extracted = json.substring(startIndex, endIndex);
                extracted = extracted.replace("\\n", "\n").replace("\\\"", "\"").replace("\\\\", "\\");
                extracted = extracted.replaceAll("```json", "").replaceAll("```", "").trim();
                return extracted;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return json;
    }
}