package com.vku.flashcard_ai.modules.progress;

import java.util.List;

public class StudyProgress {
    private String progressId;
    private String userId;
    private String topicId;
    private List<Integer> completedRounds; // Ví dụ: [1, 2]
    private long lastStudiedDate;

    public StudyProgress() {}

    // Getters and Setters
    public String getProgressId() { return progressId; }
    public void setProgressId(String progressId) { this.progressId = progressId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTopicId() { return topicId; }
    public void setTopicId(String topicId) { this.topicId = topicId; }

    public List<Integer> getCompletedRounds() { return completedRounds; }
    public void setCompletedRounds(List<Integer> completedRounds) { this.completedRounds = completedRounds; }

    public long getLastStudiedDate() { return lastStudiedDate; }
    public void setLastStudiedDate(long lastStudiedDate) { this.lastStudiedDate = lastStudiedDate; }
}