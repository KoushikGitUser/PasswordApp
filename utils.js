import * as SecureStore from 'expo-secure-store';

export const STORAGE_KEY = 'passwords';

// Save password entry
export const savePassword = async (newEntry) => {
  try {
    const existing = await SecureStore.getItemAsync(STORAGE_KEY);
    const data = existing ? JSON.parse(existing) : [];
    data.push(newEntry);
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('SecureStore save error:', e);
  }
};

// Get all stored passwords
export const getPasswords = async () => {
  try {
    const result = await SecureStore.getItemAsync(STORAGE_KEY);
    return result ? JSON.parse(result) : [];
  } catch (e) {
    console.error('SecureStore get error:', e);
    return [];
  }
};

// Clear all stored passwords (optional utility)
export const clearPasswords = async () => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch (e) {
    console.error('SecureStore clear error:', e);
  }
};

export const updatePassword = async (index, updatedEntry) => {
  try {
    const existing = await SecureStore.getItemAsync(STORAGE_KEY);
    const data = existing ? JSON.parse(existing) : [];
    data[index] = updatedEntry;
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Update error:', e);
  }
};

export const deletePassword = async (index) => {
  try {
    const existing = await SecureStore.getItemAsync(STORAGE_KEY);
    const data = existing ? JSON.parse(existing) : [];
    data.splice(index, 1);
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Delete error:', e);
  }
};

export const deletePasswordsByCategory = async (category) => {
  try {
    const existing = await SecureStore.getItemAsync(STORAGE_KEY);
    const data = existing ? JSON.parse(existing) : [];

    // Filter out passwords from the selected category
    const updatedData = data.filter(item => item.category !== category);

    // Save the updated array
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updatedData));
  } catch (e) {
    console.error('SecureStore delete error:', e);
  }
};


// LockControl.js
export let skipLock = false;

export const setSkipLock = (value) => {
  skipLock = value;
};

