package com.vku.flashcard_ai.modules.ai.engine;

import com.vku.flashcard_ai.modules.flashcard.Flashcard;
import com.vku.flashcard_ai.modules.topic.SampleTopic;
import com.vku.flashcard_ai.modules.topic.SampleTopicService;
import com.vku.flashcard_ai.modules.topic.TopicService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Pattern;

/**
 * Kho tri thức từ vựng độc lập theo từng người dùng:
 * - Giữ cố định kho từ vựng chuẩn nền tảng (Base Knowledge)
 * - Kết hợp động với kho tri thức riêng của từng tài khoản từ Firestore (Personal Brain)
 */
@Component
public class VocabularyKnowledgeBase {

    public static class KnowledgeEntry {
        private final String domainTags;
        private final Flashcard card;

        public KnowledgeEntry(String domainTags, String eng, String vie, String example, String ipa, String pos) {
            this.domainTags = domainTags;
            Flashcard fc = new Flashcard();
            fc.setEnglishVocabulary(eng);
            fc.setVietnameseVocabulary(vie);
            fc.setExample(example);
            fc.setPronunciation(ipa);
            fc.setWordPos(pos);
            this.card = fc;
        }

        public String getDomainTags() { return domainTags; }
        public Flashcard getCard() { return card; }
    }

    private final List<KnowledgeEntry> baseEntries = new CopyOnWriteArrayList<>();
    private final Set<String> baseDomains = Collections.synchronizedSet(new LinkedHashSet<>());
    private final SampleTopicService sampleTopicService;
    private final TopicService topicService;

    public VocabularyKnowledgeBase(SampleTopicService sampleTopicService, TopicService topicService) {
        this.sampleTopicService = sampleTopicService;
        this.topicService = topicService;
    }

