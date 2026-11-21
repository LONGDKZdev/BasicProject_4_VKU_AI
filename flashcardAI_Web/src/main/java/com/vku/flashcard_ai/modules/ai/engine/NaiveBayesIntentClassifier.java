package com.vku.flashcard_ai.modules.ai.engine;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Bộ phân loại ý định người dùng sử dụng thuật toán Multinomial Naive Bayes
 * Áp dụng công thức xác suất hậu nghiệm với Laplace Smoothing:
 * y_hat = argmax_y [ log P(y) + sum_j log P(w_j | y) ]
 */
@Component
public class NaiveBayesIntentClassifier {

    public enum Intent {
        GENERATE_FLASHCARDS,
        LOOKUP_WORD,
        STUDY_RECOMMENDATION,
        LIST_TOPICS,
        CONFIRM_OR_FOLLOWUP,
        GREETING_OR_HELP
    }

    private final Map<Intent, Integer> classDocCounts = new EnumMap<>(Intent.class);
    private final Map<Intent, Map<String, Integer>> wordCountsPerClass = new EnumMap<>(Intent.class);
    private final Map<Intent, Integer> totalWordsPerClass = new EnumMap<>(Intent.class);
    private final Set<String> vocabulary = new HashSet<>();
    private int totalDocuments = 0;

    @PostConstruct
    public void trainModel() {
        for (Intent intent : Intent.values()) {
            classDocCounts.put(intent, 0);
            wordCountsPerClass.put(intent, new HashMap<>());
            totalWordsPerClass.put(intent, 0);
        }

        // 1. Nhãn tạo bộ thẻ Flashcard
        addTrainingSample(Intent.GENERATE_FLASHCARDS, "tạo 10 cặp thẻ flashcard cho chủ đề du lịch");
        addTrainingSample(Intent.GENERATE_FLASHCARDS, "tạo từ vựng tiếng anh chủ đề công nghệ thông tin");
        addTrainingSample(Intent.GENERATE_FLASHCARDS, "sinh bộ thẻ flashcard chủ đề toán học");
        addTrainingSample(Intent.GENERATE_FLASHCARDS, "tạo 5 từ vựng chủ đề vật lý đại cương");
        addTrainingSample(Intent.GENERATE_FLASHCARDS, "cho tôi danh sách từ vựng chủ đề kinh doanh");
        addTrainingSample(Intent.GENERATE_FLASHCARDS, "tạo flashcard chủ đề giao tiếp hàng ngày");
        addTrainingSample(Intent.GENERATE_FLASHCARDS, "generate 10 flashcards about mathematics physics");
        addTrainingSample(Intent.GENERATE_FLASHCARDS, "create vocabulary list for topic travel");
        addTrainingSample(Intent.GENERATE_FLASHCARDS, "tạo bộ từ vựng chủ đề ielts môi trường");
        addTrainingSample(Intent.GENERATE_FLASHCARDS, "viết json từ vựng chủ đề mới");

        // 2. Nhãn hỏi danh sách các chủ đề hiện có (List / Explore Topics)
        addTrainingSample(Intent.LIST_TOPICS, "còn chủ đề khác trừ 3 cái đó không");
        addTrainingSample(Intent.LIST_TOPICS, "có những chủ đề nào trong kho dữ liệu");
        addTrainingSample(Intent.LIST_TOPICS, "liệt kê tất cả các chủ đề bạn biết");
        addTrainingSample(Intent.LIST_TOPICS, "còn chủ đề nào khác nữa không");
        addTrainingSample(Intent.LIST_TOPICS, "bạn hỗ trợ những chủ đề từ vựng gì");
        addTrainingSample(Intent.LIST_TOPICS, "cho xem danh sách các chủ đề hiện có");
        addTrainingSample(Intent.LIST_TOPICS, "ngoài các chủ đề đó còn chủ đề nào khác");
        addTrainingSample(Intent.LIST_TOPICS, "what other topics do you have");

        // 3. Nhãn tra cứu & giải thích từ vựng
        addTrainingSample(Intent.LOOKUP_WORD, "từ ubiquitous nghĩa là gì");
        addTrainingSample(Intent.LOOKUP_WORD, "tra cứu từ derivative");
        addTrainingSample(Intent.LOOKUP_WORD, "giải thích nghĩa và ví dụ của từ momentum");
        addTrainingSample(Intent.LOOKUP_WORD, "phiên âm và loại từ của từ algorithm là gì");
        addTrainingSample(Intent.LOOKUP_WORD, "what is the meaning of concurrency");
        addTrainingSample(Intent.LOOKUP_WORD, "define word velocity");
        addTrainingSample(Intent.LOOKUP_WORD, "cho ví dụ câu với từ collaborate");
        addTrainingSample(Intent.LOOKUP_WORD, "dịch từ eloquent sang tiếng việt");

        // 4. Nhãn tư vấn & đánh giá lộ trình ôn tập
        addTrainingSample(Intent.STUDY_RECOMMENDATION, "hôm nay tôi nên học chủ đề nào");
        addTrainingSample(Intent.STUDY_RECOMMENDATION, "gợi ý lộ trình ôn tập từ vựng cho tôi");
        addTrainingSample(Intent.STUDY_RECOMMENDATION, "tôi nên ôn tập bộ thẻ nào tiếp theo");
        addTrainingSample(Intent.STUDY_RECOMMENDATION, "đánh giá tiến độ học tập của tôi");
        addTrainingSample(Intent.STUDY_RECOMMENDATION, "bộ từ vựng nào tôi chưa hoàn thành kiểm tra");
        addTrainingSample(Intent.STUDY_RECOMMENDATION, "đề xuất chủ đề cần học gấp");
        addTrainingSample(Intent.STUDY_RECOMMENDATION, "recommend study plan for my flashcards");

        // 5. Nhãn xác nhận / tiếp nối hội thoại (Context Follow-up)
        addTrainingSample(Intent.CONFIRM_OR_FOLLOWUP, "ok đồng ý làm đi");
        addTrainingSample(Intent.CONFIRM_OR_FOLLOWUP, "được rồi tạo đi bạn");
        addTrainingSample(Intent.CONFIRM_OR_FOLLOWUP, "tiếp tục tạo thêm từ mới đi");
        addTrainingSample(Intent.CONFIRM_OR_FOLLOWUP, "thêm vài từ nữa nhé");
        addTrainingSample(Intent.CONFIRM_OR_FOLLOWUP, "yes sure go ahead");
        addTrainingSample(Intent.CONFIRM_OR_FOLLOWUP, "tạo tiếp cho chủ đề này");

        // 6. Nhãn chào hỏi & hướng dẫn
        addTrainingSample(Intent.GREETING_OR_HELP, "xin chào ai chào chat");
        addTrainingSample(Intent.GREETING_OR_HELP, "hello hi bạn là ai vậy");
        addTrainingSample(Intent.GREETING_OR_HELP, "bạn có thể làm được gì");
        addTrainingSample(Intent.GREETING_OR_HELP, "hướng dẫn sử dụng trợ lý ai");
        addTrainingSample(Intent.GREETING_OR_HELP, "cảm ơn bạn nhé");
    }

