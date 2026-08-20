import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  // Hàm lưu user sau khi đăng nhập thành công
  const login = async (userData) => {
    setCurrentUser(userData);
    await AsyncStorage.setItem("user", JSON.stringify(userData));
  };

  // Hàm đăng xuất
  const logout = async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
