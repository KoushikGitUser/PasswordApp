import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTOLOCK_KEY = 'AUTOLOCK_ENABLED';

export const saveAutoLockSetting = async (enabled) => {
  try {
    await AsyncStorage.setItem(AUTOLOCK_KEY, JSON.stringify(enabled));
  } catch (error) {
    console.error('Failed to save autolock setting:', error);
  }
};


export const loadAutoLockSetting = async () => {
  try {
    const value = await AsyncStorage.getItem(AUTOLOCK_KEY);
    return value ? JSON.parse(value) : false; // default to false
  } catch (error) {
    console.error('Failed to load autolock setting:', error);
    return false;
  }
};
