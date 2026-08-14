package com.vku.flashcard_ai.modules.auth;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Repository;
import java.util.concurrent.ExecutionException;

@Repository
@SuppressWarnings("null")
public class UserAccountRepository {

    private static final String COLLECTION_NAME = "users";

    /**
     * Tìm kiếm người dùng theo username trong Firestore
     */
    public UserAccount findByUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            return null;
        }

        try {
            Firestore db = FirestoreClient.getFirestore();
            QuerySnapshot querySnapshot = db.collection(COLLECTION_NAME)
                    .whereEqualTo("username", username.trim())
                    .get()
                    .get();

            if (!querySnapshot.isEmpty()) {
                DocumentSnapshot document = querySnapshot.getDocuments().get(0);
                UserAccount account = document.toObject(UserAccount.class);
                if (account != null && (account.getUserId() == null || account.getUserId().isEmpty())) {
                    account.setUserId(document.getId());
                }
                return account;
            }
        } catch (InterruptedException | ExecutionException e) {
            System.err.println("❌ Lỗi truy vấn Firestore cho user " + username + ": " + e.getMessage());
            Thread.currentThread().interrupt();
        }
        return null;
    }

    /**
     * Lưu hoặc cập nhật thông tin người dùng vào đúng Document trong Firestore
     */
    public void save(UserAccount user) throws Exception {
        if (user == null || user.getUsername() == null) {
            throw new IllegalArgumentException("Dữ liệu người dùng không hợp lệ!");
        }

        Firestore db = FirestoreClient.getFirestore();
        
        // 1. Kiểm tra xem user này đã có document trong Firestore chưa
        QuerySnapshot querySnapshot = db.collection(COLLECTION_NAME)
                .whereEqualTo("username", user.getUsername().trim())
                .get()
                .get();

        DocumentReference docRef;
        if (!querySnapshot.isEmpty()) {
            // Cập nhật đúng document đang tồn tại
            docRef = querySnapshot.getDocuments().get(0).getReference();
        } else {
            // Tạo mới document bằng username hoặc userId
            String docId = (user.getUserId() != null && !user.getUserId().isEmpty()) ? user.getUserId() : user.getUsername().trim();
            docRef = db.collection(COLLECTION_NAME).document(docId);
        }

        if (user.getCreatedAt() == 0) {
            user.setCreatedAt(System.currentTimeMillis());
        }

        ApiFuture<WriteResult> result = docRef.set(user, SetOptions.merge());
        result.get(); // Chờ hoàn tất ghi dữ liệu
        System.out.println("✅ Đã lưu cập nhật user [" + user.getUsername() + "] vào Firestore thành công!");
    }
}