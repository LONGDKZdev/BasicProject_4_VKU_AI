package com.vku.flashcard_ai.modules.auth;

public class ChangePasswordDTO {
    private String currentPassword;
    private String newPassword;

    public ChangePasswordDTO() {}

    public String getCurrentPassword() { return currentPassword; }
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}