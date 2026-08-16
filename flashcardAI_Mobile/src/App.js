import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./navigation/AuthNavigator";

export default function App() {
  return (
    // Bọc toàn bộ app bằng NavigationContainer
    <NavigationContainer>
      <AuthNavigator />
    </NavigationContainer>
  );
}
