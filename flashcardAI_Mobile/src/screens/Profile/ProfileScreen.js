import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import { AuthContext } from "../../store/authContext";
import { db } from "../../config/firebase";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const AVATARS = [
  { key: "avatar_0", icon: "👤", label: "Mặc định" },
  { key: "avatar_1", icon: "🦊", label: "Cáo đỏ" },
  { key: "avatar_2", icon: "🐱", label: "Mèo con" },
  { key: "avatar_3", icon: "🦉", label: "Cú thông thái" },
  { key: "avatar_4", icon: "🤖", label: "Robot" },
  { key: "avatar_5", icon: "🐼", label: "Gấu trúc" },
  { key: "avatar_6", icon: "🦁", label: "Sư tử" },
  { key: "avatar_7", icon: "🐯", label: "Hổ con" },
  { key: "avatar_8", icon: "🐶", label: "Cún cưng" },
  { key: "avatar_9", icon: "🦄", label: "Kỳ lân" },
  { key: "avatar_10", icon: "🐧", label: "Chim cánh cụt" },
  { key: "avatar_11", icon: "🐸", label: "Ếch xanh" },
  { key: "avatar_12", icon: "💀", label: "Đầu lâu" },
];

export default function ProfileScreen({ navigation }) {
  const { currentUser, login, logout } = useContext(AuthContext);

  const [selectedAvatarKey, setSelectedAvatarKey] = useState(
    currentUser?.avatarKey || "avatar_0"
  );
  const [email, setEmail] = useState(currentUser?.email || "");
  const [stats, setStats] = useState({ topicCount: 0, vocabCount: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // State đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // 1. Tải dữ liệu thống kê từ Firestore
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!currentUser?.userId) return;
      try {
        const q = query(
          collection(db, "topics"),
          where("userId", "==", currentUser.userId)
        );
        const querySnapshot = await getDocs(q);
        let tCount = 0;
        let vCount = 0;

        querySnapshot.forEach((d) => {
          tCount++;
          const data = d.data();
          try {
            let clean = (data.dataJson || "[]").trim();
            if (!clean.startsWith("[")) clean = "[" + clean + "]";
            const list = JSON.parse(clean);
            if (Array.isArray(list)) vCount += list.length;
          } catch (e) {}
        });

        setStats({ topicCount: tCount, vocabCount: vCount });
      } catch (err) {
        console.error("Lỗi lấy thống kê:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchUserStats();
  }, [currentUser]);

  // 2. Lưu thay đổi Avatar & Email
  const handleSaveProfile = async () => {
    if (!email.trim()) {
      Alert.alert("Lỗi", "Email không được để trống!");
      return;
    }

    setSavingProfile(true);
    try {
      await updateDoc(doc(db, "users", currentUser.userId), {
        avatarKey: selectedAvatarKey,
        email: email.trim(),
      });

      // Cập nhật State toàn cục
      await login({
        ...currentUser,
        avatarKey: selectedAvatarKey,
        email: email.trim(),
      });

      Alert.alert("Thành công", "Đã lưu thông tin tài khoản thành công!");
    } catch (err) {
      console.error("Lỗi lưu hồ sơ:", err);
      Alert.alert("Lỗi", "Không thể lưu hồ sơ lúc này.");
    } finally {
      setSavingProfile(false);
    }
  };

  // 3. Xử lý đổi mật khẩu
  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ các trường mật khẩu!");
      return;
    }

    if (currentUser?.password !== currentPassword) {
      Alert.alert("Sai mật khẩu", "Mật khẩu hiện tại không chính xác!");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Mật khẩu yếu", "Mật khẩu mới phải có tối thiểu 6 ký tự!");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Không khớp", "Xác nhận mật khẩu mới không trùng khớp!");
      return;
    }

    setChangingPass(true);
    try {
      await updateDoc(doc(db, "users", currentUser.userId), {
        password: newPassword,
      });

      await login({
        ...currentUser,
        password: newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      Alert.alert("Thành công", "Đã đổi mật khẩu tài khoản thành công!");
    } catch (err) {
      console.error("Lỗi đổi mật khẩu:", err);
      Alert.alert("Lỗi", "Không thể cập nhật mật khẩu.");
    } finally {
      setChangingPass(false);
    }
  };

  // 4. Đăng xuất
  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await logout();
          navigation.replace("Auth");
        },
      },
    ]);
  };

  const currentAvatarIcon =
    AVATARS.find((a) => a.key === selectedAvatarKey)?.icon || "👤";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fcf8f2" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt tài khoản</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.backBtn}>
          <Icon name="log-out-outline" size={24} color="#dc3545" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Khối Profile & Thống kê */}
        <View style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{currentAvatarIcon}</Text>
          </View>
          <Text style={styles.usernameText}>{currentUser?.username || "Người dùng"}</Text>
          <Text style={styles.emailSubText}>{currentUser?.email || "Chưa cập nhật email"}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Bộ thẻ</Text>
              {loadingStats ? (
                <ActivityIndicator size="small" color="#0d6efd" />
              ) : (
                <Text style={styles.statNumberPrimary}>{stats.topicCount}</Text>
              )}
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Tổng từ vựng</Text>
              {loadingStats ? (
                <ActivityIndicator size="small" color="#10b981" />
              ) : (
                <Text style={styles.statNumberSuccess}>{stats.vocabCount}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Khối 1: Chọn Avatar Emoji */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            <Icon name="happy-outline" size={18} color="#0d6efd" /> Chọn linh vật đại diện
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarPickerList}>
            {AVATARS.map((av) => {
              const isSelected = av.key === selectedAvatarKey;
              return (
                <TouchableOpacity
                  key={av.key}
                  style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                  onPress={() => setSelectedAvatarKey(av.key)}
                >
                  <Text style={styles.avatarOptionEmoji}>{av.icon}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.inputLabel}>Tên tài khoản (Không thể đổi)</Text>
          <TextInput
            style={[styles.inputField, styles.disabledInput]}
            value={currentUser?.username || ""}
            editable={false}
          />

          <Text style={styles.inputLabel}>Địa chỉ Email</Text>
          <TextInput
            style={styles.inputField}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.primaryBtn, savingProfile && styles.btnDisabled]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Lưu thông tin hồ sơ</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Khối 2: Bảo mật & Đổi mật khẩu */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            <Icon name="shield-checkmark-outline" size={18} color="#0d6efd" /> Đổi mật khẩu
          </Text>

          {/* Mật khẩu hiện tại */}
          <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Nhập mật khẩu cũ..."
              secureTextEntry={!showCurrentPass}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPass(!showCurrentPass)}
              style={styles.eyeBtn}
            >
              <Icon name={showCurrentPass ? "eye-off-outline" : "eye-outline"} size={20} color="#6c757d" />
            </TouchableOpacity>
          </View>

          {/* Mật khẩu mới */}
          <Text style={styles.inputLabel}>Mật khẩu mới (ít nhất 6 ký tự)</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Nhập mật khẩu mới..."
              secureTextEntry={!showNewPass}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity
              onPress={() => setShowNewPass(!showNewPass)}
              style={styles.eyeBtn}
            >
              <Icon name={showNewPass ? "eye-off-outline" : "eye-outline"} size={20} color="#6c757d" />
            </TouchableOpacity>
          </View>

          {/* Xác nhận mật khẩu mới */}
          <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Nhập lại mật khẩu mới..."
              secureTextEntry={!showConfirmPass}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPass(!showConfirmPass)}
              style={styles.eyeBtn}
            >
              <Icon name={showConfirmPass ? "eye-off-outline" : "eye-outline"} size={20} color="#6c757d" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.securityBtn, changingPass && styles.btnDisabled]}
            onPress={handleChangePassword}
            disabled={changingPass}
          >
            {changingPass ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.securityBtnText}>Cập nhật mật khẩu mới</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#eae2d8",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#222" },
  scrollContent: { padding: 18, paddingBottom: 40 },

  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eae2d8",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0d6efd",
    marginBottom: 12,
  },
  avatarText: { fontSize: 42 },
  usernameText: { fontSize: 20, fontWeight: "bold", color: "#222", marginBottom: 2 },
  emailSubText: { fontSize: 14, color: "#6c757d", marginBottom: 16 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingVertical: 12,
  },
  statBox: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 30, backgroundColor: "#e2e8f0" },
  statLabel: { fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: "500" },
  statNumberPrimary: { fontSize: 18, fontWeight: "bold", color: "#0d6efd" },
  statNumberSuccess: { fontSize: 18, fontWeight: "bold", color: "#10b981" },

  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#eae2d8",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 14,
  },
  avatarPickerList: { flexDirection: "row", marginBottom: 16 },
  avatarOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarOptionSelected: {
    borderColor: "#0d6efd",
    backgroundColor: "#eff6ff",
    transform: [{ scale: 1.08 }],
  },
  avatarOptionEmoji: { fontSize: 26 },

  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
    marginTop: 4,
  },
  inputField: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1e293b",
    marginBottom: 12,
  },
  disabledInput: {
    backgroundColor: "#e2e8f0",
    color: "#64748b",
  },

  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  passwordInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: "#1e293b" },
  eyeBtn: { padding: 6 },

  primaryBtn: {
    backgroundColor: "#0d6efd",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  primaryBtnText: { color: "#ffffff", fontWeight: "bold", fontSize: 15 },

  securityBtn: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  securityBtnText: { color: "#ffffff", fontWeight: "bold", fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
});