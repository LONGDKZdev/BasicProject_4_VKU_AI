package com.vku.flashcard_ai.modules.ai.engine;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vku.flashcard_ai.modules.ai.model.PersonalAiBrain;
import com.vku.flashcard_ai.modules.flashcard.Flashcard;
import com.vku.flashcard_ai.modules.progress.ProgressService;
import com.vku.flashcard_ai.modules.progress.StudyProgress;
import com.vku.flashcard_ai.modules.topic.Topic;
import com.vku.flashcard_ai.modules.topic.TopicService;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Model-Based Utility Learning Agent độc lập theo từng tài khoản (Per-User Firestore Brain)
 */
@Component
public class PersonalAiEngine {

    private final NaiveBayesIntentClassifier intentClassifier;
    private final VocabularyKnowledgeBase knowledgeBase;
    private final PersonalAiBrainService brainService;
    private final TopicService topicService;
    private final ProgressService progressService;
    private final ObjectMapper objectMapper;

    public PersonalAiEngine(
            NaiveBayesIntentClassifier intentClassifier,
            VocabularyKnowledgeBase knowledgeBase,
            PersonalAiBrainService brainService,
            TopicService topicService,
            ProgressService progressService,
            ObjectMapper objectMapper) {
        this.intentClassifier = intentClassifier;
        this.knowledgeBase = knowledgeBase;
        this.brainService = brainService;
        this.topicService = topicService;
        this.progressService = progressService;
        this.objectMapper = objectMapper;
    }

    public String processRequest(String userPrompt, String username, String historyMessagesJson, String sessionTitle) {
        String trimmedPrompt = (userPrompt != null) ? userPrompt.trim() : "";
        String realUserId = (username != null && !username.equals("anonymous"))
                ? topicService.getUserIdByUsername(username)
                : "anonymous";

        // 0. Kiểm tra lệnh dạy học trực tiếp cho AI Personal của riêng tài khoản này
        if (trimmedPrompt.toLowerCase().startsWith("dạy ai:") || trimmedPrompt.toLowerCase().startsWith("day ai:")) {
            return handleTeachCustomRule(trimmedPrompt, realUserId);
        }
        if (trimmedPrompt.toLowerCase().startsWith("học từ mới:") || trimmedPrompt.toLowerCase().startsWith("hoc tu moi:")) {
            return handleTeachNewVocabulary(trimmedPrompt, realUserId);
        }

        // 1. Kiểm tra bộ nhớ quy tắc riêng mà user này đã dạy trước đó trên Firestore
        if (!realUserId.equals("anonymous")) {
            brainService.incrementInteraction(realUserId);
            Map<String, String> userRules = brainService.getCustomRules(realUserId);
            String promptLower = trimmedPrompt.toLowerCase();
            for (Map.Entry<String, String> rule : userRules.entrySet()) {
                if (promptLower.equals(rule.getKey()) || promptLower.contains(rule.getKey())) {
                    return "🧠 [Tri thức riêng bạn đã dạy]: " + rule.getValue();
                }
            }
        }

        String lastAiMessage = extractLastAiMessage(historyMessagesJson);
        String activeTopicContext = extractCleanSessionTopic(sessionTitle);

        // 2. Xử lý lựa chọn menu số (1, 2, 3) hoặc số lượng thẻ trong phòng chat chủ đề
        if (trimmedPrompt.matches("^[1-3]$")) {
            return handleNumericMenuChoice(trimmedPrompt, username, realUserId, lastAiMessage, activeTopicContext);
        }

        NaiveBayesIntentClassifier.Intent intent = intentClassifier.predictIntent(trimmedPrompt);

        if (intent == NaiveBayesIntentClassifier.Intent.CONFIRM_OR_FOLLOWUP) {
            return handleContextFollowUp(username, realUserId, lastAiMessage, activeTopicContext);
        }

        switch (intent) {
            case LIST_TOPICS:
                return handleListTopics(username, realUserId);
            case GENERATE_FLASHCARDS:
                return handleGenerateFlashcards(trimmedPrompt, username, realUserId, activeTopicContext);
            case LOOKUP_WORD:
                return handleLookupWord(trimmedPrompt, realUserId);
            case STUDY_RECOMMENDATION:
                return handleStudyRecommendation(username, realUserId);
            case GREETING_OR_HELP:
            default:
                return handleGreetingOrHelp(username, realUserId, activeTopicContext);
        }
    }

