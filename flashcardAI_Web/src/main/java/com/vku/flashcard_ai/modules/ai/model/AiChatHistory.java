package com.vku.flashcard_ai.modules.ai.model;

public class AiChatHistory {
    private String chatId;
    private String userId;
    private String groupId; 
    private String title;   
    private String topicId; 
    private String messagesJson; // Lưu chuỗi JSON chứa các tin nhắn trò chuyện
    private long updatedAt;

    public AiChatHistory() {}

    // Getters và Setters
    public String getChatId() { return chatId; }
    public void setChatId(String chatId) { this.chatId = chatId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getGroupId() { return groupId; }
    public void setGroupId(String groupId) { this.groupId = groupId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getTopicId() { return topicId; }
    public void setTopicId(String topicId) { this.topicId = topicId; }
    public String getMessagesJson() { return messagesJson; }
    public void setMessagesJson(String messagesJson) { this.messagesJson = messagesJson; }
    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}