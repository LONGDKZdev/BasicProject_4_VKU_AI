import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

// Import AuthContext & Firebase
import { AuthContext } from "../../store/authContext";
import { db } from "../../config/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

export default function HomeScreen({ navigation }) {
  const { currentUser, logout } = useContext(AuthContext);

  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicCount, setNewTopicCount] = useState("");

  // ================= LẤY DỮ LIỆU TỪ FIREBASE =================
  useEffect(() => {
    if (!currentUser?.userId) return;

    // Truy vấn lấy tất cả topics của user đang đăng nhập
    const q = query(
      collection(db, "topics"),
      where("userId", "==", currentUser.userId),
    );

    // Dùng onSnapshot để lắng nghe dữ liệu theo thời gian thực
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTopics = [];
        snapshot.forEach((doc) => {
          fetchedTopics.push(doc.data());
        });

        // Sắp xếp mảng theo orderIndex tăng dần
        fetchedTopics.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

        setTopics(fetchedTopics);
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi tải dữ liệu: ", error);
        Alert.alert("Lỗi", "Không thể lấy dữ liệu chủ đề từ máy chủ.");
        setLoading(false);
      },
    );

    // Hủy lắng nghe khi thoát màn hình
    return () => unsubscribe();
  }, [currentUser]);

  // ================= TẠO CHỦ ĐỀ TRÊN FIREBASE =================
  const generatePrompt = (topic, count) => {
    return `Bạn hãy tạo ${count} cặp thẻ flashcard cho chủ đề: "${topic}".\n\nMỗi thẻ phải có cấu trúc dữ liệu sau:\nenglishVocabulary: Từ vựng tiếng Anh\nvietnameseVocabulary: Từ vựng tiếng Việt\nexample: Câu ví dụ chứa từ vựng bằng tiếng Anh và câu dịch tiếng Việt\npronunciation: Phiên âm quốc tế IPA (Ví dụ: /ˈbjuːtɪfl/)\nwordPos: Loại từ chính của từ vựng đó (Ví dụ: (n), (v), (adj), (adv))\n\nYÊU CẦU BẮT BUỘC: \n1. Trả về DỮ LIỆU JSON THUẦN. Tuyệt đối KHÔNG viết thêm bất kỳ lời giải thích, lời mở đầu hoặc lời kết nào ngoài khối JSON.\n2. ĐA DẠNG LOẠI TỪ: Danh sách từ vựng BẮT BUỘC phải có sự phân bổ đồng đều giữa Danh từ (n), Động từ (v), Tính từ (adj) và Trạng từ (adv). Tuyệt đối không chỉ liệt kê mỗi danh từ.\n\nĐịnh dạng mẫu:\n[\n  {\n    "englishVocabulary": "Beautiful",\n    "vietnameseVocabulary": "Xinh đẹp",\n    "example": "She has a beautiful smile. Dịch: Cô ấy có nụ cười xinh đẹp.",\n    "pronunciation": "/ˈbjuːtɪfl/",\n    "wordPos": "(adj)"\n  }\n]`;
  };

  const handleAddTopic = async () => {
    if (!newTopicName.trim() || !newTopicCount.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tên chủ đề và số từ!");
      return false;
    }

    try {
      const newTopicId = Date.now().toString();
      const newTopicData = {
        topicId: newTopicId,
        userId: currentUser.userId,
        username: currentUser.username || "User",
        name: newTopicName,
        count: parseInt(newTopicCount) || 0,
        color: "#4ade80",
        orderIndex: topics.length, // Nối tiếp vào vị trí cuối
        dataJson: "[]",
        createdAt: Date.now(),
      };

      // Đẩy dữ liệu lên Firebase
      await setDoc(doc(db, "topics", newTopicId), newTopicData);
      return true;
    } catch (error) {
      console.error("Lỗi thêm topic:", error);
      Alert.alert("Lỗi", "Không thể tạo chủ đề lúc này!");
      return false;
    }
  };

  const handleCreateOnly = async () => {
    const success = await handleAddTopic();
    if (success) closeAddModal();
  };

  const handleCreateAndCopy = async () => {
    const success = await handleAddTopic();
    if (success) {
      const promptText = generatePrompt(newTopicName, newTopicCount);
      await Clipboard.setStringAsync(promptText);
      Alert.alert(
        "Thành công",
        "Đã tạo chủ đề và sao chép Prompt vào khay nhớ tạm!",
      );
      closeAddModal();
    }
  };

  // ================= XÓA CHỦ ĐỀ TRÊN FIREBASE =================
  const handleDeleteTopic = (topicId) => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa bộ flashcard này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "topics", topicId));
          } catch (error) {
            console.error("Lỗi xóa:", error);
            Alert.alert("Lỗi", "Không thể xóa chủ đề này.");
          }
        },
      },
    ]);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewTopicName("");
    setNewTopicCount("");
  };

  const renderTopicCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.cardContainer,
        { borderLeftColor: item.color || "#4ade80" },
      ]}
      onPress={() => navigation.navigate("Flashcard", { topic: item })}
    >
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardCount}>{item.count} từ vựng</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("EditTopic", { topic: item })}
        >
          <Text style={styles.editText}>Điều chỉnh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDeleteTopic(item.topicId)}
        >
          <Icon name="trash-outline" size={20} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0d6efd"
        translucent={true}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flashcard</Text>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => setShowMenu(true)}
        >
          <Icon name="person" size={24} color="#0d6efd" />
        </TouchableOpacity>
      </View>

      {/* DROPDOWN MENU */}
      <Modal visible={showMenu} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownMenu}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuUsernameText} numberOfLines={1}>
                  {currentUser?.username || "Tài khoản"}
                </Text>
              </View>
              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={async () => {
                  setShowMenu(false);
                  await logout(); // Xóa phiên đăng nhập
                  navigation.replace("Auth");
                }}
              >
                <Icon name="log-out-outline" size={18} color="#dc3545" />
                <Text style={[styles.menuText, { color: "#dc3545" }]}>
                  Đăng xuất
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* SUB-HEADER */}
      <View style={styles.subHeader}>
        <Text style={styles.sectionTitle}>Bộ flashcard của tôi:</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Icon name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* MODAL THÊM CHỦ ĐỀ */}
      <Modal visible={showAddModal} transparent={true} animationType="slide">
        <View style={styles.modalAddOverlay}>
          <View style={styles.modalAddContainer}>
            <Text style={styles.modalAddTitle}>Thêm bộ Flashcard</Text>

            <TextInput
              style={styles.inputField}
              placeholder="Nhập tên chủ đề..."
              value={newTopicName}
              onChangeText={setNewTopicName}
            />

            <TextInput
              style={styles.inputField}
              placeholder="Nhập số từ (VD: 20)..."
              value={newTopicCount}
              onChangeText={setNewTopicCount}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleCreateOnly}
            >
              <Text style={styles.primaryBtnText}>Tạo bộ flashcard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleCreateAndCopy}
            >
              <Icon
                name="copy-outline"
                size={18}
                color="#0d6efd"
                style={{ marginRight: 5 }}
              />
              <Text style={styles.secondaryBtnText}>Tạo / Sao chép prompt</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={closeAddModal}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DANH SÁCH DỮ LIỆU */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0d6efd"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={topics}
          keyExtractor={(item) => item.topicId}
          renderItem={renderTopicCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 50, color: "gray" }}>
              Chưa có chủ đề nào.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fcf8f2" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 50,
    paddingBottom: 16,
    backgroundColor: "#0d6efd",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: "#0d6efd",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#ffffff" },
  avatarBtn: {
    backgroundColor: "#fff",
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e0e7ff",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.15)" },
  dropdownMenu: {
    position: "absolute",
    top: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 65 : 75,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 6,
    width: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  menuHeader: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  menuUsernameText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  menuText: { fontSize: 15, marginLeft: 10, color: "#333", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 4 },
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 19, fontWeight: "bold", color: "#222" },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  modalAddOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalAddContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalAddTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 20,
  },
  inputField: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  primaryBtn: {
    backgroundColor: "#0d6efd",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  secondaryBtn: {
    flexDirection: "row",
    backgroundColor: "#e0e7ff",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  secondaryBtnText: { color: "#0d6efd", fontSize: 16, fontWeight: "bold" },
  cancelBtn: { alignItems: "center", paddingVertical: 10 },
  cancelBtnText: { color: "#dc3545", fontSize: 16, fontWeight: "bold" },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 14,
    borderRadius: 14,
    borderLeftWidth: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 4,
  },
  cardCount: { fontSize: 13, color: "#777" },
  cardActions: { flexDirection: "row", alignItems: "center" },
  actionBtn: { marginLeft: 16, padding: 4 },
  editText: { fontSize: 14, color: "#6c757d", textDecorationLine: "underline" },
});
