package com.vku.flashcard_ai.modules.flashcard;

public class Flashcard {
    private String englishVocabulary;
    private String vietnameseVocabulary;
    private String example;
    private String pronunciation;
    private String wordPos;

    public Flashcard() {}

    // Getters and Setters
    public String getEnglishVocabulary() { return englishVocabulary; }
    public void setEnglishVocabulary(String englishVocabulary) { this.englishVocabulary = englishVocabulary; }

    public String getVietnameseVocabulary() { return vietnameseVocabulary; }
    public void setVietnameseVocabulary(String vietnameseVocabulary) { this.vietnameseVocabulary = vietnameseVocabulary; }

    public String getExample() { return example; }
    public void setExample(String example) { this.example = example; }

    public String getPronunciation() { return pronunciation; }
    public void setPronunciation(String pronunciation) { this.pronunciation = pronunciation; }

    public String getWordPos() { return wordPos; }
    public void setWordPos(String wordPos) { this.wordPos = wordPos; }
}