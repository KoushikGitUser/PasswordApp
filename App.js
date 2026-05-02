import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./Navigation/AppNavigator";
import Toaster from "./Components/UniversalToaster/Toaster";
import { runBootMigration } from "./Services/migration";
import { AppThemeProvider } from "./theme/ThemeContext";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await runBootMigration();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "black",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color="#00c787" size="large" />
      </View>
    );
  }

  return (
    <AppThemeProvider>
      <NavigationContainer>
        <Toaster />
        <AppNavigator />
      </NavigationContainer>
    </AppThemeProvider>
  );
}
