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
            "englishVocabulary: Từ vựng tiếng Anh\n" +
            "vietnameseVocabulary: Từ vựng tiếng Việt\n" +
            "example: Câu ví dụ chứa từ vựng bằng tiếng Anh và câu dịch tiếng Việt\n" +
            "pronunciation: Phiên âm quốc tế IPA (Ví dụ: /ˈbjuːtɪfl/)\n" +
            "wordPos: Loại từ chính của từ vựng đó (Ví dụ: (n), (v), (adj), (adv))\n\n" +
            "YÊU CẦU BẮT BUỘC:\n" +
            "1. Trả về DỮ LIỆU JSON THUẦN (dạng mảng [...]). Tuyệt đối KHÔNG viết thêm lời giải thích nào ngoài khối JSON.\n" +
            "2. ĐA DẠNG LOẠI TỪ: Phân bổ đồng đều giữa (n), (v), (adj), (adv).",
            count, topicName
        );
    }

    // 1. Xử lý gọi Google Gemini API thực tế qua Key
    public String callAiModel(String prompt) {
        String activeKey = getCurrentApiKey();
        if (activeKey.equals("DEFAULT_KEY")) {
            return "[{\"englishVocabulary\": \"Example\", \"vietnameseVocabulary\": \"Ví dụ (Chưa cấu hình API Key)\", \"example\": \"This is a test. Dịch: Đây là bài kiểm tra.\", \"pronunciation\": \"/ɪɡˈzæmpəl/\", \"wordPos\": \"(n)\"}]";
        }

        try {
            // Sử dụng model mới và endpoint chuẩn
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";
            
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Đưa API Key vào Header dưới dạng x-goog-api-key để tương thích hoàn toàn với key định dạng AQ. mới
            headers.set("x-goog-api-key", activeKey);

            String requestBody = "{\"contents\":[{\"parts\":[{\"text\":" + escapeJson(prompt) + "}]}]}";

            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return extractTextFromGeminiResponse(response.getBody());
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "Lỗi khi gọi Gemini API: " + e.getMessage();
        }

        return "[]";
    }

    // 2. Thêm phương thức cho AI Personal (Custom ML / Logic tự thiết kế)
    public String callCustomMachineLearningModel(String prompt) {
        // Nơi bạn tự viết thuật toán xử lý riêng, phân tích cú pháp hoặc gọi mô hình nội bộ
        return "🧠 [AI Personal Custom ML]: Đã tiếp nhận yêu cầu và xử lý thành công qua thuật toán tự thiết kế!";
    }

    private String escapeJson(String text) {
        return "\"" + text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "") + "\"";
    }

    private String extractTextFromGeminiResponse(String json) {
        try {
            // Sử dụng tìm kiếm thông minh thay vì cắt cứng chuỗi kết thúc
            int textIndex = json.indexOf("\"text\": \"");
            if (textIndex != -1) {
                int startIndex = textIndex + 9;
                int endIndex = startIndex;
                boolean escaped = false;
                
                // Vòng lặp tìm chính xác ký tự kết thúc chuỗi text (bỏ qua các dấu ngoặc kép được escape)
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