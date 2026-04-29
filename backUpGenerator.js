import { encryptPayload } from "./Services/backupCrypto";
import { readPasswordsJson } from "./utils";

export const generateBackup = async (passphrase) => {
  if (!passphrase || typeof passphrase !== "string" || passphrase.length < 12) {
    throw new Error("INVALID_PASSPHRASE");
  }
  try {
    const passwords = await readPasswordsJson();

    const payload = {
      passwords: passwords ? JSON.parse(passwords) : [],
    };

    const envelope = encryptPayload(JSON.stringify(payload), passphrase);
    return envelope;
  } catch (error) {
    console.error("Error generating backup:", error);
    throw error;
  }
};
