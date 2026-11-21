package com.vku.flashcard_ai.modules.topic;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.vku.flashcard_ai.modules.flashcard.Flashcard;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
@SuppressWarnings("null")
public class TopicService {

    private static final String COLLECTION_NAME = "topics";
    private final ObjectMapper objectMapper;

    public TopicService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper.copy()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public String getUserIdByUsername(String username) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            List<QueryDocumentSnapshot> docs = db.collection("users")
                    .whereEqualTo("username", username)
                    .get().get().getDocuments();
            if (!docs.isEmpty()) {
                String id = docs.get(0).getString("userId");
                if (id != null && !id.isEmpty()) {
                    return id;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return username;
    }

    // 1. Lấy danh sách sắp xếp ưu tiên bộ thẻ vừa thao tác lên đầu
    public List<Topic> getTopicsByUser(String userId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("userId", userId)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Topic> topics = new ArrayList<>();
        for (DocumentSnapshot doc : documents) {
            Topic topic = doc.toObject(Topic.class);
            if (topic != null) {
                topics.add(topic);
            }
        }

        // Sắp xếp orderIndex giảm dần (thẻ mới nhất/vừa sửa lên đầu) trên RAM
        topics.sort((a, b) -> Long.compare(b.getOrderIndex(), a.getOrderIndex()));

        return topics;
    }

    public String saveTopic(Topic topic) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        boolean isNew = (topic.getTopicId() == null || topic.getTopicId().isEmpty());

        if (isNew) {
            topic.setTopicId(UUID.randomUUID().toString());
            topic.setCreatedAt(System.currentTimeMillis());
        }

        // Chuẩn hóa và đếm chính xác số lượng thẻ bằng ObjectMapper trước khi lưu
        List<Flashcard> parsedCards = parseFlashcardList(topic.getDataJson());
        try {
            topic.setDataJson(objectMapper.writeValueAsString(parsedCards));
            if (!parsedCards.isEmpty() || (topic.getDataJson() != null && topic.getDataJson().equals("[]") && !isNew)) {
                topic.setCount(parsedCards.size());
            }
        } catch (Exception ignored) {}

        db.collection(COLLECTION_NAME).document(topic.getTopicId()).set(topic).get();

        // Đồng bộ đổi tên toàn bộ nhóm chat bên ai_chat_histories nếu đổi tên Topic
        if (!isNew && topic.getName() != null) {
            try {
                String originChatId = topic.getTopicId() + "-origin";
                renameChatSessionFromTopic(originChatId, topic.getName());
            } catch (Exception ignored) {}
        }

        return "Topic saved successfully!";
    }

    private void renameChatSessionFromTopic(String originChatId, String newTitle) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            List<QueryDocumentSnapshot> groupDocs = db.collection("ai_chat_histories")
                    .whereEqualTo("groupId", originChatId)
                    .get().get().getDocuments();

