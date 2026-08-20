import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // <-- Import chuẩn xác
import { Ionicons as Icon } from "@expo/vector-icons";

// Import công cụ của Firebase
import { db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

import { AuthContext } from "../../store/authContext";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Tạo câu truy vấn: Tìm user có username khớp với ô nhập liệu
      const q = query(
        collection(db, "users"),
        where("username", "==", username.trim()),
      );

      const querySnapshot = await getDocs(q);

      // 2. Kiểm tra xem tài khoản có tồn tại không
      if (querySnapshot.empty) {
        Alert.alert(
          "Đăng nhập thất bại",
          "Tài khoản không tồn tại trên hệ thống!",
        );
        setIsLoading(false);
        return;
      }

      // 3. Lấy dữ liệu của user đầu tiên tìm thấy
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // 4. Đối chiếu mật khẩu
      if (userData.password !== password) {
        Alert.alert("Đăng nhập thất bại", "Mật khẩu không chính xác!");
        setIsLoading(false);
        return;
      }

      // 5. Mật khẩu đúng -> Đăng nhập thành công!
      // Lưu toàn bộ thông tin (gồm cả userId, email, avatarKey) vào Context
      await login({
        userId: userDoc.id, // Lấy ID của document
        ...userData,
      });

      // Chuyển sang luồng App chính
      navigation.replace("App");
    } catch (error) {
      console.error("Lỗi Firebase:", error);
      Alert.alert(
        "Lỗi kết nối",
        "Vui lòng kiểm tra lại cấu hình Firebase hoặc mạng Internet.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fcf8f2" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Tiêu đề Logo */}
            <View style={styles.logoContainer}>
              <Icon name="albums" size={60} color="#0d6efd" />
              <Text style={styles.title}>Flashcard</Text>
              <Text style={styles.subtitle}>Đăng nhập để tiếp tục học tập</Text>
            </View>

            {/* Input Tên đăng nhập */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tên đăng nhập</Text>
              <View style={styles.inputWrapper}>
                <Icon
                  name="person-outline"
                  size={20}
                  color="#6c757d"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập username..."
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor="#adb5bd"
                />
              </View>
            </View>

            {/* Input Mật khẩu */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <Icon
                  name="lock-closed-outline"
                  size={20}
                  color="#6c757d"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#adb5bd"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#6c757d"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Nút Đăng nhập */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            {/* Liên kết Đăng ký */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fcf8f2" },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  content: { paddingHorizontal: 30, paddingBottom: 80 },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#0d6efd",
    marginTop: 10,
    marginBottom: 5,
  },
  subtitle: { fontSize: 15, color: "#6c757d" },
  inputContainer: { marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#212529" },
  eyeIcon: { padding: 10 },
  loginButton: {
    backgroundColor: "#0d6efd",
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
    shadowColor: "#0d6efd",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  loginButtonDisabled: {
    backgroundColor: "#6c757d",
    elevation: 0,
    shadowOpacity: 0,
  },
  loginButtonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  registerText: { color: "#6c757d", fontSize: 15 },
  registerLink: { color: "#0d6efd", fontSize: 15, fontWeight: "bold" },
});
