import { NativeModules, Platform } from "react-native";

const { AutofillBridge } = NativeModules;

const isAndroid = () => Platform.OS === "android" && !!AutofillBridge;

export const isAutofillSupported = async () => {
  if (!isAndroid()) return false;
  try {
    return await AutofillBridge.isSupported();
  } catch {
    return false;
  }
};

export const isAutofillEnabled = async () => {
  if (!isAndroid()) return false;
  try {
    return await AutofillBridge.isEnabled();
  } catch {
    return false;
  }
};

export const openAutofillPicker = async () => {
  if (!isAndroid()) {
    throw new Error("Autofill is only supported on Android 8+.");
  }
  return await AutofillBridge.openAutofillPicker();
};

export const listInstalledApps = async () => {
  if (!isAndroid()) return [];
  try {
    return await AutofillBridge.listInstalledApps();
  } catch {
    return [];
  }
};
