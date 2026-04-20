import * as SecureStore from "expo-secure-store";

const FAIL_KEY = "pin_fail_count";
const UNTIL_KEY = "pin_lock_until";

export const MAX_FAILS = 5;
export const COOLDOWN_MS = 30 * 60 * 1000;

export const getLockState = async () => {
  const untilStr = await SecureStore.getItemAsync(UNTIL_KEY);
  const failsStr = await SecureStore.getItemAsync(FAIL_KEY);
  const until = untilStr ? parseInt(untilStr, 10) : 0;
  const fails = failsStr ? parseInt(failsStr, 10) : 0;
  const remainingMs = Math.max(0, until - Date.now());
  return { fails, remainingMs };
};

export const recordFailure = async () => {
  const prev = await SecureStore.getItemAsync(FAIL_KEY);
  const fails = (prev ? parseInt(prev, 10) : 0) + 1;
  await SecureStore.setItemAsync(FAIL_KEY, String(fails));

  if (fails >= MAX_FAILS) {
    const until = Date.now() + COOLDOWN_MS;
    await SecureStore.setItemAsync(UNTIL_KEY, String(until));
    return { fails, locked: true, remainingMs: COOLDOWN_MS };
  }
  return { fails, locked: false, remainingMs: 0 };
};

export const recordSuccess = async () => {
  await SecureStore.deleteItemAsync(FAIL_KEY);
  await SecureStore.deleteItemAsync(UNTIL_KEY);
};

export const clearExpiredLock = async () => {
  const untilStr = await SecureStore.getItemAsync(UNTIL_KEY);
  if (!untilStr) return;
  const until = parseInt(untilStr, 10);
  if (Date.now() >= until) {
    await SecureStore.deleteItemAsync(FAIL_KEY);
    await SecureStore.deleteItemAsync(UNTIL_KEY);
  }
};