    private String handleTeachCustomRule(String prompt, String realUserId) {
        if (realUserId.equals("anonymous")) {
            return "Bạn cần đăng nhập để dạy kiến thức riêng cho AI Personal của mình!";
        }
        String content = prompt.substring(prompt.indexOf(":") + 1).trim();
        String[] parts = content.split("=>");
        if (parts.length < 2 || parts[0].trim().isEmpty() || parts[1].trim().isEmpty()) {
            return "⚠️ Cú pháp dạy AI chưa đúng. Hãy nhập theo mẫu:\nDạy AI: câu hỏi hoặc từ khóa => câu trả lời mong muốn";
        }
        try {
            brainService.teachCustomRule(realUserId, parts[0].trim(), parts[1].trim());
            return String.format("✅ Đã ghi nhớ quy tắc riêng vào bộ não AI của bạn trên Firestore!\n• Khi bạn hỏi: \"%s\"\n• Tôi sẽ trả lời: \"%s\"", parts[0].trim(), parts[1].trim());
        } catch (Exception e) {
            return "❌ Lỗi khi lưu dữ liệu huấn luyện lên Firestore: " + e.getMessage();
        }
    }

    private String handleTeachNewVocabulary(String prompt, String realUserId) {
        if (realUserId.equals("anonymous")) {
            return "Bạn cần đăng nhập để nạp từ vựng vào bộ não AI riêng của mình!";
        }
        String content = prompt.substring(prompt.indexOf(":") + 1).trim();
        String[] parts = content.split("-");
        if (parts.length < 2) {
            return "⚠️ Cú pháp nạp từ chưa đúng. Hãy nhập theo mẫu:\nHọc từ mới: Serendipity - Sự tình cờ may mắn - (n)";
        }
        try {
            Flashcard fc = new Flashcard();
            fc.setEnglishVocabulary(parts[0].trim());
            fc.setVietnameseVocabulary(parts[1].trim());
            fc.setWordPos(parts.length >= 3 ? parts[2].trim() : "(n)");
            fc.setPronunciation("");
            fc.setExample("Example with " + parts[0].trim() + ". Dịch: Ví dụ với từ " + parts[0].trim() + ".");

            List<Flashcard> updated = brainService.getAndSyncUserKnowledge(realUserId, Collections.singletonList(fc));
            return String.format("✅ Đã nạp từ \"%s\" (%s) vào Kho tri thức riêng của bạn trên Firestore (Tổng từ riêng đã học: %d từ)!",
                    fc.getEnglishVocabulary(), fc.getVietnameseVocabulary(), updated.size());
        } catch (Exception e) {
            return "❌ Lỗi khi lưu từ vựng vào AI Brain: " + e.getMessage();
        }
    }

