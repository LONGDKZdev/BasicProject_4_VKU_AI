package com.vku.flashcard_ai.modules.auth;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class AuthService {

    private static final String COLLECTION_NAME = "users";

    @SuppressWarnings("null")
    public String register(UserAccount user) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        user.setUserId(UUID.randomUUID().toString());
        user.setCreatedAt(System.currentTimeMillis());
        // Mặc định gán avatar mẫu nếu chưa chọn
        if (user.getAvatarKey() == null) {
            user.setAvatarKey("avatar_1");
        }

        db.collection(COLLECTION_NAME).document(user.getUserId()).set(user);
        return "User registered successfully!";
    }
}