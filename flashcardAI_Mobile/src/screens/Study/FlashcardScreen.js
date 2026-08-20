import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  StatusBar,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useAudioPlayer } from "expo-audio";

const { width } = Dimensions.get("window");

export default function FlashcardScreen({ route, navigation }) {
  const { topic } = route.params || {};
  const topicColor = topic?.color || "#84cc16"; // Lấy màu sắc từ Firebase
  const topicName = topic?.name || "Chủ đề test";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [showQuickSelect, setShowQuickSelect] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const currentIndexRef = useRef(currentIndex);
  const isFlippedRef = useRef(isFlipped);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const audioPlayer = useAudioPlayer(
    require("../../assets/sounds/flipcard.mp3"),
  );

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isFlippedRef.current = isFlipped;
  }, [isFlipped]);

  const playFlipSound = () => {
    if (audioPlayer) {
      audioPlayer.setPlaybackRate(2);
      audioPlayer.seekTo(0);
      audioPlayer.play();
    }
  };

  // PHÂN TÍCH DỮ LIỆU TỪ FIREBASE (Không dùng MOCK_DATA nữa)
  let vocabList = [];
  try {
    if (topic?.dataJson && topic.dataJson !== "[]" && topic.dataJson !== "") {
      const parsed = JSON.parse(topic.dataJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        vocabList = parsed;
      }
    }
  } catch (e) {
    console.error("Lỗi phân tích JSON", e);
  }

  // NẾU CHỦ ĐỀ TRỐNG THÌ HIỂN THỊ MÀN HÌNH THÔNG BÁO RỖNG
  if (vocabList.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: topicColor }]}
        edges={["top", "bottom"]}
      >
        <StatusBar barStyle="light-content" backgroundColor={topicColor} />
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Chủ đề: {topicName}
          </Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Icon
            name="folder-open-outline"
            size={80}
            color="#fff"
            style={{ opacity: 0.9, marginBottom: 15 }}
          />
          <Text style={styles.emptyTitle}>Chủ đề này chưa có từ vựng!</Text>
          <Text style={styles.emptySubtitle}>
            Hãy quay lại màn hình chính, chọn "Điều chỉnh" để dán dữ liệu JSON
            lấy từ AI vào nhé.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentWord = vocabList[currentIndex] || {};

  const flipCard = () => {
    playFlipSound();

    const currentFlippedState = isFlippedRef.current;

    Animated.spring(flipAnim, {
      toValue: currentFlippedState ? 0 : 180,
      tension: 60,
      friction: 7,
      useNativeDriver: true,
    }).start();

    setIsFlipped(!currentFlippedState);
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  const changeCard = (direction) => {
    const totalCards = vocabList.length;
    const prevIdx = currentIndexRef.current;
    let newIndex = prevIdx;

    if (direction === "next") {
      newIndex = (prevIdx + 1) % totalCards;
    } else if (direction === "prev") {
      newIndex = (prevIdx - 1 + totalCards) % totalCards;
    }

    if (newIndex !== prevIdx) {
      playFlipSound();
      setIsFlipped(false);
      flipAnim.setValue(0);
      setCurrentIndex(newIndex);
    }
  };

  const jumpToCard = (index) => {
    if (index !== currentIndex) {
      playFlipSound();
      setIsFlipped(false);
      flipAnim.setValue(0);
      setCurrentIndex(index);
    }
    setShowQuickSelect(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -50) {
          changeCard("next");
        } else if (gestureState.dx > 50) {
          changeCard("prev");
        }
      },
    }),
  ).current;

  const speakWord = () => {
    Speech.speak(currentWord.englishVocabulary || currentWord.english || "", {
      language: "en-US",
      rate: 0.9,
    });
  };

  let engExample = currentWord?.example || "";
  let vieExample = "";
  if (engExample.includes(". Dịch:")) {
    const parts = engExample.split(". Dịch:");
    engExample = parts[0].trim() + ".";
    vieExample = parts[1] ? parts[1].trim() : "";
  } else if (engExample.includes("Dịch:")) {
    const parts = engExample.split("Dịch:");
    engExample = parts[0].trim();
    vieExample = parts[1] ? parts[1].trim() : "";
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: topicColor }]}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle="light-content" backgroundColor={topicColor} />

      {/* HEADER CỐ ĐỊNH PHÍA TRÊN */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Chủ đề: {topicName}
        </Text>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* MODAL DANH SÁCH CHỌN NHANH */}
      <Modal visible={showQuickSelect} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowQuickSelect(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownTitle}>Chọn nhanh thẻ</Text>
                <ScrollView
                  style={{ maxHeight: 250 }}
                  showsVerticalScrollIndicator={true}
                >
                  {vocabList.map((card, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dropdownItem,
                        currentIndex === idx && styles.dropdownItemActive,
                      ]}
                      onPress={() => jumpToCard(idx)}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          currentIndex === idx && {
                            color: "#0d6efd",
                            fontWeight: "bold",
                          },
                        ]}
                      >
                        #{idx + 1} - {card.englishVocabulary}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MODAL HƯỚNG DẪN */}
      <Modal visible={showHelpModal} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowHelpModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.helpContainer}>
                <Text style={styles.modalTitle}>Hướng dẫn học</Text>

                <View style={styles.helpItem}>
                  <Icon name="hand-right-outline" size={26} color="#0d6efd" />
                  <Text style={styles.helpText}>
                    Chạm vào thẻ để lật sang mặt sau xem giải nghĩa.
                  </Text>
                </View>

                <View style={styles.helpItem}>
                  <Icon
                    name="swap-horizontal-outline"
                    size={26}
                    color="#0d6efd"
                  />
                  <Text style={styles.helpText}>
                    Vuốt màn hình sang trái/phải để chuyển sang thẻ khác.
                  </Text>
                </View>

                <View style={styles.helpItem}>
                  <Icon
                    name="volume-medium-outline"
                    size={26}
                    color="#0d6efd"
                  />
                  <Text style={styles.helpText}>
                    Ở mặt sau, nhấn vào biểu tượng loa để nghe phát âm tiếng
                    Anh.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeHelpBtn}
                  onPress={() => setShowHelpModal(false)}
                >
                  <Text style={styles.closeHelpBtnText}>Đã hiểu</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* VÙNG CHỨA THẺ */}
      <View style={styles.cardWrapper} {...panResponder.panHandlers}>
        <TouchableWithoutFeedback onPress={flipCard}>
          <View style={styles.touchArea}>
            {/* GD 1: MẶT TRƯỚC (ÚP) */}
            <Animated.View
              style={[
                styles.cardFace,
                {
                  opacity: frontOpacity,
                  transform: [{ rotateY: frontInterpolate }],
                },
              ]}
            >
              <View style={styles.frontCircle}>
                <Text
                  style={styles.frontText}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {currentWord.englishVocabulary}
                </Text>
              </View>
            </Animated.View>

            {/* GD 2: MẶT SAU (LẬT LÊN) */}
            <Animated.View
              style={[
                styles.cardFace,
                styles.cardBack,
                {
                  opacity: backOpacity,
                  transform: [{ rotateY: backInterpolate }],
                },
              ]}
            >
              <View style={styles.backCardContainer}>
                <View
                  style={[styles.wordTitleBox, { backgroundColor: topicColor }]}
                >
                  <Text style={styles.wordTitleText}>
                    {currentWord.englishVocabulary}{" "}
                    <Text style={{ fontSize: 18, opacity: 0.9 }}>
                      {currentWord.wordPos}
                    </Text>
                  </Text>
                </View>

                <Text style={styles.vietnameseText}>
                  {currentWord.vietnameseVocabulary}
                </Text>

                <TouchableOpacity
                  style={styles.pronounceRow}
                  activeOpacity={0.7}
                  onPress={speakWord}
                >
                  <Icon name="volume-medium" size={28} color="#333" />
                  <Text style={styles.pronounceText}>
                    {currentWord.pronunciation}
                  </Text>
                </TouchableOpacity>

                <View style={styles.exampleBox}>
                  <Text style={styles.exampleTitle}>Ví dụ:</Text>
                  <Text style={styles.exampleEng}>{engExample}</Text>
                  {vieExample ? (
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.exampleTitle}>Dịch nghĩa:</Text>
                      <Text style={styles.exampleVie}>{vieExample}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </View>

      {/* FOOTER CỐ ĐỊNH PHÍA DƯỚI */}
      <View style={styles.footer}>
        {/* Nút hiển thị số / menu sổ xuống */}
        <TouchableOpacity
          style={styles.bottomProgressBtn}
          onPress={() => setShowQuickSelect(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.bottomProgressText}>
            {currentIndex + 1} / {vocabList.length}
          </Text>
          <Icon
            name="chevron-up"
            size={18}
            color="#333"
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>

        {/* Nút Help (?) */}
        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() => setShowHelpModal(true)}
          activeOpacity={0.7}
        >
          <Icon name="help" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    zIndex: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
  },

  // Style cho giao diện Empty
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtitle: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    opacity: 0.9,
    lineHeight: 24,
  },

  // Nằm dưới cùng màn hình
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  bottomProgressBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  bottomProgressText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  helpBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },

  // Style Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 15,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemActive: {
    backgroundColor: "#e0e7ff",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },

  // Modal Help
  helpContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 20,
  },
  helpItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  helpText: {
    fontSize: 15,
    color: "#444",
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  closeHelpBtn: {
    marginTop: 15,
    backgroundColor: "#0d6efd",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeHelpBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Vùng chứa thẻ
  cardWrapper: { flex: 1 },
  touchArea: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cardFace: {
    position: "absolute",
    width: width,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "hidden",
  },
  frontCircle: {
    width: width * 0.75,
    height: width * 1.2,
    borderRadius: width * 0.5,
    backgroundColor: "#f0f2e5",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: -60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  frontText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
  cardBack: { justifyContent: "center", alignItems: "center" },
  backCardContainer: {
    width: "88%",
    height: "85%",
    backgroundColor: "#f0f2e5",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  wordTitleBox: {
    width: "90%",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 16,
    marginTop: 20,
    alignItems: "center",
  },
  wordTitleText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  vietnameseText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginTop: 30,
    textAlign: "center",
  },
  pronounceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pronounceText: { fontSize: 18, color: "#333", marginLeft: 8 },
  exampleBox: { width: "100%", marginTop: 40, alignItems: "flex-start" },
  exampleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  exampleEng: {
    fontSize: 18,
    color: "#333",
    fontStyle: "italic",
    lineHeight: 26,
  },
  exampleVie: { fontSize: 18, color: "#555", lineHeight: 26 },
});
