import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import {
  vaultGetItem,
  vaultSetItem,
  vaultDeleteItem,
  isVaultAvailable,
} from './Services/vaultStorage';

export const STORAGE_KEY = 'passwords';

const useVault = () => Platform.OS === 'android' && isVaultAvailable();

export const readPasswordsJson = async () => {
  try {
    if (useVault()) {
      return await vaultGetItem(STORAGE_KEY);
    }
    return await SecureStore.getItemAsync(STORAGE_KEY);
  } catch (e) {
    console.error('readPasswordsJson error:', e);
    return null;
  }
};

export const writePasswordsJson = async (jsonStr) => {
  try {
    if (useVault()) {
      await vaultSetItem(STORAGE_KEY, jsonStr);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEY, jsonStr);
    }
  } catch (e) {
    console.error('writePasswordsJson error:', e);
  }
};

export const replacePasswords = async (arr) => {
  await writePasswordsJson(JSON.stringify(arr));
};

export const normalizePasswordRecord = (entry) => ({
  ...entry,
  id: entry.id || Crypto.randomUUID(),
  domains: Array.isArray(entry.domains) ? entry.domains : [],
  packageNames: Array.isArray(entry.packageNames) ? entry.packageNames : [],
  lastUsedAt: typeof entry.lastUsedAt === 'number' ? entry.lastUsedAt : 0,
});

// Save password entry
export const savePassword = async (newEntry) => {
  try {
    const existing = await readPasswordsJson();
    const data = existing ? JSON.parse(existing) : [];
    data.push(normalizePasswordRecord(newEntry));
    await writePasswordsJson(JSON.stringify(data));
  } catch (e) {
    console.error('savePassword error:', e);
  }
};

// Get all stored passwords
export const getPasswords = async () => {
  try {
    const result = await readPasswordsJson();
    return result ? JSON.parse(result) : [];
  } catch (e) {
    console.error('getPasswords error:', e);
    return [];
  }
};

// Clear all stored passwords
export const clearPasswords = async () => {
  try {
    if (useVault()) {
      await vaultDeleteItem(STORAGE_KEY);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
  } catch (e) {
    console.error('clearPasswords error:', e);
  }
};

export const updatePassword = async (index, updatedEntry) => {
  try {
    const existing = await readPasswordsJson();
    const data = existing ? JSON.parse(existing) : [];
    const previous = data[index] || {};
    data[index] = normalizePasswordRecord({ ...previous, ...updatedEntry });
    await writePasswordsJson(JSON.stringify(data));
  } catch (e) {
    console.error('updatePassword error:', e);
  }
};

export const deletePassword = async (index) => {
  try {
    const existing = await readPasswordsJson();
    const data = existing ? JSON.parse(existing) : [];
    data.splice(index, 1);
    await writePasswordsJson(JSON.stringify(data));
  } catch (e) {
    console.error('deletePassword error:', e);
  }
};

export const deletePasswordsByCategory = async (category) => {
  try {
    const existing = await readPasswordsJson();
    const data = existing ? JSON.parse(existing) : [];
    const updatedData = data.filter(item => item.category !== category);
    await writePasswordsJson(JSON.stringify(updatedData));
  } catch (e) {
    console.error('deletePasswordsByCategory error:', e);
  }
};

export const updatePasswordById = async (id, patch) => {
  try {
    const existing = await readPasswordsJson();
    const data = existing ? JSON.parse(existing) : [];
    const i = data.findIndex(p => p.id === id);
    if (i < 0) return false;
    data[i] = normalizePasswordRecord({ ...data[i], ...patch });
    await writePasswordsJson(JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('updatePasswordById error:', e);
    return false;
  }
};

export const deletePasswordById = async (id) => {
  try {
    const existing = await readPasswordsJson();
    const data = existing ? JSON.parse(existing) : [];
    const next = data.filter(p => p.id !== id);
    await writePasswordsJson(JSON.stringify(next));
    return true;
  } catch (e) {
    console.error('deletePasswordById error:', e);
    return false;
  }
};

export const touchLastUsedById = async (id) => {
  try {
    const existing = await readPasswordsJson();
    const data = existing ? JSON.parse(existing) : [];
    const i = data.findIndex(p => p.id === id);
    if (i < 0) return false;
    data[i] = normalizePasswordRecord({ ...data[i], lastUsedAt: Date.now() });
    await writePasswordsJson(JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('touchLastUsedById error:', e);
    return false;
  }
};

// LockControl
export let skipLock = false;

export const setSkipLock = (value) => {
  skipLock = value;
};
