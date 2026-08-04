package com.vku.flashcard_ai.modules.auth;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Firestore dbFirestore = FirestoreClient.getFirestore();
        try {
            // Truy vấn trong collection "users" xem document nào có trường username == input
            Query query = dbFirestore.collection("users").whereEqualTo("username", username);
            ApiFuture<QuerySnapshot> querySnapshot = query.get();
            List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();

            if (documents.isEmpty()) {
                throw new UsernameNotFoundException("Không tìm thấy tài khoản: " + username);
            }

            // Lấy document đầu tiên tìm thấy
            DocumentSnapshot document = documents.get(0);
            String password = document.getString("password"); // Mật khẩu lưu trong DB
            
            // Xử lý mật khẩu (nếu trong DB bạn lưu mật khẩu thô như "123456", ta cần mã hóa BCrypt hoặc dùng NoOp)
            // Tạm thời nếu lưu mật khẩu thô, ta dùng {noop} phía trước để Spring Security nhận diện không mã hóa
            if (password != null && !password.startsWith("{")) {
                password = "{noop}" + password; 
            }

            return User.builder()
                    .username(username)
                    .password(password)
                    .roles("USER")
                    .build();

        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Lỗi kết nối Firebase khi xác thực: " + e.getMessage());
        }
    }
}