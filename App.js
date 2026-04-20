import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./Navigation/AppNavigator";
import Toast from "react-native-toast-message";
import Toaster from "./Components/UniversalToaster/Toaster";

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Toaster/>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}
