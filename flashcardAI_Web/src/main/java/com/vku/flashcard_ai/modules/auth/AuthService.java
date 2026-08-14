package com.vku.flashcard_ai.modules.auth;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
@SuppressWarnings("null")
public class AuthService {

    private static final String COLLECTION_NAME = "users";

    public String register(UserAccount user) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        String generatedId = UUID.randomUUID().toString();
        user.setUserId(generatedId);
        user.setCreatedAt(System.currentTimeMillis());
        if (user.getAvatarKey() == null || user.getAvatarKey().isEmpty()) {
            user.setAvatarKey("avatar_1");
        }

        db.collection(COLLECTION_NAME).document(generatedId).set(user);
        return "User registered successfully!";
    }

    public UserAccount getUserProfile(String username) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        List<QueryDocumentSnapshot> docs = db.collection(COLLECTION_NAME)
                .whereEqualTo("username", username)
                .get().get().getDocuments();

        if (!docs.isEmpty()) {
            UserAccount account = docs.get(0).toObject(UserAccount.class);
            account.setPassword(null); // Không gửi mật khẩu về frontend
            return account;
        }
        return null;
    }

    public void updateProfile(String username, String email, String avatarKey) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        List<QueryDocumentSnapshot> docs = db.collection(COLLECTION_NAME)
                .whereEqualTo("username", username)
                .get().get().getDocuments();

        if (!docs.isEmpty()) {
            DocumentReference docRef = docs.get(0).getReference();
            if (email != null && !email.trim().isEmpty()) {
                docRef.update("email", email.trim()).get();
            }
            if (avatarKey != null && !avatarKey.trim().isEmpty()) {
                docRef.update("avatarKey", avatarKey.trim()).get();
            }
        }
    }

    public void changePassword(String username, String currentPassword, String newPassword) throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        List<QueryDocumentSnapshot> docs = db.collection(COLLECTION_NAME)
                .whereEqualTo("username", username)
                .get().get().getDocuments();

        if (docs.isEmpty()) {
            throw new Exception("Không tìm thấy tài khoản!");
        }

        DocumentSnapshot userDoc = docs.get(0);
        String storedPassword = userDoc.getString("password");

        // Chuẩn hóa kiểm tra mật khẩu hiện tại
        String checkStored = storedPassword != null ? storedPassword.replace("{noop}", "") : "";
        if (!checkStored.equals(currentPassword)) {
            throw new Exception("Mật khẩu hiện tại không chính xác!");
        }

        userDoc.getReference().update("password", newPassword).get();
    }
}