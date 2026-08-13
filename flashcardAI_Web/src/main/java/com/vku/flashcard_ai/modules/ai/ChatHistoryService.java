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
@SuppressWarnings("null")
public class ChatHistoryService {

    private static final String COLLECTION_NAME = "ai_chat_histories";

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

    public List<AiChatHistory> getHistoriesByUser(String username) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        String realUserId = getUserIdByUsername(username);

        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("userId", realUserId)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<AiChatHistory> list = new ArrayList<>();
        for (DocumentSnapshot doc : documents) {
            list.add(doc.toObject(AiChatHistory.class));
        }

        list.sort((a, b) -> Long.compare(a.getUpdatedAt(), b.getUpdatedAt()));
        return list;
    }

    public AiChatHistory createNewChatSession(String username, String baseTitle, String topicId, String chatType) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        String realUserId = getUserIdByUsername(username);

        List<AiChatHistory> existing = getHistoriesByUser(username);

        if ("TOPIC".equals(chatType) && topicId != null && !topicId.isEmpty()) {
            boolean hasOrigin = false;
            int maxNo = 0;

            for (AiChatHistory h : existing) {
                if (topicId.equals(h.getTopicId())) {
                    if ((topicId + "-origin").equals(h.getChatId())) {
                        hasOrigin = true;
                    }
                    if (h.getChatId() != null && h.getChatId().contains("-no")) {
                        try {
                            String numStr = h.getChatId().substring(h.getChatId().lastIndexOf("-no") + 3);
                            int num = Integer.parseInt(numStr);
                            if (num > maxNo) maxNo = num;
                        } catch (Exception ignored) {}
                    }
                }
            }

            if (!hasOrigin) {
                AiChatHistory originSession = new AiChatHistory();
                originSession.setChatId(topicId + "-origin");
                originSession.setUserId(realUserId);
                originSession.setTopicId(topicId);
                originSession.setGroupId(topicId + "-origin");
                originSession.setTitle(baseTitle);
                originSession.setChatType("TOPIC_ORIGIN");
                originSession.setMessagesJson("[]");
                originSession.setUpdatedAt(System.currentTimeMillis());

                db.collection(COLLECTION_NAME).document(originSession.getChatId()).set(originSession).get();
            }

            int nextNo = maxNo + 1;
            AiChatHistory noSession = new AiChatHistory();
            noSession.setChatId(topicId + "-no" + nextNo);
            noSession.setUserId(realUserId);
            noSession.setTopicId(topicId);
            noSession.setGroupId(topicId + "-origin");
            noSession.setTitle(baseTitle + " No." + nextNo);
            noSession.setChatType("TOPIC");
            noSession.setMessagesJson("[]");
            noSession.setUpdatedAt(System.currentTimeMillis() + nextNo);

            db.collection(COLLECTION_NAME).document(noSession.getChatId()).set(noSession).get();
            return noSession;
        } else {
            AiChatHistory generalSession = new AiChatHistory();
            String genId = "gen-" + UUID.randomUUID().toString().substring(0, 8);
            generalSession.setChatId(genId);
            generalSession.setUserId(realUserId);
            generalSession.setGroupId(genId);
            generalSession.setTitle(baseTitle != null ? baseTitle : "Đoạn chat mới");
            generalSession.setChatType("GENERAL");
            generalSession.setMessagesJson("[]");
            generalSession.setUpdatedAt(System.currentTimeMillis());

            db.collection(COLLECTION_NAME).document(generalSession.getChatId()).set(generalSession).get();
            return generalSession;
        }
    }

    public String getMessagesJsonByChatId(String chatId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            DocumentSnapshot doc = db.collection(COLLECTION_NAME).document(chatId).get().get();
            if (doc.exists()) {
                return doc.getString("messagesJson");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "[]";
    }

    public void saveMessageToSession(String chatId, String sender, String messageText, String modelType) {
        try {
            if (chatId == null || chatId.isEmpty() || chatId.endsWith("-origin")) return;

            Firestore db = FirestoreClient.getFirestore();
            DocumentReference docRef = db.collection(COLLECTION_NAME).document(chatId);
            
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();
            
            String safeMsgText = messageText != null ? messageText : "";
            String escapedMsg = safeMsgText.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
            
            // Bổ sung trường modelType vào JSON lưu trên Firebase
            String safeModelType = (modelType != null) ? modelType : "gemini";
            String newMsgJson = "{\"sender\":\"" + sender + "\",\"content\":\"" + escapedMsg + "\",\"modelType\":\"" + safeModelType + "\",\"timestamp\":" + System.currentTimeMillis() + "}";

            if (document != null && document.exists()) {
                AiChatHistory history = document.toObject(AiChatHistory.class);
                String currentJson = (history != null && history.getMessagesJson() != null) ? history.getMessagesJson() : "[]";
                
                if (currentJson.equals("[]") || currentJson.trim().isEmpty()) {
                    currentJson = "[" + newMsgJson + "]";
                } else if (currentJson.length() > 1) {
                    currentJson = currentJson.substring(0, currentJson.length() - 1) + "," + newMsgJson + "]";
                }
                
                docRef.update("messagesJson", currentJson, "updatedAt", System.currentTimeMillis()).get();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void renameChatSession(String chatId, String newTitle) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            DocumentReference docRef = db.collection(COLLECTION_NAME).document(chatId);
            DocumentSnapshot doc = docRef.get().get();

            if (doc.exists()) {
                AiChatHistory currentChat = doc.toObject(AiChatHistory.class);

                // Nếu là đổi tên cho bản Gốc (Topic Header)
                if (chatId.endsWith("-origin") || "TOPIC_ORIGIN".equals(currentChat.getChatType())) {
                    String groupId = currentChat.getGroupId();
                    
                    // Lấy toàn bộ các đoạn chat con thuộc nhóm này
                    List<QueryDocumentSnapshot> groupDocs = db.collection(COLLECTION_NAME)
                            .whereEqualTo("groupId", groupId)
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
                } else {
                    // Nếu đổi tên một đoạn chat lẻ
                    docRef.update("title", newTitle).get();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void deleteChatSession(String chatId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            db.collection(COLLECTION_NAME).document(chatId).delete().get();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}