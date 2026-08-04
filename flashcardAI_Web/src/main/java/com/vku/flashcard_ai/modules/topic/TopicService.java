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
public class TopicService {

    private static final String COLLECTION_NAME = "topics";

    // 1. Lấy danh sách chủ đề của user
    public List<Topic> getTopicsByUser(String userId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("userId", userId)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Topic> topics = new ArrayList<>();
        for (DocumentSnapshot doc : documents) {
            Topic topic = doc.toObject(Topic.class);
            topics.add(topic);
        }
        return topics;
    }

    // 2. Thêm hoặc Cập nhật gói chủ đề (Lưu nguyên cục JSON vào dataJson)
    @SuppressWarnings("null")
    public String saveTopic(Topic topic) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        if (topic.getTopicId() == null || topic.getTopicId().isEmpty()) {
            topic.setTopicId(UUID.randomUUID().toString());
            topic.setCreatedAt(System.currentTimeMillis());
        }
        
        ApiFuture<WriteResult> collectionsApiFuture = db.collection(COLLECTION_NAME)
                .document(topic.getTopicId())
                .set(topic);
        
        return "Topic saved successfully at: " + collectionsApiFuture.get().getUpdateTime();
    }

    // 3. Xóa chủ đề theo ID
    @SuppressWarnings("null")
    public String deleteTopic(String topicId) {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(topicId).delete();
        return "Topic deleted successfully!";
    }
}