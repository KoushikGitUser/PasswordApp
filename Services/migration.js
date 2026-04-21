import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  normalizePasswordRecord,
  STORAGE_KEY,
  readPasswordsJson,
  writePasswordsJson,
} from "../utils";
import {
  vaultContains,
  vaultSetItem,
  isVaultAvailable,
} from "./vaultStorage";

const needsMigration = (record) =>
  !record ||
  typeof record.id !== "string" ||
  !Array.isArray(record.domains) ||
  !Array.isArray(record.packageNames) ||
  typeof record.lastUsedAt !== "number";

const transferSecureStoreToVault = async () => {
  if (Platform.OS !== "android" || !isVaultAvailable()) {
    return { copied: false, reason: "vault-unavailable" };
  }
  try {
    const vaultHas = await vaultContains(STORAGE_KEY);
    if (vaultHas) return { copied: false, reason: "already-in-vault" };

    const legacy = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!legacy) return { copied: false, reason: "no-legacy-data" };

    await vaultSetItem(STORAGE_KEY, legacy);
    return { copied: true };
  } catch (err) {
    console.error("transferSecureStoreToVault error:", err);
    return { copied: false, error: err?.message || String(err) };
  }
};

export const runBootMigration = async () => {
  try {
    const transferResult = await transferSecureStoreToVault();

    const raw = await readPasswordsJson();
    if (!raw) {
      return { migrated: 0, total: 0, transferred: transferResult.copied };
    }

    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) {
      return { migrated: 0, total: 0, transferred: transferResult.copied };
    }

    let migrated = 0;
    const next = data.map((record) => {
      if (needsMigration(record)) {
        migrated += 1;
        return normalizePasswordRecord(record);
      }
      return record;
    });

    if (migrated > 0 || transferResult.copied) {
      await writePasswordsJson(JSON.stringify(next));
    }

    return {
      migrated,
      total: data.length,
      transferred: transferResult.copied,
    };
  } catch (err) {
    console.error("runBootMigration error:", err);
    return { migrated: 0, total: 0, error: err?.message || String(err) };
  }
};
