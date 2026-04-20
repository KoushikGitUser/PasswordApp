import * as DocumentPicker from "expo-document-picker";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { setSkipLock } from "./utils";
import {
  decryptEnvelope,
  isEncryptedEnvelope,
  isLegacyPayload,
} from "./Services/backupCrypto";
import { triggerToast } from "./Services/toast";

const STORAGE_KEY = "passwords";
const CERT_INFO_KEY = "CERTIFICATE_INFO";
const CERT_IMAGE_KEY = "CERTIFICATE_IMAGE";

export const pickAndReadBackupFile = async () => {
  try {
    setSkipLock(true);
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (result.canceled) {
      setSkipLock(false);
      return { status: "cancelled" };
    }

    const file = result.assets[0];
    if (!file.name.endsWith(".json")) {
      setSkipLock(false);
      return { status: "invalid", reason: "Please select a valid .json backup file." };
    }

    const contents = await FileSystem.readAsStringAsync(file.uri);
    let parsed;
    try {
      parsed = JSON.parse(contents);
    } catch {
      setSkipLock(false);
      return { status: "invalid", reason: "Could not parse the backup file." };
    }

    if (isEncryptedEnvelope(parsed)) {
      return { status: "encrypted", envelope: parsed };
    }
    if (isLegacyPayload(parsed)) {
      return { status: "legacy", payload: parsed };
    }

    setSkipLock(false);
    return { status: "invalid", reason: "Unrecognized backup file format." };
  } catch (error) {
    setSkipLock(false);
    console.error("Error reading backup:", error);
    return { status: "invalid", reason: "Could not read the backup file." };
  }
};

export const decryptBackupEnvelope = (envelope, passphrase) => {
  const json = decryptEnvelope(envelope, passphrase);
  const payload = JSON.parse(json);
  if (!isLegacyPayload(payload)) {
    throw new Error("CORRUPT_PAYLOAD");
  }
  return payload;
};

export const commitBackupPayload = async (payload) => {
  try {
    await SecureStore.setItemAsync(
      STORAGE_KEY,
      JSON.stringify(payload.passwords || [])
    );
    await SecureStore.setItemAsync(
      CERT_INFO_KEY,
      JSON.stringify(payload.certificateInfos || [])
    );
    await AsyncStorage.setItem(
      CERT_IMAGE_KEY,
      JSON.stringify(payload.certificateImagePaths || [])
    );
    return true;
  } catch (error) {
    console.error("Error committing backup:", error);
    return false;
  } finally {
    setSkipLock(false);
  }
};

export const finishImportFlow = () => {
  setSkipLock(false);
};

export const restoreBackup = async () => {
  const file = await pickAndReadBackupFile();
  if (file.status !== "legacy") {
    if (file.status === "encrypted") {
      triggerToast(
        "Encrypted backup",
        "Please import this file from Settings to enter the passphrase.",
        "alert",
        4000
      );
    } else if (file.status === "invalid") {
      triggerToast("Invalid file", file.reason, "error", 4000);
    }
    setSkipLock(false);
    return false;
  }
  const ok = await commitBackupPayload(file.payload);
  if (ok) {
    triggerToast(
      "Imported",
      "Legacy backup imported. Re-export to encrypt.",
      "success",
      3500
    );
  }
  return ok;
};
