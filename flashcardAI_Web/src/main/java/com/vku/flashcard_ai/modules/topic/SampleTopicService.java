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
public class SampleTopicService {

    private static final String COLLECTION_NAME = "sample_topics";

    // Lấy toàn bộ chủ đề mẫu từ Firestore
    public List<SampleTopic> getAllSampleTopics() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<SampleTopic> list = new ArrayList<>();
        for (DocumentSnapshot doc : documents) {
            SampleTopic topic = doc.toObject(SampleTopic.class);
            if (topic != null) {
                if (topic.getId() == null || topic.getId().isEmpty()) {
                    topic.setId(doc.getId());
                }
                list.add(topic);
            }
        }
        return list;
    }

    // Admin import hoặc thêm 1 chủ đề mẫu
    public String saveSampleTopic(SampleTopic topic) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        if (topic.getId() == null || topic.getId().trim().isEmpty()) {
            topic.setId("sample-" + UUID.randomUUID().toString().substring(0, 8));
        }
        db.collection(COLLECTION_NAME).document(topic.getId()).set(topic).get();
        return "Đã lưu chủ đề mẫu vào Firestore thành công!";
    }

    // Xóa chủ đề mẫu (chỉ admin)
    public void deleteSampleTopic(String id) {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(id).delete();
    }
}