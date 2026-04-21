import { NativeModules, Platform } from "react-native";

const { VaultStorage: NativeVault } = NativeModules;

const ensureNative = () => {
  if (Platform.OS !== "android") {
    throw new Error("VaultStorage is only available on Android");
  }
  if (!NativeVault) {
    throw new Error(
      "VaultStorage native module is not available. Rebuild the app."
    );
  }
  return NativeVault;
};

export const vaultGetItem = async (key) => {
  const mod = ensureNative();
  return await mod.getItem(key);
};

export const vaultSetItem = async (key, value) => {
  const mod = ensureNative();
  return await mod.setItem(key, value);
};

export const vaultDeleteItem = async (key) => {
  const mod = ensureNative();
  return await mod.deleteItem(key);
};

export const vaultContains = async (key) => {
  const mod = ensureNative();
  return await mod.contains(key);
};

export const isVaultAvailable = () =>
  Platform.OS === "android" && !!NativeVault;
