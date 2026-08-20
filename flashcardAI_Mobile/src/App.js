import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context"; // <-- Thêm thư viện này

// Import AuthProvider để quản lý State đăng nhập toàn cục
import { AuthProvider } from "./store/authContext";

import AuthNavigator from "./navigation/AuthNavigator";
import AppNavigator from "./navigation/AppNavigator";

const RootStack = createNativeStackNavigator();

export default function App() {
  return (
    // Bọc SafeAreaProvider ra ngoài cùng của toàn bộ App
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {/* Màn hình khởi chạy đầu tiên là Đăng nhập (Luồng Auth) */}
            <RootStack.Screen name="Auth" component={AuthNavigator} />

            {/* Khi đăng nhập thành công sẽ nhảy sang luồng App (tức là Home, Flashcard...) */}
            <RootStack.Screen name="App" component={AppNavigator} />
          </RootStack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
