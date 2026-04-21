import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { encryptPayload } from "./Services/backupCrypto";
import { readPasswordsJson } from "./utils";

const CERT_INFO_KEY = "CERTIFICATE_INFO";
const CERT_IMAGE_KEY = "CERTIFICATE_IMAGE";

export const generateBackup = async (passphrase) => {
  if (!passphrase || typeof passphrase !== "string" || passphrase.length < 12) {
    throw new Error("INVALID_PASSPHRASE");
  }
  try {
    const passwords = await readPasswordsJson();
    const certificateInfos = await SecureStore.getItemAsync(CERT_INFO_KEY);
    const certificateImagePaths = await AsyncStorage.getItem(CERT_IMAGE_KEY);

    const payload = {
      passwords: passwords ? JSON.parse(passwords) : [],
      certificateInfos: certificateInfos ? JSON.parse(certificateInfos) : [],
      certificateImagePaths: certificateImagePaths ? JSON.parse(certificateImagePaths) : [],
    };

    const envelope = encryptPayload(JSON.stringify(payload), passphrase);
    return envelope;
  } catch (error) {
    console.error("Error generating backup:", error);
    throw error;
  }
};
