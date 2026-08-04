package com.vku.flashcard_ai.modules.auth;

public class UserAccount {
    private String userId;
    private String username;
    private String email;
    private String password;
    private String avatarKey; // Lưu key avatar mẫu (ví dụ: duo_fox, avatar_1)
    private long createdAt;

    public UserAccount() {}

    // Getters and Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getAvatarKey() { return avatarKey; }
    public void setAvatarKey(String avatarKey) { this.avatarKey = avatarKey; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}