    @PostConstruct
    public void initKnowledgeBase() {
        baseDomains.add("Toán học (Mathematics / Calculus / Algebra)");
        baseDomains.add("Vật lý đại cương (General Physics / Mechanics)");
        baseDomains.add("Công nghệ thông tin & Lập trình (IT / Software Engineering)");
        baseDomains.add("Du lịch & Khám phá (Travel & Tourism)");
        baseDomains.add("Kinh doanh & Công việc (Business & Workplace)");
        baseDomains.add("Từ vựng IELTS Học thuật & Môi trường (IELTS Band 7+)");
        baseDomains.add("Giao tiếp hàng ngày & Kỹ năng mềm (Daily Communication)");

        // 1. Toán học
        addBaseEntry("toan hoc mathematics calculus algebra giai tich dai so", "Derivative", "Đạo hàm", "The derivative measures how a function changes as its input changes. Dịch: Đạo hàm đo lường sự thay đổi của một hàm số khi đầu vào thay đổi.", "/dɪˈrɪv.ə.t̬ɪv/", "(n)");
        addBaseEntry("toan hoc mathematics calculus algebra giai tich dai so", "Integral", "Tích phân", "We use a definite integral to calculate the area under a curve. Dịch: Chúng ta sử dụng tích phân xác định để tính diện tích dưới đường cong.", "/ˈɪn.t̬ə.ɡrəl/", "(n)");
        addBaseEntry("toan hoc mathematics calculus algebra dai so", "Equation", "Phương trình", "Solve the quadratic equation for all real values of x. Dịch: Giải phương trình bậc hai cho tất cả các giá trị thực của x.", "/ɪˈkweɪ.ʒən/", "(n)");
        addBaseEntry("toan hoc mathematics calculus algebra", "Converge", "Hội tụ", "This infinite series will converge to a finite limit. Dịch: Chuỗi vô hạn này sẽ hội tụ về một giới hạn hữu hạn.", "/kənˈvɝːdʒ/", "(v)");
        addBaseEntry("toan hoc mathematics geometry statistics xac suat", "Asymptotic", "Tiệm cận", "The curve shows asymptotic behavior as x approaches infinity. Dịch: Đường cong thể hiện tính chất tiệm cận khi x tiến tới vô cực.", "/ˌæs.ɪmpˈtɑː.t̬ɪk/", "(adj)");
        addBaseEntry("toan hoc mathematics logic chung minh", "Theorem", "Định lý", "Pythagoras theorem is fundamental in Euclidean geometry. Dịch: Định lý Pythagoras là nền tảng trong hình học Euclid.", "/ˈθiː.ə.rəm/", "(n)");

        // 2. Vật lý đại cương
        addBaseEntry("vat ly dai cuong physics mechanics co hoc dien tu nhiet hoc", "Velocity", "Vận tốc", "Velocity is a vector quantity that includes both speed and direction. Dịch: Vận tốc là một đại lượng vectơ bao gồm cả tốc độ và hướng.", "/vəˈlɑː.sə.t̬i/", "(n)");
        addBaseEntry("vat ly dai cuong physics mechanics co hoc", "Acceleration", "Gia tốc", "Gravity causes a constant downward acceleration near Earth. Dịch: Trọng lực gây ra một gia tốc hướng xuống không đổi gần Trái Đất.", "/əkˌsel.əˈreɪ.ʃən/", "(n)");
        addBaseEntry("vat ly dai cuong physics mechanics co hoc", "Momentum", "Động lượng", "Total momentum is conserved in an isolated physical system. Dịch: Tổng động lượng được bảo toàn trong một hệ vật lý cô lập.", "/moʊˈmen.t̬əm/", "(n)");
        addBaseEntry("vat ly dai cuong physics electromagnetism dien tu", "Conductivity", "Độ dẫn điện", "Copper has extremely high electrical conductivity. Dịch: Đồng có độ dẫn điện cực kỳ cao.", "/ˌkɑːn.dʌkˈtɪv.ə.t̬i/", "(n)");
        addBaseEntry("vat ly dai cuong physics mechanics", "Oscillate", "Dao động", "A simple pendulum will oscillate back and forth smoothly. Dịch: Một con lắc đơn sẽ dao động qua lại một cách nhịp nhàng.", "/ˈɑː.sə.leɪt/", "(v)");
        addBaseEntry("vat ly dai cuong physics thermodynamics nhiet hoc", "Equilibrium", "Trạng thái cân bằng", "Thermal equilibrium occurs when two objects reach the same temperature. Dịch: Cân bằng nhiệt xảy ra khi hai vật đạt cùng một nhiệt độ.", "/ˌiː.kwəˈlɪb.ri.əm/", "(n)");

        // 3. Công nghệ thông tin
        addBaseEntry("cong nghe thong tin it software engineering phan mem lap trinh", "Algorithm", "Thuật toán", "An efficient algorithm reduces execution time significantly. Dịch: Một thuật toán hiệu quả giúp giảm đáng kể thời gian thực thi.", "/ˈæl.ɡə.rɪ.ðəm/", "(n)");
        addBaseEntry("cong nghe thong tin it software engineering phan mem lap trinh", "Concurrency", "Xử lý đồng thời", "Handling concurrency is essential in modern backend systems. Dịch: Xử lý đồng thời rất quan trọng trong các hệ thống backend hiện đại.", "/kənˈkɝː.ən.si/", "(n)");
        addBaseEntry("cong nghe thong tin it software engineering phan mem", "Deploy", "Triển khai hệ thống", "We will deploy the updated web application tonight. Dịch: Chúng tôi sẽ triển khai ứng dụng web đã cập nhật vào tối nay.", "/dɪˈplɔɪ/", "(v)");
        addBaseEntry("cong nghe thong tin it software engineering phan mem", "Scalable", "Có khả năng mở rộng", "Cloud infrastructure makes the database highly scalable. Dịch: Hạ tầng đám mây giúp cơ sở dữ liệu có khả năng mở rộng cao.", "/ˈskeɪ.lə.bəl/", "(adj)");
        addBaseEntry("cong nghe thong tin it software engineering phan mem", "Seamlessly", "Một cách mượt mà, liền mạch", "The mobile app syncs data seamlessly with Firestore. Dịch: Ứng dụng di động đồng bộ dữ liệu mượt mà với Firestore.", "/ˈsiːm.ləs.li/", "(adv)");
        addBaseEntry("cong nghe thong tin it software engineering bao mat", "Authenticate", "Xác thực danh tính", "Spring Security helps authenticate users before granting access. Dịch: Spring Security giúp xác thực người dùng trước khi cấp quyền truy cập.", "/ɑːˈθen.t̬ə.keɪt/", "(v)");

        // 4. Du lịch
        addBaseEntry("du lich travel tourism kham pha may bay khach san", "Itinerary", "Lịch trình chuyến đi", "We planned a detailed itinerary for our trip to Da Nang. Dịch: Chúng tôi đã lên một lịch trình chi tiết cho chuyến đi Đà Nẵng.", "/aɪˈtɪn.ə.rer.i/", "(n)");
        addBaseEntry("du lich travel tourism kham pha", "Embark", "Lên tàu, bắt đầu hành trình", "Passengers are ready to embark on the morning flight. Dịch: Hành khách đã sẵn sàng lên chuyến bay buổi sáng.", "/ɪmˈbɑːrk/", "(v)");
        addBaseEntry("du lich travel tourism kham pha", "Picturesque", "Đẹp như tranh vẽ", "Hoi An is famous for its picturesque ancient streets. Dịch: Hội An nổi tiếng với những con phố cổ đẹp như tranh vẽ.", "/ˌpɪk.tʃəˈresk/", "(adj)");
        addBaseEntry("du lich travel tourism kham pha", "Abroad", "Ở nước ngoài", "Studying abroad broadens your cultural perspective. Dịch: Du học ở nước ngoài mở rộng góc nhìn văn hóa của bạn.", "/əˈbrɑːd/", "(adv)");

        // 5. Kinh doanh
        addBaseEntry("kinh doanh business workplace cong viec van phong", "Negotiate", "Đàm phán, thương lượng", "Both companies agreed to negotiate a long-term contract. Dịch: Cả hai công ty đã đồng ý đàm phán một hợp đồng dài hạn.", "/nəˈɡoʊ.ʃi.eɪt/", "(v)");
        addBaseEntry("kinh doanh business workplace cong viec", "Revenue", "Doanh thu", "Annual revenue increased by twenty percent this year. Dịch: Doanh thu hàng năm đã tăng hai mươi phần trăm trong năm nay.", "/ˈrev.ə.nuː/", "(n)");
        addBaseEntry("kinh doanh business workplace cong viec", "Lucrative", "Sinh lời cao, béo bở", "Software outsourcing has become a lucrative industry. Dịch: Gia công phần mềm đã trở thành một ngành công nghiệp sinh lời cao.", "/ˈluː.krə.tɪv/", "(adj)");
        addBaseEntry("kinh doanh business workplace cong viec", "Collaborate", "Hợp tác, cộng tác", "Developers and designers collaborate closely on user experience. Dịch: Lập trình viên và nhà thiết kế hợp tác chặt chẽ về trải nghiệm người dùng.", "/kəˈlæb.ə.reɪt/", "(v)");

        // 6. IELTS
        addBaseEntry("ielts band 7 hoc thuat academic moi truong environment", "Ubiquitous", "Có mặt ở khắp mọi nơi", "Smartphones have become ubiquitous in modern society. Dịch: Điện thoại thông minh đã trở nên phổ biến khắp mọi nơi trong xã hội hiện đại.", "/juːˈbɪk.wə.t̬əs/", "(adj)");
        addBaseEntry("ielts band 7 hoc thuat academic moi truong environment", "Sustainable", "Bền vững", "Solar energy is a sustainable alternative to fossil fuels. Dịch: Năng lượng mặt trời là một giải pháp thay thế bền vững cho nhiên liệu hóa thạch.", "/səˈsteɪ.nə.bəl/", "(adj)");
        addBaseEntry("ielts band 7 hoc thuat academic moi truong", "Mitigate", "Giảm thiểu, làm dịu bớt", "Planting trees helps mitigate the effects of climate change. Dịch: Trồng cây giúp giảm thiểu tác động của biến đổi khí hậu.", "/ˈmɪt̬.ə.ɡeɪt/", "(v)");
        addBaseEntry("ielts band 7 hoc thuat academic giao duc education", "Curriculum", "Chương trình giảng dạy", "Artificial intelligence is now part of the university curriculum. Dịch: Trí tuệ nhân tạo hiện là một phần của chương trình giảng dạy đại học.", "/kəˈrɪk.jə.ləm/", "(n)");
        addBaseEntry("ielts band 7 hoc thuat academic giao tiep", "Eloquent", "Hùng biện, lưu loát", "She gave an eloquent presentation during the defense. Dịch: Cô ấy đã có một bài thuyết trình lưu loát trong buổi bảo vệ.", "/ˈel.ə.kwənt/", "(adj)");

        // 7. Giao tiếp
        addBaseEntry("giao tiep daily communication doi song ky nang", "Resilience", "Khả năng phục hồi, kiên cường", "Building mental resilience helps overcome academic pressure. Dịch: Xây dựng sự kiên cường tinh thần giúp vượt qua áp lực học tập.", "/rɪˈzɪl.jəns/", "(n)");
        addBaseEntry("giao tiep daily communication doi song", "Adaptability", "Khả năng thích ứng", "Adaptability is a key skill in a fast-changing world. Dịch: Khả năng thích ứng là kỹ năng then chốt trong một thế giới thay đổi nhanh.", "/əˌdæp.təˈbɪl.ə.ti/", "(n)");
        addBaseEntry("giao tiep daily communication doi song", "Accomplish", "Hoàn thành, đạt được", "Setting daily goals helps you accomplish big projects. Dịch: Đặt mục tiêu hàng ngày giúp bạn hoàn thành các dự án lớn.", "/əˈkɑːm.plɪʃ/", "(v)");

        try {
            List<SampleTopic> samples = sampleTopicService.getAllSampleTopics();
            if (samples != null) {
                for (SampleTopic st : samples) {
                    if (st.getName() != null && !st.getName().trim().isEmpty()) {
                        baseDomains.add(st.getName().trim());
                    }
                    List<Flashcard> cards = topicService.parseFlashcardList(st.getDataJson());
                    String tags = (st.getName() != null ? st.getName() : "") + " " + (st.getCategory() != null ? st.getCategory() : "");
                    for (Flashcard fc : cards) {
                        if (fc.getEnglishVocabulary() != null && !containsBaseWord(fc.getEnglishVocabulary())) {
                            addBaseEntry(tags, fc.getEnglishVocabulary(), fc.getVietnameseVocabulary(), fc.getExample(), fc.getPronunciation(), fc.getWordPos());
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    public List<String> getAvailableDomains() {
        return new ArrayList<>(baseDomains);
    }

    public int getBaseVocabularyCount() {
        return baseEntries.size();
    }

    private void addBaseEntry(String tags, String eng, String vie, String example, String ipa, String pos) {
        baseEntries.add(new KnowledgeEntry(normalizeText(tags + " " + eng + " " + vie), eng, vie, example, ipa, pos));
    }

    private boolean containsBaseWord(String engWord) {
        String key = engWord.trim().toLowerCase();
        return baseEntries.stream().anyMatch(e -> e.getCard().getEnglishVocabulary().trim().toLowerCase().equals(key));
    }

    /**
     * Kết hợp kho nền tảng + kho tri thức riêng của từng user trên Firestore để tính Cosine Similarity & giải CSP
     */
    public List<Flashcard> searchWithCspAndCosine(String topicQuery, int requestedCount, Set<String> excludedWords, List<Flashcard> personalCards) {
        int targetCount = Math.max(1, Math.min(requestedCount, 20));
        List<String> queryTokens = tokenize(topicQuery);

        // Hợp nhất kho gốc và kho cá nhân của riêng user này (không ảnh hưởng user khác)
        List<KnowledgeEntry> combinedEntries = new ArrayList<>(baseEntries);
        if (personalCards != null) {
            for (Flashcard pc : personalCards) {
                if (pc.getEnglishVocabulary() == null) continue;
                String tags = normalizeText(pc.getEnglishVocabulary() + " "
                        + (pc.getVietnameseVocabulary() != null ? pc.getVietnameseVocabulary() : "") + " "
                        + (pc.getExample() != null ? pc.getExample() : ""));
                combinedEntries.add(new KnowledgeEntry(
                        tags,
                        pc.getEnglishVocabulary(),
                        pc.getVietnameseVocabulary(),
                        pc.getExample(),
                        pc.getPronunciation(),
                        pc.getWordPos()
                ));
            }
        }

        List<ScoredEntry> scoredList = new ArrayList<>();
        Map<String, Double> idfMap = computeIdf(combinedEntries);
        Map<String, Double> queryVec = buildTfIdfVector(queryTokens, idfMap);

        for (KnowledgeEntry entry : combinedEntries) {
            String wordLower = entry.getCard().getEnglishVocabulary().trim().toLowerCase();
            if (excludedWords != null && excludedWords.contains(wordLower)) {
                continue;
            }

            List<String> docTokens = tokenize(entry.getDomainTags());
            Map<String, Double> docVec = buildTfIdfVector(docTokens, idfMap);
            double sim = cosineSimilarity(queryVec, docVec);
            scoredList.add(new ScoredEntry(entry.getCard(), sim));
        }

        Collections.shuffle(scoredList);
        scoredList.sort((a, b) -> Double.compare(b.score, a.score));

        List<ScoredEntry> positiveMatches = new ArrayList<>();
        for (ScoredEntry se : scoredList) {
            if (se.score > 0.01) positiveMatches.add(se);
        }
        List<ScoredEntry> pool = positiveMatches.size() >= targetCount ? positiveMatches : scoredList;

        String[] posOrder = {"(n)", "(v)", "(adj)", "(adv)"};
        List<Flashcard> selected = new ArrayList<>();
        Set<String> pickedWords = new HashSet<>();

        int candidatePoolSize = Math.min(pool.size(), Math.max(targetCount * 2, 10));
        List<ScoredEntry> topCandidates = pool.subList(0, candidatePoolSize);

        int posIdx = 0;
        while (selected.size() < targetCount && selected.size() < topCandidates.size()) {
            String desiredPos = posOrder[posIdx % posOrder.length];
            boolean foundForPos = false;

            for (ScoredEntry cand : topCandidates) {
                String w = cand.card.getEnglishVocabulary().toLowerCase();
                String pos = (cand.card.getWordPos() != null) ? cand.card.getWordPos().toLowerCase() : "";
                if (!pickedWords.contains(w) && pos.contains(desiredPos.replace("(", "").replace(")", ""))) {
                    selected.add(cand.card);
                    pickedWords.add(w);
                    foundForPos = true;
                    break;
                }
            }

            if (!foundForPos) {
                for (ScoredEntry cand : topCandidates) {
                    String w = cand.card.getEnglishVocabulary().toLowerCase();
                    if (!pickedWords.contains(w)) {
                        selected.add(cand.card);
                        pickedWords.add(w);
                        break;
                    }
                }
            }
            posIdx++;
        }

        return selected;
    }

    public Flashcard lookupExactOrClosestWord(String queryText, List<Flashcard> personalCards) {
        String normalizedQuery = normalizeText(queryText);

        if (personalCards != null) {
            for (Flashcard pc : personalCards) {
                if (pc.getEnglishVocabulary() == null) continue;
                String eng = pc.getEnglishVocabulary().trim().toLowerCase();
                if (normalizedQuery.matches(".*\\b" + Pattern.quote(eng) + "\\b.*")) {
                    return pc;
                }
            }
        }

        for (KnowledgeEntry entry : baseEntries) {
            String eng = entry.getCard().getEnglishVocabulary().trim().toLowerCase();
            if (normalizedQuery.matches(".*\\b" + Pattern.quote(eng) + "\\b.*")) {
                return entry.getCard();
            }
        }

        List<Flashcard> nearest = searchWithCspAndCosine(queryText, 1, Collections.emptySet(), personalCards);
        return nearest.isEmpty() ? null : nearest.get(0);
    }

    private Map<String, Double> computeIdf(List<KnowledgeEntry> corpus) {
        Map<String, Integer> df = new HashMap<>();
        int totalDocs = Math.max(1, corpus.size());

        for (KnowledgeEntry entry : corpus) {
            Set<String> uniqueTokens = new HashSet<>(tokenize(entry.getDomainTags()));
            for (String token : uniqueTokens) {
                df.put(token, df.getOrDefault(token, 0) + 1);
            }
        }

        Map<String, Double> idf = new HashMap<>();
        for (Map.Entry<String, Integer> e : df.entrySet()) {
            idf.put(e.getKey(), Math.log((double) (totalDocs + 1) / (e.getValue() + 1)) + 1.0);
        }
        return idf;
    }

    private Map<String, Double> buildTfIdfVector(List<String> tokens, Map<String, Double> idfMap) {
        Map<String, Integer> tf = new HashMap<>();
        for (String t : tokens) {
            tf.put(t, tf.getOrDefault(t, 0) + 1);
        }

        Map<String, Double> vec = new HashMap<>();
        for (Map.Entry<String, Integer> e : tf.entrySet()) {
            double idf = idfMap.getOrDefault(e.getKey(), 1.0);
            vec.put(e.getKey(), e.getValue() * idf);
        }
        return vec;
    }

    private double cosineSimilarity(Map<String, Double> v1, Map<String, Double> v2) {
        if (v1.isEmpty() || v2.isEmpty()) return 0.0;

        double dot = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;

        for (Map.Entry<String, Double> e : v1.entrySet()) {
            double val1 = e.getValue();
            norm1 += val1 * val1;
            if (v2.containsKey(e.getKey())) {
                dot += val1 * v2.get(e.getKey());
            }
        }

        for (double val2 : v2.values()) {
            norm2 += val2 * val2;
        }

        if (norm1 == 0.0 || norm2 == 0.0) return 0.0;
        return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    private List<String> tokenize(String text) {
        String clean = normalizeText(text);
        if (clean.isEmpty()) return Collections.emptyList();
        return Arrays.asList(clean.split("\\s+"));
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text.toLowerCase(), Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized).replaceAll("")
                .replace('đ', 'd')
                .replaceAll("[^a-z0-9\\s]", " ")
                .trim();
    }

    private static class ScoredEntry {
        final Flashcard card;
        final double score;

        ScoredEntry(Flashcard card, double score) {
            this.card = card;
            this.score = score;
        }
    }
}