    private void addTrainingSample(Intent intent, String text) {
        List<String> tokens = tokenize(text);
        classDocCounts.put(intent, classDocCounts.get(intent) + 1);
        totalDocuments++;

        Map<String, Integer> wordMap = wordCountsPerClass.get(intent);
        int currentTotal = totalWordsPerClass.get(intent);

        for (String token : tokens) {
            vocabulary.add(token);
            wordMap.put(token, wordMap.getOrDefault(token, 0) + 1);
            currentTotal++;
        }
        totalWordsPerClass.put(intent, currentTotal);
    }

    public Intent predictIntent(String userInput) {
        if (userInput == null || userInput.trim().isEmpty()) {
            return Intent.GREETING_OR_HELP;
        }

        String cleanLower = userInput.trim().toLowerCase();
        if (cleanLower.equals("ok") || cleanLower.equals("oke") || cleanLower.equals("ừ")
                || cleanLower.equals("đồng ý") || cleanLower.equals("tiếp") || cleanLower.equals("tiếp tục")) {
            return Intent.CONFIRM_OR_FOLLOWUP;
        }

        List<String> tokens = tokenize(userInput);
        if (tokens.isEmpty()) {
            return Intent.GREETING_OR_HELP;
        }

        Intent bestIntent = Intent.GREETING_OR_HELP;
        double maxLogProb = Double.NEGATIVE_INFINITY;
        int vocabSize = Math.max(1, vocabulary.size());

        for (Intent intent : Intent.values()) {
            int docCount = classDocCounts.get(intent);
            if (docCount == 0) continue;

            double logProb = Math.log((double) docCount / totalDocuments);
            Map<String, Integer> wordMap = wordCountsPerClass.get(intent);
            int totalWordsInClass = totalWordsPerClass.get(intent);

            for (String token : tokens) {
                int count = wordMap.getOrDefault(token, 0);
                double condProb = (double) (count + 1) / (totalWordsInClass + vocabSize);
                logProb += Math.log(condProb);
            }

            if (logProb > maxLogProb) {
                maxLogProb = logProb;
                bestIntent = intent;
            }
        }

        return bestIntent;
    }

    public List<String> tokenize(String text) {
        String normalized = Normalizer.normalize(text.toLowerCase(), Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String noDiacritics = pattern.matcher(normalized).replaceAll("")
                .replace('đ', 'd')
                .replaceAll("[^a-z0-9\\s]", " ");

        String[] rawTokens = noDiacritics.trim().split("\\s+");
        List<String> result = new ArrayList<>();
        for (String t : rawTokens) {
            if (t.length() >= 2) {
                result.add(t);
            }
        }
        return result;
    }
}