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
  ScrollView,
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
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";

const AVATAR_MAP = {
  avatar_0: "👤",
  avatar_1: "🦊",
  avatar_2: "🐱",
  avatar_3: "🦉",
  avatar_4: "🤖",
  avatar_5: "🐼",
  avatar_6: "🦁",
  avatar_7: "🐯",
  avatar_8: "🐶",
  avatar_9: "🦄",
  avatar_10: "🐧",
  avatar_11: "🐸",
  avatar_12: "💀",
};

export default function HomeScreen({ navigation }) {
  const { currentUser, logout } = useContext(AuthContext);

  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  // Modal Thêm chủ đề mới (Thủ công)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicCount, setNewTopicCount] = useState("10");

  // Modal Thêm chủ đề mẫu có sẵn
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [sampleTopics, setSampleTopics] = useState([]);
  const [loadingPreset, setLoadingPreset] = useState(false);
  const [importingPresetId, setImportingPresetId] = useState(null);

  // ================= 1. LẮNG NGHE TOPICS CỦA USER THEO THỜI GIAN THỰC =================
  useEffect(() => {
    if (!currentUser?.userId) return;

    const q = query(
      collection(db, "topics"),
      where("userId", "==", currentUser.userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = [];
        snapshot.forEach((d) => {
          fetched.push(d.data());
        });

        // Sắp xếp giảm dần theo orderIndex (timestamp lớn nhất nằm trên cùng)
        fetched.sort((a, b) => (b.orderIndex || 0) - (a.orderIndex || 0));

        setTopics(fetched);
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi lắng nghe topics:", error);
        Alert.alert("Lỗi", "Không thể lấy dữ liệu chủ đề từ máy chủ.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // ================= 2. NẠP KHO CHỦ ĐỀ MẪU TỪ FIRESTORE =================
  const loadPresetTopics = async () => {
    setLoadingPreset(true);
    setShowPresetModal(true);
    try {
      const querySnapshot = await getDocs(collection(db, "sample_topics"));
      const list = [];
      querySnapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          ...data,
        });
      });
      setSampleTopics(list);
    } catch (err) {
      console.error("Lỗi lấy sample_topics:", err);
      Alert.alert("Lỗi", "Không thể nạp kho chủ đề mẫu lúc này.");
    } finally {
      setLoadingPreset(false);
    }
  };

  // ================= 3. XỬ LÝ NHẬP CHỦ ĐỀ MẪU (LỌC TRÙNG TỪ VỰNG NHƯ WEB) =================
  const handleImportPreset = async (sample) => {
    if (!sample || importingPresetId) return;

    setImportingPresetId(sample.id);

    try {
      const sampleNameTrimmed = (sample.name || "").trim().toLowerCase();
      const existingTopic = topics.find(
        (t) => (t.name || "").trim().toLowerCase() === sampleNameTrimmed
      );

      // Parse danh sách từ của chủ đề mẫu
      let sampleWords = [];
      try {
        let clean = (sample.dataJson || "[]").trim();
        if (!clean.startsWith("[")) clean = "[" + clean + "]";
        sampleWords = JSON.parse(clean);
      } catch (e) {
        sampleWords = [];
      }

      if (existingTopic) {
        // TRƯỜNG HỢP: ĐÃ CÓ CHỦ ĐỀ -> GỘP VÀ LỌC TRÙNG TỪ TIẾNG ANH
        let currentWords = [];
        try {
          let cleanExisting = (existingTopic.dataJson || "[]").trim();
          if (!cleanExisting.startsWith("[")) cleanExisting = "[" + cleanExisting + "]";
          currentWords = JSON.parse(cleanExisting);
        } catch (e) {
          currentWords = [];
        }

        const existingEngList = currentWords.map((w) =>
          (w.englishVocabulary || w.english || "").trim().toLowerCase()
        );

        const newValidWords = [];
        let duplicateCount = 0;

        sampleWords.forEach((item) => {
          const eng = (item.englishVocabulary || item.english || "").trim().toLowerCase();
          if (eng && existingEngList.includes(eng)) {
            duplicateCount++;
          } else {
            newValidWords.push(item);
            if (eng) existingEngList.push(eng);
          }
        });

        if (newValidWords.length === 0) {
          Alert.alert(
            "Thông báo",
            `Bộ thẻ "${sample.name}" đã có sẵn và tất cả từ vựng này đều đã tồn tại!`
          );
          setImportingPresetId(null);
          return;
        }

        const mergedList = [...currentWords, ...newValidWords];
        const now = Date.now();

        await updateDoc(doc(db, "topics", existingTopic.topicId), {
          dataJson: JSON.stringify(mergedList),
          count: mergedList.length,
          orderIndex: now, // Đẩy lên đầu danh sách
        });

        Alert.alert(
          "Thành công",
          `Đã chèn thêm ${newValidWords.length} từ mới vào bộ thẻ "${existingTopic.name}"${
            duplicateCount > 0 ? ` (Đã bỏ qua ${duplicateCount} từ bị trùng)` : ""
          }!`
        );
      } else {
        // TRƯỜNG HỢP: CHƯA CÓ CHỦ ĐỀ -> TẠO MỚI TOÀN BỘ
        const newTopicId = "topic_" + Date.now();
        const now = Date.now();

        const newTopicData = {
          topicId: newTopicId,
          userId: currentUser.userId,
          username: currentUser.username || "User",
          name: sample.name,
          color: sample.color || "#60a5fa",
          count: sampleWords.length,
          dataJson: sample.dataJson || "[]",
          orderIndex: now,
          createdAt: now,
        };

        await setDoc(doc(db, "topics", newTopicId), newTopicData);
        Alert.alert("Thành công", `Đã thêm bộ thẻ mẫu "${sample.name}" vào danh mục của bạn!`);
      }

      setShowPresetModal(false);
    } catch (err) {
      console.error("Lỗi import preset:", err);
      Alert.alert("Lỗi", "Không thể thêm chủ đề mẫu: " + err.message);
    } finally {
      setImportingPresetId(null);
    }
  };

  // ================= 4. TẠO CHỦ ĐỀ THỦ CÔNG =================
  const generatePrompt = (topic, count) => {
    return `Bạn hãy tạo ${count} cặp thẻ flashcard cho chủ đề: "${topic}".\n\nMỗi thẻ có cấu trúc dữ liệu JSON:\n{\n  "englishVocabulary": "Beautiful",\n  "vietnameseVocabulary": "Xinh đẹp",\n  "example": "She has a beautiful smile. Dịch: Cô ấy có nụ cười xinh đẹp.",\n  "pronunciation": "/ˈbjuːtɪfl/",\n  "wordPos": "(adj)"\n}\n\nYÊU CẦU BẮT BUỘC:\n1. Chỉ trả về CÁC OBJECT NGOẶC NHỌN {...} ngăn cách bằng dấu phẩy. KHÔNG bọc ngoặc vuông [...] ở ngoài.\n2. Phân bổ đồng đều loại từ (n), (v), (adj), (adv).`;
  };

  const handleAddTopic = async () => {
    if (!newTopicName.trim() || !newTopicCount.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên chủ đề và số lượng từ!");
      return false;
    }

    try {
      const newTopicId = "topic_" + Date.now();
      const now = Date.now();
      const newTopicData = {
        topicId: newTopicId,
        userId: currentUser.userId,
        username: currentUser.username || "User",
        name: newTopicName.trim(),
        count: parseInt(newTopicCount, 10) || 10,
        color: "#4ade80",
        orderIndex: now,
        dataJson: "[]",
        createdAt: now,
      };

      await setDoc(doc(db, "topics", newTopicId), newTopicData);
      return true;
    } catch (error) {
      console.error("Lỗi tạo topic:", error);
      Alert.alert("Lỗi", "Không thể tạo chủ đề lúc này!");
      return false;
    }
  };

  const handleCreateOnly = async () => {
    const success = await handleAddTopic();
    if (success) {
      setShowAddModal(false);
      setNewTopicName("");
      setNewTopicCount("10");
    }
  };

  const handleCreateAndCopy = async () => {
    const success = await handleAddTopic();
    if (success) {
      const promptText = generatePrompt(newTopicName, newTopicCount);
      await Clipboard.setStringAsync(promptText);
      Alert.alert("Thành công", "Đã tạo bộ thẻ và sao chép Prompt vào khay nhớ tạm!");
      setShowAddModal(false);
      setNewTopicName("");
      setNewTopicCount("10");
    }
  };

  // ================= 5. XÓA CHỦ ĐỀ =================
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
            console.error("Lỗi xóa topic:", error);
            Alert.alert("Lỗi", "Không thể xóa chủ đề này.");
          }
        },
      },
    ]);
  };

  // Lọc danh sách theo từ khóa tìm kiếm
  const filteredTopics = topics.filter((t) =>
    (t.name || "").toLowerCase().includes(searchKeyword.toLowerCase().trim())
  );

  const currentAvatarIcon = AVATAR_MAP[currentUser?.avatarKey] || "👤";

  // Render từng card Flashcard
  const renderTopicCard = ({ item }) => {
    let parsedCount = item.count || 0;
    let isValid = false;
    try {
      let clean = (item.dataJson || "[]").trim();
      if (!clean.startsWith("[")) clean = "[" + clean + "]";
      const arr = JSON.parse(clean);
      if (Array.isArray(arr) && arr.length > 0) {
        parsedCount = arr.length;
        isValid = true;
      }
    } catch (e) {
      isValid = false;
    }

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.cardContainer, { borderLeftColor: item.color || "#4ade80" }]}
        onPress={() => {
          if (isValid) {
            navigation.navigate("Flashcard", { topic: item });
          } else {
            Alert.alert(
              "Chưa có từ vựng",
              "Bộ thẻ này chưa có dữ liệu từ vựng hợp lệ. Hãy bấm 'Điều chỉnh' để dán dữ liệu JSON nhé!",
              [
                { text: "Để sau", style: "cancel" },
                { text: "Điều chỉnh ngay", onPress: () => navigation.navigate("EditTopic", { topic: item }) },
              ]
            );
          }
        }}
      >
        <View style={styles.cardInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            {isValid ? (
              <Icon name="checkmark-circle" size={18} color="#10b981" style={{ marginLeft: 6 }} />
            ) : (
              <Icon name="alert-circle" size={18} color="#f59e0b" style={{ marginLeft: 6 }} />
            )}
          </View>
          <Text style={styles.cardCount}>
            <Icon name="albums-outline" size={13} color="#777" /> {parsedCount} từ vựng
          </Text>
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
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0d6efd" translucent={true} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Flashcard AI</Text>
          <Text style={styles.headerSubtitle}>Học từ vựng thông minh</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => setShowMenu(true)}>
          <Text style={styles.avatarEmoji}>{currentAvatarIcon}</Text>
        </TouchableOpacity>
      </View>

      {/* DROPDOWN MENU TÀI KHOẢN */}
      <Modal visible={showMenu} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownMenu}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuUsernameText} numberOfLines={1}>
                  {currentUser?.username || "Tài khoản"}
                </Text>
                <Text style={styles.menuEmailText} numberOfLines={1}>
                  {currentUser?.email || ""}
                </Text>
              </View>
              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate("Profile");
                }}
              >
                <Icon name="person-circle-outline" size={20} color="#0d6efd" />
                <Text style={[styles.menuText, { color: "#0d6efd" }]}>Hồ sơ cá nhân</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={async () => {
                  setShowMenu(false);
                  await logout();
                  navigation.replace("Auth");
                }}
              >
                <Icon name="log-out-outline" size={20} color="#dc3545" />
                <Text style={[styles.menuText, { color: "#dc3545" }]}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* THANH TÌM KIẾM TỪ KHÓA */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Icon name="search-outline" size={18} color="#6c757d" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bộ từ vựng..."
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            placeholderTextColor="#94a3b8"
          />
          {searchKeyword ? (
            <TouchableOpacity onPress={() => setSearchKeyword("")}>
              <Icon name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* SUB-HEADER & 2 NÚT THÊM */}
      <View style={styles.subHeader}>
        <Text style={styles.sectionTitle}>Bộ thẻ ({filteredTopics.length})</Text>
        <View style={styles.actionButtonGroup}>
          <TouchableOpacity style={styles.presetBtn} onPress={loadPresetTopics}>
            <Icon name="library-outline" size={16} color="#0d6efd" style={{ marginRight: 4 }} />
            <Text style={styles.presetBtnText}>Có sẵn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Icon name="add" size={18} color="#fff" style={{ marginRight: 2 }} />
            <Text style={styles.addBtnText}>Tạo mới</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL THÊM CHỦ ĐỀ THỦ CÔNG */}
      <Modal visible={showAddModal} transparent={true} animationType="slide">
        <View style={styles.modalAddOverlay}>
          <View style={styles.modalAddContainer}>
            <Text style={styles.modalAddTitle}>Thêm bộ từ vựng mới</Text>

            <TextInput
              style={styles.inputField}
              placeholder="Nhập tên chủ đề (VD: Travel, Work)..."
              value={newTopicName}
              onChangeText={setNewTopicName}
            />

            <TextInput
              style={styles.inputField}
              placeholder="Số lượng từ gợi ý (VD: 10, 20)..."
              value={newTopicCount}
              onChangeText={setNewTopicCount}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateOnly}>
              <Text style={styles.primaryBtnText}>Tạo chủ đề</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleCreateAndCopy}>
              <Icon name="copy-outline" size={18} color="#0d6efd" style={{ marginRight: 5 }} />
              <Text style={styles.secondaryBtnText}>Tạo & Sao chép prompt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setShowAddModal(false);
                setNewTopicName("");
                setNewTopicCount("10");
              }}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CHỌN CHỦ ĐỀ MẪU TỪ KHO */}
      <Modal visible={showPresetModal} transparent={true} animationType="slide">
        <View style={styles.modalAddOverlay}>
          <View style={[styles.modalAddContainer, { maxHeight: "80%" }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalAddTitle}>Kho chủ đề mẫu</Text>
                <Text style={styles.modalSubTitle}>Chọn một bộ từ vựng chuẩn để nạp nhanh</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPresetModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {loadingPreset ? (
              <ActivityIndicator size="large" color="#0d6efd" style={{ marginVertical: 30 }} />
            ) : sampleTopics.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có chủ đề mẫu nào trên máy chủ.</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {sampleTopics.map((sample) => {
                  const isImporting = importingPresetId === sample.id;
                  let cardCount = sample.count || 0;
                  try {
                    let clean = (sample.dataJson || "[]").trim();
                    if (!clean.startsWith("[")) clean = "[" + clean + "]";
                    const arr = JSON.parse(clean);
                    if (Array.isArray(arr)) cardCount = arr.length;
                  } catch (e) {}

                  return (
                    <View
                      key={sample.id}
                      style={[styles.presetCard, { borderLeftColor: sample.color || "#0d6efd" }]}
                    >
                      <View style={styles.presetCardHeader}>
                        <Text style={styles.presetTag}>{sample.category || "Mẫu"}</Text>
                        <Text style={styles.presetWordCount}>{cardCount} từ vựng</Text>
                      </View>
                      <Text style={styles.presetTitle}>{sample.name}</Text>
                      <Text style={styles.presetDesc} numberOfLines={2}>
                        {sample.description || "Bộ từ vựng chuẩn được tuyển chọn sẵn."}
                      </Text>

                      <TouchableOpacity
                        style={[styles.presetActionBtn, isImporting && styles.btnDisabled]}
                        onPress={() => handleImportPreset(sample)}
                        disabled={isImporting}
                      >
                        {isImporting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Icon name="download-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.presetActionText}>Thêm vào bộ của tôi</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* DANH SÁCH CHỦ ĐỀ CHÍNH */}
      {loading ? (
        <ActivityIndicator size="large" color="#0d6efd" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredTopics}
          keyExtractor={(item) => item.topicId}
          renderItem={renderTopicCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="folder-open-outline" size={60} color="#cbd5e1" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>
                {searchKeyword ? "Không tìm thấy bộ thẻ nào phù hợp" : "Chưa có chủ đề từ vựng nào"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchKeyword
                  ? "Hãy thử tìm kiếm với từ khóa khác."
                  : "Bấm 'Có sẵn' để chọn từ kho mẫu hoặc 'Tạo mới' để bắt đầu nhé!"}
              </Text>
            </View>
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 50,
    paddingBottom: 16,
    backgroundColor: "#0d6efd",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: "#0d6efd",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#ffffff" },
  headerSubtitle: { fontSize: 13, color: "#dbeafe", marginTop: 2 },
  avatarBtn: {
    backgroundColor: "#ffffff",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatarEmoji: { fontSize: 24 },

  searchContainer: { paddingHorizontal: 20, marginTop: 14 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1e293b" },

  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  actionButtonGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  presetBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  presetBtnText: { fontSize: 13, fontWeight: "700", color: "#0d6efd" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d6efd",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  addBtnText: { fontSize: 13, fontWeight: "700", color: "#ffffff" },

  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: "#eae2d8",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardInfo: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#1e293b", maxWidth: "80%" },
  cardCount: { fontSize: 12, color: "#64748b" },
  cardActions: { flexDirection: "row", alignItems: "center" },
  actionBtn: { marginLeft: 14, padding: 4 },
  editText: { fontSize: 13, color: "#0d6efd", fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)" },
  dropdownMenu: {
    position: "absolute",
    top: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 70 : 80,
    right: 20,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 6,
    width: 200,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  menuHeader: { paddingVertical: 8, paddingHorizontal: 16 },
  menuUsernameText: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  menuEmailText: { fontSize: 12, color: "#64748b" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 4 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16 },
  menuText: { fontSize: 14, marginLeft: 10, fontWeight: "600" },

  modalAddOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalAddContainer: {
    width: "88%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalAddTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  modalSubTitle: { fontSize: 12, color: "#64748b", marginTop: 2 },
  inputField: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: "#0d6efd",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  secondaryBtn: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  secondaryBtnText: { color: "#0d6efd", fontSize: 14, fontWeight: "bold" },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelBtnText: { color: "#ef4444", fontSize: 14, fontWeight: "600" },

  presetCard: {
    backgroundColor: "#f8fafc",
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  presetCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  presetTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0d6efd",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  presetWordCount: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  presetTitle: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 4 },
  presetDesc: { fontSize: 12, color: "#64748b", lineHeight: 18, marginBottom: 12 },
  presetActionBtn: {
    flexDirection: "row",
    backgroundColor: "#0d6efd",
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  presetActionText: { color: "#ffffff", fontSize: 13, fontWeight: "bold" },
  btnDisabled: { opacity: 0.6 },

  listContainer: { paddingHorizontal: 20, paddingBottom: 30 },
  emptyContainer: { alignItems: "center", justifyContent: "center", marginTop: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: "#475569", marginBottom: 4, textAlign: "center" },
  emptySubtitle: { fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 20 },
  emptyText: { textAlign: "center", color: "#94a3b8", marginVertical: 20 },
});