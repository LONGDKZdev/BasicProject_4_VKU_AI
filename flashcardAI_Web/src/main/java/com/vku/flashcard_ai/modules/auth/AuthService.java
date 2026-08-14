package com.vku.flashcard_ai.modules.auth;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;

    public AuthService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    public UserAccount getUserProfile(String username) {
        return userAccountRepository.findByUsername(username);
    }

    /**
     * Đăng ký người dùng mới
     */
    public void register(UserAccount user) throws Exception {
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            throw new Exception("Tên đăng nhập không được để trống!");
        }

        UserAccount existing = userAccountRepository.findByUsername(user.getUsername().trim());
        if (existing != null) {
            throw new Exception("Tên đăng nhập đã tồn tại!");
        }

        if (user.getUserId() == null || user.getUserId().isEmpty()) {
            user.setUserId(UUID.randomUUID().toString());
        }
        if (user.getAvatarKey() == null || user.getAvatarKey().isEmpty()) {
            user.setAvatarKey("avatar_0");
        }

        userAccountRepository.save(user);
    }

    /**
     * Đặt lại mật khẩu mới trực tiếp (Reset Password)
     */
    public void resetPasswordDirectly(String username, String newPassword) throws Exception {
        UserAccount account = getUserProfile(username);
        if (account == null) {
            throw new Exception("Tài khoản không tồn tại!");
        }

        // 1. Cập nhật mật khẩu dạng chuỗi thuần vào Firestore
        account.setPassword(newPassword);
        userAccountRepository.save(account);

        // 2. Đồng bộ mật khẩu mới sang Firebase Authentication nếu tài khoản có email
        try {
            if (account.getEmail() != null && !account.getEmail().trim().isEmpty()) {
                UserRecord userRecord = FirebaseAuth.getInstance().getUserByEmail(account.getEmail().trim());
                if (userRecord != null) {
                    UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(userRecord.getUid())
                            .setPassword(newPassword);
                    FirebaseAuth.getInstance().updateUser(request);
                    System.out.println("✅ Đã đồng bộ mật khẩu mới lên Firebase Auth cho UID: " + userRecord.getUid());
                }
            }
        } catch (Exception ex) {
            System.err.println("⚠️ Cảnh báo Firebase Auth: " + ex.getMessage());
        }
    }

    /**
     * Đổi mật khẩu trong trang Cài đặt (Settings)
     */
    public void changePassword(String username, String currentPassword, String newPassword) throws Exception {
        UserAccount account = getUserProfile(username);
        if (account == null) {
            throw new Exception("Tài khoản không tồn tại!");
        }

        if (!account.getPassword().equals(currentPassword)) {
            throw new Exception("Mật khẩu hiện tại không chính xác!");
        }

        account.setPassword(newPassword);
        userAccountRepository.save(account);

        try {
            if (account.getEmail() != null && !account.getEmail().trim().isEmpty()) {
                UserRecord userRecord = FirebaseAuth.getInstance().getUserByEmail(account.getEmail().trim());
                if (userRecord != null) {
                    UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(userRecord.getUid())
                            .setPassword(newPassword);
                    FirebaseAuth.getInstance().updateUser(request);
                    System.out.println("✅ Đã đồng bộ đổi mật khẩu lên Firebase Auth thành công.");
                }
            }
        } catch (Exception ex) {
            System.err.println("⚠️ Cảnh báo Firebase Auth: " + ex.getMessage());
        }
    }

    /**
     * Cập nhật Profile (Email, Avatar)
     */
    public void updateProfile(String username, String email, String avatarKey) throws Exception {
        UserAccount account = getUserProfile(username);
        if (account == null) {
            throw new Exception("Tài khoản không tồn tại!");
        }

        if (email != null) account.setEmail(email.trim());
        if (avatarKey != null) account.setAvatarKey(avatarKey);

        userAccountRepository.save(account);
    }
}