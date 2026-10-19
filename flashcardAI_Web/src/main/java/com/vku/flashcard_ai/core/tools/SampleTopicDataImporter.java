package com.vku.flashcard_ai.core.tools;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vku.flashcard_ai.modules.topic.SampleTopic;
import com.vku.flashcard_ai.modules.topic.SampleTopicService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Component
public class SampleTopicDataImporter implements CommandLineRunner {

    private final SampleTopicService sampleTopicService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SampleTopicDataImporter(SampleTopicService sampleTopicService) {
        this.sampleTopicService = sampleTopicService;
    }

    @Override
    public void run(String... args) {
        try {
            // Đọc trực tiếp từ file sample_topics.json và đẩy thẳng lên Firestore
            InputStream is = new ClassPathResource("sample_topics.json").getInputStream();
            List<SampleTopic> sampleTopics = objectMapper.readValue(is, new TypeReference<List<SampleTopic>>() {});

            if (sampleTopics != null && !sampleTopics.isEmpty()) {
                for (SampleTopic topic : sampleTopics) {
                    sampleTopicService.saveSampleTopic(topic);
                }
                System.out.println("🔥 >>> Đã tự động đẩy " + sampleTopics.size() + " chủ đề mẫu lên Firestore thành công!");
            }
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi tự động import dữ liệu mẫu: " + e.getMessage());
        }
    }
}