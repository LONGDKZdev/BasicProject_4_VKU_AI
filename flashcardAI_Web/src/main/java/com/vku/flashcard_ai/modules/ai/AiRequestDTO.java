package com.vku.flashcard_ai.modules.ai;

public class AiRequestDTO {
    private String topicName;
    private int count;

    public AiRequestDTO() {}

    public String getTopicName() { return topicName; }
    public void setTopicName(String topicName) { this.topicName = topicName; }

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }
}