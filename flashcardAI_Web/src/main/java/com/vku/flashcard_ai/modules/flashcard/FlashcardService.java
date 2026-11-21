package com.vku.flashcard_ai.modules.flashcard;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.vku.flashcard_ai.modules.topic.Topic;
import com.vku.flashcard_ai.modules.topic.TopicService;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
@SuppressWarnings("null")
public class FlashcardService {

    private static final String COLLECTION_NAME = "topics";
    private final TopicService topicService;
    private final ObjectMapper objectMapper;

    public FlashcardService(TopicService topicService, ObjectMapper objectMapper) {
        this.topicService = topicService;
        this.objectMapper = objectMapper;
    }

    public List<Flashcard> getFlashcardsByTopicId(String topicId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentSnapshot doc = db.collection(COLLECTION_NAME).document(topicId).get().get();
        if (!doc.exists()) {
            return Collections.emptyList();
        }
        Topic topic = doc.toObject(Topic.class);
        if (topic == null) {
            return Collections.emptyList();
        }
        return topicService.parseFlashcardList(topic.getDataJson());
    }

    public boolean deleteSingleFlashcard(String topicId, String englishWord) throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(COLLECTION_NAME).document(topicId);
        DocumentSnapshot doc = docRef.get().get();
        if (!doc.exists()) return false;

        Topic topic = doc.toObject(Topic.class);
        if (topic == null) return false;

        List<Flashcard> cards = topicService.parseFlashcardList(topic.getDataJson());
        boolean removed = cards.removeIf(c -> c.getEnglishVocabulary() != null
                && c.getEnglishVocabulary().trim().equalsIgnoreCase(englishWord.trim()));

        if (removed) {
            String updatedJson = objectMapper.writeValueAsString(cards);
            docRef.update(
                    "dataJson", updatedJson,
                    "count", cards.size(),
                    "orderIndex", System.currentTimeMillis()
            ).get();
        }
        return removed;
    }
}