package com.vku.flashcard_ai.modules.progress;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
@SuppressWarnings("null")
public class ProgressService {

    private static final String COLLECTION_NAME = "study_progress";

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

    public StudyProgress getProgress(String username, String topicId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        String realUserId = getUserIdByUsername(username);
        String progressId = realUserId + "_" + topicId;

        DocumentSnapshot doc = db.collection(COLLECTION_NAME).document(progressId).get().get();
        if (doc.exists()) {
            StudyProgress progress = doc.toObject(StudyProgress.class);
            if (progress != null) {
                if (progress.getCompletedRounds() == null) {
                    progress.setCompletedRounds(new ArrayList<>());
                }
                return progress;
            }
        }

        StudyProgress emptyProgress = new StudyProgress();
        emptyProgress.setProgressId(progressId);
        emptyProgress.setUserId(realUserId);
        emptyProgress.setTopicId(topicId);
        emptyProgress.setCompletedRounds(new ArrayList<>());
        emptyProgress.setLastStudiedDate(0L);
        return emptyProgress;
    }

    public StudyProgress completeRound(String username, String topicId, int round) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        String realUserId = getUserIdByUsername(username);
        String progressId = realUserId + "_" + topicId;

        StudyProgress progress = getProgress(username, topicId);
        List<Integer> rounds = progress.getCompletedRounds();
        if (rounds == null) {
            rounds = new ArrayList<>();
        }
        if (!rounds.contains(round)) {
            rounds.add(round);
            rounds.sort(Integer::compareTo);
        }

        progress.setProgressId(progressId);
        progress.setUserId(realUserId);
        progress.setTopicId(topicId);
        progress.setCompletedRounds(rounds);
        progress.setLastStudiedDate(System.currentTimeMillis());

        db.collection(COLLECTION_NAME).document(progressId).set(progress).get();
        return progress;
    }

    public void resetProgress(String username, String topicId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        String realUserId = getUserIdByUsername(username);
        String progressId = realUserId + "_" + topicId;

        db.collection(COLLECTION_NAME).document(progressId).delete().get();
    }
}