package com.vku.flashcard_ai.modules.ai.model;

public class PersonalAiBrain {
    private String brainId;
    private String userId;
    private String customKnowledgeJson;   // Kho từ vựng riêng AI đã học được của user này
    private String customRulesJson;       // Các quy tắc / mẫu câu user đã trực tiếp dạy cho AI
    private String wordWeightsJson;       // Trọng số độ khó / tần suất ôn tập từng từ của user
    private int interactionCount;         // Số lượt tương tác huấn luyện
    private long updatedAt;

    public PersonalAiBrain() {
    }

    public String getBrainId() { return brainId; }
    public void setBrainId(String brainId) { this.brainId = brainId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getCustomKnowledgeJson() { return customKnowledgeJson; }
    public void setCustomKnowledgeJson(String customKnowledgeJson) { this.customKnowledgeJson = customKnowledgeJson; }

    public String getCustomRulesJson() { return customRulesJson; }
    public void setCustomRulesJson(String customRulesJson) { this.customRulesJson = customRulesJson; }

    public String getWordWeightsJson() { return wordWeightsJson; }
    public void setWordWeightsJson(String wordWeightsJson) { this.wordWeightsJson = wordWeightsJson; }

    public int getInteractionCount() { return interactionCount; }
    public void setInteractionCount(int interactionCount) { this.interactionCount = interactionCount; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}