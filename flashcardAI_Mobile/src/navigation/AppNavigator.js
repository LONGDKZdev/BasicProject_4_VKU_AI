import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/Home/HomeScreen";
import EditTopicScreen from "../screens/Home/EditTopicScreen";
import FlashcardScreen from "../screens/Study/FlashcardScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="EditTopic" component={EditTopicScreen} />
      <Stack.Screen name="Flashcard" component={FlashcardScreen} />
    </Stack.Navigator>
  );
}
