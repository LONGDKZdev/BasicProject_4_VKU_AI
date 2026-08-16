import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    console.log("Thử đăng nhập với:", username, password);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Study Space</Text>
        <Text style={styles.subtitle}>Đăng nhập để tiếp tục học tập</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Tên đăng nhập..."
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu..."
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  content: { flex: 1, justifyContent: "center", padding: 20 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0d6efd",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: { marginBottom: 15 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  loginButton: {
    backgroundColor: "#0d6efd",
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
