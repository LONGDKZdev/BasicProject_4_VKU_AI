package com.vku.flashcard_ai.modules.ai.engine;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.vku.flashcard_ai.modules.ai.model.PersonalAiBrain;
import com.vku.flashcard_ai.modules.flashcard.Flashcard;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;

/**
 * Dịch vụ quản lý bộ nhớ & tri thức riêng biệt cho từng tài khoản trên Firestore (Collection: personal_ai_brains)
 */
@Service
@SuppressWarnings("null")
public class PersonalAiBrainService {

    private static final String COLLECTION_NAME = "personal_ai_brains";
    private final ObjectMapper objectMapper;
    private final JavaType flashcardListType;
    private final JavaType stringMapType;

    public PersonalAiBrainService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.flashcardListType = objectMapper.getTypeFactory().constructCollectionType(ArrayList.class, Flashcard.class);
        this.stringMapType = objectMapper.getTypeFactory().constructMapType(HashMap.class, String.class, String.class);
    }

    public PersonalAiBrain getOrCreateBrain(String userId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        String brainId = "brain_" + userId;
        DocumentReference docRef = db.collection(COLLECTION_NAME).document(brainId);
        DocumentSnapshot doc = docRef.get().get();

        if (doc.exists()) {
            PersonalAiBrain existing = doc.toObject(PersonalAiBrain.class);
            if (existing != null) {
                if (existing.getCustomKnowledgeJson() == null) existing.setCustomKnowledgeJson("[]");
                if (existing.getCustomRulesJson() == null) existing.setCustomRulesJson("{}");
                if (existing.getWordWeightsJson() == null) existing.setWordWeightsJson("{}");
                return existing;
            }
        }

        PersonalAiBrain newBrain = new PersonalAiBrain();
        newBrain.setBrainId(brainId);
        newBrain.setUserId(userId);
        newBrain.setCustomKnowledgeJson("[]");
        newBrain.setCustomRulesJson("{}");
        newBrain.setWordWeightsJson("{}");
        newBrain.setInteractionCount(0);
        newBrain.setUpdatedAt(System.currentTimeMillis());

        docRef.set(newBrain).get();
        return newBrain;
    }

    public void saveBrain(PersonalAiBrain brain) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        brain.setUpdatedAt(System.currentTimeMillis());
        db.collection(COLLECTION_NAME).document(brain.getBrainId()).set(brain).get();
    }

    /**
     * Nạp và đồng bộ các từ vựng mới của riêng user này vào brain_{userId} trên Firestore
     */
    public List<Flashcard> getAndSyncUserKnowledge(String userId, List<Flashcard> latestUserCards) {
        try {
            PersonalAiBrain brain = getOrCreateBrain(userId);
            List<Flashcard> storedCards = objectMapper.readValue(brain.getCustomKnowledgeJson(), flashcardListType);

            Set<String> existingKeys = new HashSet<>();
            for (Flashcard fc : storedCards) {
                if (fc.getEnglishVocabulary() != null) {
                    existingKeys.add(fc.getEnglishVocabulary().trim().toLowerCase());
                }
            }

            boolean changed = false;
            if (latestUserCards != null) {
                for (Flashcard c : latestUserCards) {
                    if (c.getEnglishVocabulary() == null || c.getEnglishVocabulary().trim().isEmpty()) continue;
                    String key = c.getEnglishVocabulary().trim().toLowerCase();
                    if (!existingKeys.contains(key)) {
                        storedCards.add(c);
                        existingKeys.add(key);
                        changed = true;
                    }
                }
            }

            if (changed) {
                brain.setCustomKnowledgeJson(objectMapper.writeValueAsString(storedCards));
                saveBrain(brain);
            }

            return storedCards;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    /**
     * Dạy thêm một quy tắc phản hồi mới cho AI riêng của user này và lưu lên Firestore
     */
    public void teachCustomRule(String userId, String triggerPhrase, String responseText) throws Exception {
        PersonalAiBrain brain = getOrCreateBrain(userId);
        Map<String, String> rules = objectMapper.readValue(brain.getCustomRulesJson(), stringMapType);
        rules.put(triggerPhrase.trim().toLowerCase(), responseText.trim());
        brain.setCustomRulesJson(objectMapper.writeValueAsString(rules));
        brain.setInteractionCount(brain.getInteractionCount() + 1);
        saveBrain(brain);
    }

    public Map<String, String> getCustomRules(String userId) {
        try {
            PersonalAiBrain brain = getOrCreateBrain(userId);
            return objectMapper.readValue(brain.getCustomRulesJson(), stringMapType);
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public void incrementInteraction(String userId) {
        try {
            PersonalAiBrain brain = getOrCreateBrain(userId);
            brain.setInteractionCount(brain.getInteractionCount() + 1);
            saveBrain(brain);
        } catch (Exception ignored) {}
    }
}