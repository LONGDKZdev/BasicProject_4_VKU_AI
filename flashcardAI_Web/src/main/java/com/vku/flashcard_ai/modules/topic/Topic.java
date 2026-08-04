package com.vku.flashcard_ai.modules.topic;

public class Topic {
    private String topicId;
    private String userId;
    private String name;
    private String color;
    private int count;
    private String dataJson; // Lưu toàn bộ mảng JSON từ vựng ở đây
    private long createdAt;

    public Topic() {}

    // Getters and Setters
    public String getTopicId() { return topicId; }
    public void setTopicId(String topicId) { this.topicId = topicId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }

    public String getDataJson() { return dataJson; }
    public void setDataJson(String dataJson) { this.dataJson = dataJson; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}