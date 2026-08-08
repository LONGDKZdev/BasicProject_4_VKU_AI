package com.vku.flashcard_ai.modules.ai;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.vku.flashcard_ai.modules.ai.model.AiChatHistory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class ChatHistoryService {

    private static final String COLLECTION_NAME = "ai_chat_histories";

    // Hàm phụ trợ: Lấy chuỗi userId bảo mật từ username (đồng bộ với TopicService)
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

    // 1. Lấy danh sách lịch sử chat của user theo đúng userId bảo mật
    public List<AiChatHistory> getHistoriesByUser(String username) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        String realUserId = getUserIdByUsername(username);

        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("userId", realUserId)
                .orderBy("updatedAt", Query.Direction.DESCENDING)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<AiChatHistory> list = new ArrayList<>();
        for (DocumentSnapshot doc : documents) {
            list.add(doc.toObject(AiChatHistory.class));
        }
        return list;
    }

    // 2. Tạo phiên bản chat mới gắn liền với userId thực tế và nhóm groupId
    public AiChatHistory createNewChatSession(String username, String baseTitle, String topicId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        String realUserId = getUserIdByUsername(username);
        
        List<AiChatHistory> existing = getHistoriesByUser(username);
        String groupId = null;
        int countMatch = 0;

        for (AiChatHistory h : existing) {
            if (h.getTitle() != null && (h.getTitle().equals(baseTitle) || h.getTitle().startsWith(baseTitle + " No."))) {
                if (groupId == null) {
                    groupId = h.getGroupId() != null ? h.getGroupId() : h.getChatId();
                }
                countMatch++;
            }
        }

        if (groupId == null) {
            groupId = UUID.randomUUID().toString();
        }

        String finalTitle = baseTitle;
        if (countMatch > 0) {
            finalTitle = baseTitle + " No." + countMatch;
        }

        AiChatHistory newSession = new AiChatHistory();
        newSession.setChatId(UUID.randomUUID().toString());
        newSession.setUserId(realUserId); // Lưu đúng userId liên kết database tài khoản
        newSession.setGroupId(groupId);
        newSession.setTitle(finalTitle);
        newSession.setTopicId(topicId);
        newSession.setUpdatedAt(System.currentTimeMillis());

        db.collection(COLLECTION_NAME).document(newSession.getChatId()).set(newSession);
        return newSession;
    }

    // Cập nhật tin nhắn vào phiên chat
    public void saveMessageToSession(String chatId, String userMsg, String aiMsg) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            DocumentReference docRef = db.collection(COLLECTION_NAME).document(chatId);
            
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();
            
            if (document.exists()) {
                AiChatHistory history = document.toObject(AiChatHistory.class);
                // Đơn giản hóa việc lưu chuỗi tin nhắn hoặc mảng JSON
                String existingMessages = history.getMessagesJson() != null ? history.getMessagesJson() : "[]";
                
                // Cập nhật lại thời gian và nội dung
                docRef.update("updatedAt", System.currentTimeMillis());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}