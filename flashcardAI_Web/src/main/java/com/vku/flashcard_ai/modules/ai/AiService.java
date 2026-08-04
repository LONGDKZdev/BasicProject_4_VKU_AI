package com.vku.flashcard_ai.modules.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Random;

@Service
public class AiService {

    @Value("${ai.api.keys}")
    private List<String> apiKeys;

    private final Random random = new Random();

    // Lấy ngẫu nhiên hoặc đổi key mỗi lần gọi để tránh giới hạn
    public String getCurrentApiKey() {
        if (apiKeys == null || apiKeys.isEmpty()) {
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

    public String callAiModel(String prompt) {
        String activeKey = getCurrentApiKey();
        System.out.println("🔑 Đang sử dụng API Key: " + activeKey);
        
        return "[{\"englishVocabulary\": \"Example\", \"vietnameseVocabulary\": \"Ví dụ\", \"example\": \"This is an example. Dịch: Đây là một ví dụ.\", \"pronunciation\": \"/ɪɡˈzæmpəl/\", \"wordPos\": \"(n)\"}]";
    }
}