    private List<Flashcard> syncAndLoadPersonalKnowledge(String realUserId) {
        if (realUserId.equals("anonymous")) return Collections.emptyList();
        try {
            List<Topic> userTopics = topicService.getTopicsByUser(realUserId);
            List<Flashcard> allCards = new ArrayList<>();
            for (Topic t : userTopics) {
                allCards.addAll(topicService.parseFlashcardList(t.getDataJson()));
            }
            return brainService.getAndSyncUserKnowledge(realUserId, allCards);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private String handleListTopics(String username, String realUserId) {
        List<String> domains = knowledgeBase.getAvailableDomains();
        List<Flashcard> personalCards = syncAndLoadPersonalKnowledge(realUserId);

        StringBuilder sb = new StringBuilder();
        sb.append("📚 Kho tri thức AI Personal của riêng bạn hiện gồm:\n");
        sb.append("• ").append(domains.size()).append(" miền chủ đề chuẩn (")
          .append(knowledgeBase.getBaseVocabularyCount()).append(" từ nền tảng) + ")
          .append(personalCards.size()).append(" từ vựng cá nhân hóa đã lưu trên Firestore:\n");

        for (int i = 0; i < domains.size(); i++) {
            sb.append("  ").append(i + 1).append(". ").append(domains.get(i)).append("\n");
        }

        if (!realUserId.equals("anonymous")) {
            try {
                List<Topic> userTopics = topicService.getTopicsByUser(realUserId);
                if (userTopics != null && !userTopics.isEmpty()) {
                    sb.append("\n🗂️ Các bộ thẻ trong tài khoản ").append(username).append(": ");
                    List<String> names = new ArrayList<>();
                    for (Topic t : userTopics) {
                        names.add("\"" + t.getName() + "\"");
                    }
                    sb.append(String.join(", ", names)).append(".\n");
                }
            } catch (Exception ignored) {}
        }

        sb.append("\n👉 Bạn muốn tạo từ vựng cho chủ đề nào? Hãy nhắn ví dụ: \"Tạo 5 từ vựng chủ đề Kinh doanh\" hoặc \"Du lịch\" nhé!");
        return sb.toString();
    }

    private String handleNumericMenuChoice(String choice, String username, String realUserId, String lastAiMessage, String activeTopicContext) {
        boolean justSawWelcomeMenu = lastAiMessage.contains("1. Tạo bộ thẻ từ vựng")
                || lastAiMessage.contains("2. Tra cứu từ vựng");

        if (justSawWelcomeMenu) {
            switch (choice) {
                case "1":
                    String suggestedTopic = !activeTopicContext.isEmpty() ? activeTopicContext : "Toán học";
                    return String.format(
                            "Bạn đã chọn chức năng [1 - Tạo bộ thẻ từ vựng JSON].\n" +
                            "Hãy nhập tên chủ đề và số lượng bạn muốn (hoặc gõ \"ok\" để tôi tạo ngay 5 thẻ từ vựng cho chủ đề \"%s\" nhé!).",
                            suggestedTopic
                    );
                case "2":
                    return "Bạn đã chọn chức năng [2 - Tra cứu từ vựng].\n" +
                           "Hãy nhập từ tiếng Anh bạn muốn tra nghĩa, phiên âm IPA và câu ví dụ (ví dụ: \"Derivative\", \"Velocity\", hoặc \"Ubiquitous\").";
                case "3":
                    return handleStudyRecommendation(username, realUserId);
                default:
                    break;
            }
        }

        if (!activeTopicContext.isEmpty()) {
            int count = Integer.parseInt(choice);
            return handleGenerateFlashcards("Tạo " + count + " từ vựng chủ đề \"" + activeTopicContext + "\"", username, realUserId, activeTopicContext);
        }

        return "Tôi thấy bạn vừa nhập số \"" + choice + "\". Nếu bạn muốn tạo " + choice + " thẻ từ vựng, hãy cho tôi biết tên chủ đề nhé (ví dụ: \"Tạo " + choice + " từ vựng chủ đề Toán học\")!";
    }

    private String handleContextFollowUp(String username, String realUserId, String lastAiMessage, String activeTopicContext) {
        Matcher m = Pattern.compile("Chủ đề ưu tiên:\\s*\"([^\"]+)\"").matcher(lastAiMessage);
        if (m.find()) {
            String recommendedTopic = m.group(1);
            return handleGenerateFlashcards("Tạo 5 từ vựng chủ đề \"" + recommendedTopic + "\"", username, realUserId, recommendedTopic);
        }

        if (!activeTopicContext.isEmpty()) {
            return handleGenerateFlashcards("Tạo 5 từ vựng chủ đề \"" + activeTopicContext + "\"", username, realUserId, activeTopicContext);
        }

        if (lastAiMessage.contains("englishVocabulary")) {
            String previousTopic = extractLastUserTopicFromContext(lastAiMessage);
            return handleGenerateFlashcards("Tạo 5 từ vựng chủ đề \"" + previousTopic + "\"", username, realUserId, previousTopic);
        }

        return "Tôi đã ghi nhận xác nhận của bạn! Bạn muốn tôi tạo bộ thẻ từ vựng cho chủ đề nào tiếp theo? (Ví dụ: Toán học, Vật lý đại cương, Kinh doanh, Du lịch, IELTS...)";
    }

    private String handleGenerateFlashcards(String prompt, String username, String realUserId, String activeTopicContext) {
        int count = extractRequestedCount(prompt, 5);
        String topicQuery = extractTopicKeyword(prompt);

        if ((topicQuery.equals("general vocabulary") || topicQuery.length() < 2) && !activeTopicContext.isEmpty()) {
            topicQuery = activeTopicContext;
        }

        List<Flashcard> personalCards = syncAndLoadPersonalKnowledge(realUserId);
        Set<String> userExistingWords = new HashSet<>();
        if (!realUserId.equals("anonymous")) {
            try {
                List<Topic> userTopics = topicService.getTopicsByUser(realUserId);
                for (Topic t : userTopics) {
                    List<Flashcard> cards = topicService.parseFlashcardList(t.getDataJson());
                    for (Flashcard c : cards) {
                        if (c.getEnglishVocabulary() != null) {
                            userExistingWords.add(c.getEnglishVocabulary().trim().toLowerCase());
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        List<Flashcard> generatedCards = knowledgeBase.searchWithCspAndCosine(topicQuery, count, userExistingWords, personalCards);
        if (generatedCards.isEmpty()) {
            generatedCards = knowledgeBase.searchWithCspAndCosine(topicQuery, count, Collections.emptySet(), personalCards);
        }

        try {
            List<String> jsonBlocks = new ArrayList<>();
            for (Flashcard card : generatedCards) {
                jsonBlocks.add(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(card));
            }
            return String.join(",\n", jsonBlocks);
        } catch (Exception e) {
            return "{\"englishVocabulary\": \"Error\", \"vietnameseVocabulary\": \"Lỗi sinh JSON\", \"example\": \"\", \"pronunciation\": \"\", \"wordPos\": \"(n)\"}";
        }
    }

    private String handleLookupWord(String prompt, String realUserId) {
        List<Flashcard> personalCards = syncAndLoadPersonalKnowledge(realUserId);
        Flashcard found = knowledgeBase.lookupExactOrClosestWord(prompt, personalCards);
        if (found == null) {
            return "Không tìm thấy từ vựng phù hợp trong kho tri thức của bạn. Bạn có thể dạy từ này cho tôi bằng lệnh:\nHọc từ mới: TênTừ - Nghĩa tiếng Việt - (loại từ)";
        }

        return String.format(
                "📖 Kết quả tra cứu từ vựng:\n" +
                "• Từ vựng: %s %s\n" +
                "• Phiên âm IPA: %s\n" +
                "• Nghĩa tiếng Việt: %s\n" +
                "• Ví dụ: %s",
                found.getEnglishVocabulary(),
                found.getWordPos() != null ? found.getWordPos() : "",
                found.getPronunciation() != null ? found.getPronunciation() : "",
                found.getVietnameseVocabulary(),
                found.getExample() != null ? found.getExample() : ""
        );
    }

    private String handleStudyRecommendation(String username, String realUserId) {
        if (realUserId.equals("anonymous")) {
            return "Bạn cần đăng nhập để AI Personal phân tích dữ liệu học tập cá nhân trên Firestore.";
        }

        try {
            List<Topic> topics = topicService.getTopicsByUser(realUserId);
            if (topics == null || topics.isEmpty()) {
                return "Bạn chưa có bộ từ vựng nào. Hãy thử nhập: \"Tạo 5 từ vựng chủ đề Toán học\" để tôi tạo bộ thẻ đầu tiên cho bạn!";
            }

            Topic bestTopic = null;
            double maxUtility = -1.0;
            int bestCompletedCount = 0;
            int bestWordCount = 0;

            for (Topic t : topics) {
                List<Flashcard> cards = topicService.parseFlashcardList(t.getDataJson());
                if (cards.isEmpty()) continue;

                StudyProgress progress = progressService.getProgress(username, t.getTopicId());
                int completedRounds = (progress.getCompletedRounds() != null) ? progress.getCompletedRounds().size() : 0;
                int remainingRounds = Math.max(0, 4 - completedRounds);

                double utilityScore = (remainingRounds * 10.0) + (cards.size() * 1.5);
                if (utilityScore > maxUtility) {
                    maxUtility = utilityScore;
                    bestTopic = t;
                    bestCompletedCount = completedRounds;
                    bestWordCount = cards.size();
                }
            }

            if (bestTopic == null) {
                return "Các chủ đề hiện tại của bạn đều đang trống từ vựng. Hãy thêm từ vựng vào bộ thẻ trước khi bắt đầu ôn tập nhé!";
            }

            return String.format(
                    "🎯 Đề xuất ôn tập tối ưu (Utility-Based Agent):\n" +
                    "• Chủ đề ưu tiên: \"%s\" (%d từ vựng)\n" +
                    "• Tiến độ hiện tại: Đã hoàn thành %d / 4 vòng kiểm tra\n" +
                    "• Chỉ số ưu tiên U(s): %.1f điểm\n" +
                    "👉 Gõ \"ok\" nếu bạn muốn tôi tạo thêm 5 từ vựng mới cho chủ đề \"%s\" ngay bây giờ!",
                    bestTopic.getName(),
                    bestWordCount,
                    bestCompletedCount,
                    maxUtility,
                    bestTopic.getName()
            );
        } catch (Exception e) {
            return "Không thể phân tích tiến độ học tập lúc này: " + e.getMessage();
        }
    }

    private String handleGreetingOrHelp(String username, String realUserId, String activeTopicContext) {
        String brainStats = "";
        if (!realUserId.equals("anonymous")) {
            try {
                List<Flashcard> personalCards = syncAndLoadPersonalKnowledge(realUserId);
                PersonalAiBrain brain = brainService.getOrCreateBrain(realUserId);
                Map<String, String> rules = brainService.getCustomRules(realUserId);
                brainStats = String.format(" (Trí nhớ riêng trên Firestore: %d từ vựng cá nhân | %d quy tắc đã dạy | %d lượt tương tác)",
                        personalCards.size(), rules.size(), brain.getInteractionCount());
            } catch (Exception ignored) {}
        }

        String contextGreeting = !activeTopicContext.isEmpty()
                ? String.format("Tôi nhận thấy bạn đang ở trong chủ đề \"%s\". Bạn có thể gõ \"ok\" để tôi tạo ngay 5 thẻ từ vựng cho chủ đề này, hoặc chọn:\n", activeTopicContext)
                : "Bạn có thể chọn nhanh (gõ 1, 2, 3) hoặc nhập câu hỏi tự nhiên:\n";

        return "🧠 Xin chào " + (username != null && !username.equals("anonymous") ? username : "bạn") + "! Tôi là AI Personal độc lập của riêng bạn" + brainStats + ".\n" +
               contextGreeting +
               "1. Tạo bộ thẻ từ vựng JSON (VD: \"Tạo 5 từ vựng chủ đề Toán học\", \"Vật lý đại cương\", \"Kinh doanh\"...)\n" +
               "2. Tra cứu từ vựng chi tiết (VD: \"Từ Derivative nghĩa là gì?\")\n" +
               "3. Phân tích tiến độ & đề xuất ôn tập tối ưu (VD: \"Hôm nay tôi nên ôn tập chủ đề nào?\")\n" +
               "💡 Dạy kiến thức riêng cho AI: \"Dạy AI: câu hỏi => câu trả lời\" hoặc \"Học từ mới: Từ - Nghĩa - (n)\"";
    }

    private String extractLastAiMessage(String historyMessagesJson) {
        if (historyMessagesJson == null || historyMessagesJson.trim().isEmpty() || historyMessagesJson.trim().equals("[]")) {
            return "";
        }
        try {
            JsonNode arr = objectMapper.readTree(historyMessagesJson);
            if (arr.isArray()) {
                for (int i = arr.size() - 1; i >= 0; i--) {
                    JsonNode node = arr.get(i);
                    if ("ai".equalsIgnoreCase(node.path("sender").asText())) {
                        return node.path("content").asText("");
                    }
                }
            }
        } catch (Exception ignored) {}
        return "";
    }

    private String extractCleanSessionTopic(String sessionTitle) {
        if (sessionTitle == null) return "";
        String clean = sessionTitle.replaceAll("\\s+No\\.\\d+$", "").trim();
        if (clean.isEmpty() || clean.equalsIgnoreCase("Đoạn chat mới")) {
            return "";
        }
        return clean;
    }

    private String extractLastUserTopicFromContext(String lastAiText) {
        if (lastAiText.contains("Derivative") || lastAiText.contains("Integral")) return "Toán học";
        if (lastAiText.contains("Velocity") || lastAiText.contains("Momentum")) return "Vật lý đại cương";
        if (lastAiText.contains("Algorithm") || lastAiText.contains("Concurrency")) return "Công nghệ thông tin";
        if (lastAiText.contains("Itinerary") || lastAiText.contains("Embark")) return "Du lịch";
        return "IELTS học thuật";
    }

    private int extractRequestedCount(String prompt, int defaultCount) {
        Matcher matcher = Pattern.compile("\\b(\\d{1,2})\\b").matcher(prompt);
        if (matcher.find()) {
            int num = Integer.parseInt(matcher.group(1));
            if (num >= 1 && num <= 20) {
                return num;
            }
        }
        return defaultCount;
    }

    private String extractTopicKeyword(String prompt) {
        Matcher quoteMatcher = Pattern.compile("\"([^\"]+)\"").matcher(prompt);
        if (quoteMatcher.find()) {
            return quoteMatcher.group(1).trim();
        }

        String cleaned = prompt.replaceAll("(?i)(bạn hãy|hãy|tạo|sinh|cho tôi|cặp thẻ|flashcard|từ vựng|tiếng anh|cho chủ đề|chủ đề|về|generate|create|words|about|topic|\\d+)", " ")
                .replaceAll("\\s+", " ")
                .trim();

        return cleaned.isEmpty() ? "general vocabulary" : cleaned;
    }
}