package com.vku.flashcard_ai.modules.topic;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
@SuppressWarnings("null")
public class TopicService {

    private static final String COLLECTION_NAME = "topics";

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

    public List<Topic> getTopicsByUser(String userId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("userId", userId)
                .orderBy("orderIndex", Query.Direction.ASCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Topic> topics = new ArrayList<>();
        for (DocumentSnapshot doc : documents) {
            Topic topic = doc.toObject(Topic.class);
            topics.add(topic);
        }
        return topics;
    }

    public String saveTopic(Topic topic) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        boolean isNew = (topic.getTopicId() == null || topic.getTopicId().isEmpty());
        
        if (isNew) {
            topic.setTopicId(UUID.randomUUID().toString());
            topic.setCreatedAt(System.currentTimeMillis());
        }
        
        db.collection(COLLECTION_NAME).document(topic.getTopicId()).set(topic);

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

    // Nối JSON từ vựng mới vào Topic và TỰ ĐỘNG LỌC TRÙNG TỪ VỰNG
    public String appendJsonToTopic(String topicId, String rawInputJson) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(COLLECTION_NAME).document(topicId);
        DocumentSnapshot doc = docRef.get().get();

        if (!doc.exists()) {
            return "Không tìm thấy chủ đề!";
        }

        Topic topic = doc.toObject(Topic.class);
        String existingJson = (topic != null && topic.getDataJson() != null) ? topic.getDataJson().trim() : "[]";

        // 1. Dọn dẹp chuỗi đầu vào & Giải mã HTML entities nếu có
        String cleanInput = rawInputJson.replaceAll("```json", "").replaceAll("```", "").trim();
        cleanInput = cleanInput.replace("&quot;", "\"")
                                .replace("&#34;", "\"")
                                .replace("&amp;", "&")
                                .replace("&lt;", "<")
                                .replace("&gt;", ">")
                                .replace("&#39;", "'");

        if (!cleanInput.startsWith("[")) cleanInput = "[" + cleanInput;
        if (!cleanInput.endsWith("]")) cleanInput = cleanInput + "]";
        cleanInput = cleanInput.replaceAll("(?<=\\}\\s*)(?=\\{)", ",");

        // 2. Trích xuất mảng từ vựng cũ
        List<String> existingVocabs = extractEnglishVocabularies(existingJson);
        
        // 3. Tách các object từ vựng mới và chỉ giữ lại từ CHƯA TRÙNG
        List<String> validNewObjects = new ArrayList<>();
        int duplicateCount = 0;

        // Tách các khối object {...} bằng Java thuần
        String[] newItems = cleanInput.substring(1, cleanInput.length() - 1).split("(?<=\\}),\\s*(?=\\{)");

        for (String item : newItems) {
            String cleanItem = item.trim();
            if (cleanItem.isEmpty()) continue;
            if (!cleanItem.startsWith("{")) cleanItem = "{" + cleanItem;
            if (!cleanItem.endsWith("}")) cleanItem = cleanItem + "}";

            // Lấy từ tiếng Anh của thẻ mới
            String engVocab = extractSingleEnglishVocabulary(cleanItem);

            if (!engVocab.isEmpty() && existingVocabs.contains(engVocab.toLowerCase())) {
                duplicateCount++; // Phát hiện trùng từ
            } else {
                validNewObjects.add(cleanItem);
                if (!engVocab.isEmpty()) {
                    existingVocabs.add(engVocab.toLowerCase());
                }
            }
        }

        if (validNewObjects.isEmpty()) {
            return "Tất cả các từ vựng này đều đã tồn tại trong bộ Flashcard!";
        }

        // 4. Ghép mảng dữ liệu mới đã lọc trùng
        String newlyAddedString = String.join(",", validNewObjects);
        String mergedJson = "[]";

        if (existingJson.equals("[]") || existingJson.isEmpty()) {
            mergedJson = "[" + newlyAddedString + "]";
        } else {
            String coreExisting = existingJson.substring(1, existingJson.length() - 1).trim();
            boolean needsComma = !coreExisting.endsWith(",") && !newlyAddedString.startsWith(",");
            mergedJson = "[" + coreExisting + (needsComma ? "," : "") + newlyAddedString + "]";
        }

        // 5. Đếm lại tổng số từ vựng
        int totalCount = 0;
        if (mergedJson.length() > 2) {
            totalCount = mergedJson.length() - mergedJson.replace("{\"englishVocabulary\"", "").length();
            if (totalCount == 0) {
                totalCount = mergedJson.length() - mergedJson.replace("{", "").length();
            }
        }

        docRef.update("dataJson", mergedJson, "count", totalCount);

        if (duplicateCount > 0) {
            return String.format("Đã thêm thành công %d từ mới (Đã bỏ qua %d từ bị trùng)!", validNewObjects.size(), duplicateCount);
        } else {
            return String.format("Đã thêm thành công toàn bộ %d từ vựng vào Flashcard!", validNewObjects.size());
        }
    }

    // Hàm phụ trợ: Lấy danh sách từ tiếng Anh trong mảng JSON
    private List<String> extractEnglishVocabularies(String jsonArrayStr) {
        List<String> list = new ArrayList<>();
        if (jsonArrayStr == null || jsonArrayStr.length() <= 2) return list;

        String[] items = jsonArrayStr.substring(1, jsonArrayStr.length() - 1).split("(?<=\\}),\\s*(?=\\{)");
        for (String item : items) {
            String vocab = extractSingleEnglishVocabulary(item);
            if (!vocab.isEmpty()) {
                list.add(vocab.toLowerCase());
            }
        }
        return list;
    }

    // Hàm phụ trợ: Trích xuất trường "englishVocabulary" của 1 object
    private String extractSingleEnglishVocabulary(String singleJsonObj) {
        try {
            int keyIndex = singleJsonObj.indexOf("\"englishVocabulary\"");
            if (keyIndex != -1) {
                int colonIndex = singleJsonObj.indexOf(":", keyIndex);
                if (colonIndex != -1) {
                    int startQuote = singleJsonObj.indexOf("\"", colonIndex + 1);
                    if (startQuote != -1) {
                        int endQuote = singleJsonObj.indexOf("\"", startQuote + 1);
                        if (endQuote != -1) {
                            return singleJsonObj.substring(startQuote + 1, endQuote).trim();
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        return "";
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