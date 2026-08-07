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
        String generatedId = UUID.randomUUID().toString();
        user.setUserId(generatedId); // Gán chuỗi ID ngẫu nhiên làm userId bảo mật
        user.setCreatedAt(System.currentTimeMillis());
        if (user.getAvatarKey() == null) {
            user.setAvatarKey("avatar_1");
        }

        db.collection(COLLECTION_NAME).document(generatedId).set(user);
        return "User registered successfully!";
    }
}