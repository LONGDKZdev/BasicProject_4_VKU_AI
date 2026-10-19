import React, { useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";

// Import Firebase
import { db } from "../../config/firebase";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    console.log("--> Bắt đầu xử lý đăng ký tài khoản:", username);

    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ tên đăng nhập, email và mật khẩu!");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Mật khẩu yếu", "Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên!");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Lỗi xác nhận", "Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Kiểm tra trùng username trên Firestore
      const q = query(
        collection(db, "users"),
        where("username", "==", username.trim())
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        console.warn("⚠️ Đăng ký thất bại: Tên đăng nhập đã tồn tại trên hệ thống");
        Alert.alert("Đăng ký thất bại", "Tên đăng nhập này đã được sử dụng!");
        setIsLoading(false);
        return;
      }

      // 2. Tạo document mới vào collection "users"
      const newUserId = "user_" + Date.now();
      const newUserData = {
        userId: newUserId,
        username: username.trim(),
        email: email.trim(),
        password: password,
        avatarKey: "avatar_0",
        createdAt: Date.now(),
      };

      await setDoc(doc(db, "users", newUserId), newUserData);
      console.log("✅ Đã tạo tài khoản mới thành công trên Firestore:", newUserId);

      Alert.alert("Thành công", "Đăng ký tài khoản thành công! Hãy đăng nhập.", [
        { text: "Đăng nhập ngay", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error) {
      console.error("❌ Lỗi đăng ký Firebase:", error);
      Alert.alert("Lỗi hệ thống", error.message || "Không thể kết nối đến Firebase.");
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
            <View style={styles.logoContainer}>
              <Icon name="person-add" size={50} color="#0d6efd" />
              <Text style={styles.title}>Tạo tài khoản</Text>
              <Text style={styles.subtitle}>Bắt đầu hành trình học từ vựng thông minh</Text>
            </View>

            {/* Username */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tên đăng nhập</Text>
              <View style={styles.inputWrapper}>
                <Icon name="person-outline" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên đăng nhập..."
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor="#adb5bd"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Địa chỉ Email</Text>
              <View style={styles.inputWrapper}>
                <Icon name="mail-outline" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập email..."
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#adb5bd"
                />
              </View>
            </View>

            {/* Mật khẩu */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock-closed-outline" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Tối thiểu 6 ký tự..."
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

            {/* Nhập lại mật khẩu */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <Icon name="shield-checkmark-outline" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu..."
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#adb5bd"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Đăng ký tài khoản</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.registerLink}>Đăng nhập ngay</Text>
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
  content: { paddingHorizontal: 30, paddingVertical: 20 },
  logoContainer: { alignItems: "center", marginBottom: 25 },
  title: { fontSize: 30, fontWeight: "bold", color: "#0d6efd", marginTop: 8, marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#6c757d", textAlign: "center" },
  inputContainer: { marginBottom: 14 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#495057", marginBottom: 6, marginLeft: 4 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 52,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#212529" },
  eyeIcon: { padding: 8 },
  loginButton: {
    backgroundColor: "#0d6efd",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    elevation: 3,
    shadowColor: "#0d6efd",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  loginButtonDisabled: { backgroundColor: "#6c757d", elevation: 0 },
  loginButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  registerContainer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  registerText: { color: "#6c757d", fontSize: 14 },
  registerLink: { color: "#0d6efd", fontSize: 14, fontWeight: "bold" },
});