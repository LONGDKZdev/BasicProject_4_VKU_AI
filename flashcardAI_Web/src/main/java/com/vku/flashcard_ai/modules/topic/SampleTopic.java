package com.vku.flashcard_ai.modules.topic;

public class SampleTopic {
    private String id;
    private String name;
    private String category;
    private String color;
    private String description;
    private int count;
    private String dataJson;

    public SampleTopic() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }

    public String getDataJson() { return dataJson; }
    public void setDataJson(String dataJson) { this.dataJson = dataJson; }
}