import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

// Import Firebase
import { db } from "../../config/firebase";
import { doc, updateDoc } from "firebase/firestore";

const COLORS = [
  "#4ade80",
  "#60a5fa",
  "#f472b6",
  "#facc15",
  "#f87171",
  "#a78bfa",
  "#34d399",
  "#fb923c",
  "#22d3ee",
  "#fbbf24",
];

export default function EditTopicScreen({ route, navigation }) {
  const { topic } = route.params || {};

  const [selectedColor, setSelectedColor] = useState(topic?.color || "#4ade80");
  const [dataJsonText, setDataJsonText] = useState(topic?.dataJson || "");
  const [validationMsg, setValidationMsg] = useState("");
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (topic?.dataJson && topic.dataJson !== "[]" && topic.dataJson !== "") {
      checkValidation(topic.dataJson);
    }
  }, []);

  const checkValidation = (text) => {
    if (!text || text.trim() === "") {
      setValidationMsg("");
      setIsValid(false);
      return false;
    }

    try {
      let cleanInput = text
        .replaceAll("```json", "")
        .replaceAll("```", "")
        .trim();
      const parsed = JSON.parse(cleanInput);

      if (Array.isArray(parsed) && parsed.length > 0) {
        setValidationMsg("✅ Dữ liệu JSON hợp lệ và sẵn sàng!");
        setIsValid(true);
        return true;
      } else {
        setValidationMsg("❌ Dữ liệu phải là một mảng JSON có chứa từ vựng!");
        setIsValid(false);
        return false;
      }
    } catch (error) {
      setValidationMsg(
        "❌ Cú pháp JSON không hợp lệ! Vui lòng kiểm tra lại dấu phẩy, ngoặc kép.",
      );
      setIsValid(false);
      return false;
    }
  };

  const handleCopyPrompt = async () => {
    const topicName = topic?.name || "Từ vựng";
    const topicCount = topic?.count || 10;

    const promptText = `Bạn hãy tạo ${topicCount} cặp thẻ flashcard cho chủ đề: "${topicName}".\n\nMỗi thẻ phải có cấu trúc dữ liệu sau:\nenglishVocabulary: Từ vựng tiếng Anh\nvietnameseVocabulary: Từ vựng tiếng Việt\nexample: Câu ví dụ chứa từ vựng bằng tiếng Anh và câu dịch tiếng Việt\npronunciation: Phiên âm quốc tế IPA (Ví dụ: /ˈbjuːtɪfl/)\nwordPos: Loại từ chính của từ vựng đó (Ví dụ: (n), (v), (adj), (adv))\n\nYÊU CẦU BẮT BUỘC: \n1. Trả về DỮ LIỆU JSON THUẦN. Tuyệt đối KHÔNG viết thêm bất kỳ lời giải thích, lời mở đầu hoặc lời kết nào ngoài khối JSON.\n2. ĐA DẠNG LOẠI TỪ: Danh sách từ vựng BẮT BUỘC phải có sự phân bổ đồng đều giữa Danh từ (n), Động từ (v), Tính từ (adj) và Trạng từ (adv). Tuyệt đối không chỉ liệt kê mỗi danh từ.\n\nĐịnh dạng mẫu:\n[\n  {\n    "englishVocabulary": "Beautiful",\n    "vietnameseVocabulary": "Xinh đẹp",\n    "example": "She has a beautiful smile. Dịch: Cô ấy có nụ cười xinh đẹp.",\n    "pronunciation": "/ˈbjuːtɪfl/",\n    "wordPos": "(adj)"\n  }\n]`;

    await Clipboard.setStringAsync(promptText);
    Alert.alert("Thành công", "Đã sao chép câu lệnh Prompt vào bộ nhớ đệm!");
  };

  // LƯU DỮ LIỆU LÊN FIREBASE
  const handleConfirm = async () => {
    // Trường hợp cố tình xóa sạch Text
    if (!dataJsonText || dataJsonText.trim() === "") {
      try {
        await updateDoc(doc(db, "topics", topic.topicId), {
          color: selectedColor,
          dataJson: "[]",
          count: 0,
        });
        Alert.alert("Thành công", "Đã lưu màu sắc và làm rỗng chủ đề!");
        navigation.goBack();
      } catch (error) {
        Alert.alert("Lỗi", "Không thể lưu vào cơ sở dữ liệu.");
      }
      return;
    }

    const valid = checkValidation(dataJsonText);
    if (valid) {
      try {
        let cleanInput = dataJsonText
          .replaceAll("```json", "")
          .replaceAll("```", "")
          .trim();
        const parsed = JSON.parse(cleanInput);

        await updateDoc(doc(db, "topics", topic.topicId), {
          color: selectedColor,
          dataJson: JSON.stringify(parsed),
          count: parsed.length,
        });

        Alert.alert("Thành công", "Đã lưu dữ liệu JSON và màu sắc thành công!");
        navigation.goBack();
      } catch (error) {
        Alert.alert("Lỗi", "Không thể lưu vào cơ sở dữ liệu: " + error.message);
      }
    } else {
      Alert.alert(
        "Cảnh báo",
        "Dữ liệu JSON chưa hợp lệ, vui lòng kiểm tra lại.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fcf8f2" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Điều chỉnh chủ đề</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.topicNameText}>Bộ thẻ: {topic?.name}</Text>

        <Text style={styles.label}>Màu sắc bộ thẻ</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.colorScroll}
          contentContainerStyle={{ paddingVertical: 6, paddingHorizontal: 4 }}
        >
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorCircle,
                { backgroundColor: c },
                selectedColor === c && styles.colorSelected,
              ]}
              onPress={() => setSelectedColor(c)}
            />
          ))}
        </ScrollView>

        <Text style={styles.label}>Dữ liệu từ vựng (JSON)</Text>
        <TextInput
          style={styles.textArea}
          multiline={true}
          numberOfLines={12}
          placeholder="Hãy nhập prompt từ vựng của bạn"
          value={dataJsonText}
          onChangeText={(text) => {
            setDataJsonText(text);
            setValidationMsg("");
          }}
          textAlignVertical="top"
        />

        {validationMsg !== "" ? (
          <Text
            style={[
              styles.validationText,
              isValid ? styles.textSuccess : styles.textError,
            ]}
          >
            {validationMsg}
          </Text>
        ) : (
          <Text style={styles.validationEmpty}> </Text>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopyPrompt}>
          <Icon
            name="copy-outline"
            size={20}
            color="#0d6efd"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.copyBtnText}>Sao chép prompt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>Xác nhận</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fcf8f2" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 15 : 40,
    paddingBottom: 15,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#222" },
  content: { paddingHorizontal: 20 },
  topicNameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 20,
  },
  label: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 10 },
  colorScroll: {
    flexDirection: "row",
    marginBottom: 15,
  },
  colorCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 15,
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorSelected: {
    borderColor: "#333",
    transform: [{ scale: 1.15 }],
  },
  textArea: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    fontSize: 15,
    minHeight: 250,
    color: "#333",
  },
  validationText: { marginTop: 10, fontSize: 14, fontWeight: "600" },
  textSuccess: { color: "#198754" },
  textError: { color: "#dc3545" },
  validationEmpty: { marginTop: 10, fontSize: 14, height: 20 },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  copyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0e7ff",
    paddingVertical: 14,
    borderRadius: 10,
    marginRight: 10,
  },
  copyBtnText: { color: "#0d6efd", fontSize: 15, fontWeight: "bold" },
  confirmBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d6efd",
    paddingVertical: 14,
    borderRadius: 10,
    marginLeft: 10,
  },
  confirmBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});