            for (DocumentSnapshot childDoc : groupDocs) {
                String childId = childDoc.getId();
                if (childId.endsWith("-origin")) {
                    childDoc.getReference().update("title", newTitle);
                } else if (childId.contains("-no")) {
                    String noSuffix = childId.substring(childId.lastIndexOf("-no"));
                    String noNumber = noSuffix.replace("-no", " No.");
                    childDoc.getReference().update("title", newTitle + noNumber);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // Nối JSON từ vựng mới vào Topic và TỰ ĐỘNG LỌC TRÙNG TỪ VỰNG bằng Jackson ObjectMapper
    public String appendJsonToTopic(String topicId, String rawInputJson) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(COLLECTION_NAME).document(topicId);
        DocumentSnapshot doc = docRef.get().get();

        if (!doc.exists()) {
            return "Không tìm thấy chủ đề!";
        }

        Topic topic = doc.toObject(Topic.class);
        String existingJson = (topic != null && topic.getDataJson() != null) ? topic.getDataJson().trim() : "[]";

        // 1. Parse danh sách thẻ hiện có và danh sách thẻ mới bằng ObjectMapper
        List<Flashcard> existingCards = parseFlashcardList(existingJson);
        List<Flashcard> incomingCards = parseFlashcardList(rawInputJson);

        if (incomingCards.isEmpty()) {
            return "Dữ liệu JSON không hợp lệ hoặc không chứa thẻ từ vựng nào!";
        }

        // 2. Tạo tập hợp các từ tiếng Anh đã tồn tại (chữ thường) để tra cứu O(1)
        Set<String> existingVocabSet = new HashSet<>();
        for (Flashcard card : existingCards) {
            if (card.getEnglishVocabulary() != null && !card.getEnglishVocabulary().trim().isEmpty()) {
                existingVocabSet.add(card.getEnglishVocabulary().trim().toLowerCase());
            }
        }

        // 3. Lọc bỏ từ trùng lặp và thêm từ mới
        int addedCount = 0;
        int duplicateCount = 0;

        for (Flashcard newCard : incomingCards) {
            String eng = (newCard.getEnglishVocabulary() != null) ? newCard.getEnglishVocabulary().trim() : "";
            if (eng.isEmpty()) continue;

            String normalizedKey = eng.toLowerCase();
            if (existingVocabSet.contains(normalizedKey)) {
                duplicateCount++;
            } else {
                existingCards.add(newCard);
                existingVocabSet.add(normalizedKey);
                addedCount++;
            }
        }

        if (addedCount == 0) {
            return "Tất cả các từ vựng này đều đã tồn tại trong bộ Flashcard!";
        }

        // 4. Serialize lại thành chuỗi JSON chuẩn và cập nhật Firestore
        try {
            String mergedJson = objectMapper.writeValueAsString(existingCards);
            int totalCount = existingCards.size();
            long newOrderIndex = System.currentTimeMillis();

            docRef.update(
                    "dataJson", mergedJson,
                    "count", totalCount,
                    "orderIndex", newOrderIndex
            ).get();

            if (duplicateCount > 0) {
                return String.format("Đã thêm thành công %d từ mới (Đã bỏ qua %d từ bị trùng)!", addedCount, duplicateCount);
            } else {
                return String.format("Đã thêm thành công toàn bộ %d từ vựng vào Flashcard!", addedCount);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "Lỗi chuẩn hóa dữ liệu JSON: " + e.getMessage();
        }
    }

    // Hàm dùng chung: Làm sạch chuỗi đầu vào và parse thành List<Flashcard> bằng Jackson
    public List<Flashcard> parseFlashcardList(String rawJson) {
        if (rawJson == null || rawJson.trim().isEmpty() || rawJson.trim().equals("[]") || rawJson.trim().equals("null")) {
            return new ArrayList<>();
        }

        String cleanInput = rawJson
                .replace("```json", "")
                .replace("```", "")
                .replace("&quot;", "\"")
                .replace("&#34;", "\"")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&#39;", "'")
                .trim();

        // Xóa ngoặc vuông dư ở hai đầu nếu có, vá lỗi thiếu dấu phẩy giữa các object }{ và bọc lại chuẩn mảng
        cleanInput = cleanInput.replaceAll("^\\[+", "").replaceAll("\\]+$", "").trim();
        if (cleanInput.isEmpty()) {
            return new ArrayList<>();
        }
        cleanInput = cleanInput.replaceAll("(?<=\\})\\s*(?=\\{)", ",");
        cleanInput = "[" + cleanInput + "]";

        try {
            return objectMapper.readValue(cleanInput, new TypeReference<List<Flashcard>>() {});
        } catch (Exception e) {
            System.err.println("⚠️ Không thể parse JSON Flashcard: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public String deleteTopic(String topicId) {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(topicId).delete();

        try {
            List<QueryDocumentSnapshot> chatDocs = db.collection("ai_chat_histories")
                    .whereEqualTo("topicId", topicId)
                    .get().get().getDocuments();
            for (DocumentSnapshot doc : chatDocs) {
                doc.getReference().delete();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return "Topic deleted successfully!";
    }
}