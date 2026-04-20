import * as Crypto from "expo-crypto";
import { AES } from "@stablelib/aes";
import { GCM } from "@stablelib/gcm";
import { deriveKey } from "@stablelib/pbkdf2";
import { SHA256 } from "@stablelib/sha256";
import { encode as b64encode, decode as b64decode } from "@stablelib/base64";
import { encode as utf8encode, decode as utf8decode } from "@stablelib/utf8";

const ITER = 200000;
const KEY_LEN = 32;
const SALT_LEN = 16;
const IV_LEN = 12;
const ALG = "AES-256-GCM/PBKDF2-SHA256";
const VERSION = 1;

const deriveAesKey = (passphrase, salt) => {
  const pwBytes = utf8encode(passphrase);
  return deriveKey(SHA256, pwBytes, salt, ITER, KEY_LEN);
};

export const encryptPayload = (plaintextString, passphrase) => {
  const salt = Crypto.getRandomBytes(SALT_LEN);
  const iv = Crypto.getRandomBytes(IV_LEN);
  const key = deriveAesKey(passphrase, salt);
  const gcm = new GCM(new AES(key));
  const ct = gcm.seal(iv, utf8encode(plaintextString));
  return {
    v: VERSION,
    alg: ALG,
    iter: ITER,
    salt: b64encode(salt),
    iv: b64encode(iv),
    ct: b64encode(ct),
  };
};

export const decryptEnvelope = (envelope, passphrase) => {
  if (!envelope || envelope.v !== VERSION || envelope.alg !== ALG) {
    throw new Error("UNSUPPORTED_FORMAT");
  }
  const salt = b64decode(envelope.salt);
  const iv = b64decode(envelope.iv);
  const ct = b64decode(envelope.ct);
  const iter = envelope.iter || ITER;
  const pwBytes = utf8encode(passphrase);
  const key = deriveKey(SHA256, pwBytes, salt, iter, KEY_LEN);
  const gcm = new GCM(new AES(key));
  const opened = gcm.open(iv, ct);
  if (!opened) {
    throw new Error("WRONG_PASSPHRASE");
  }
  return utf8decode(opened);
};

export const isEncryptedEnvelope = (obj) => {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.v === "number" &&
    typeof obj.alg === "string" &&
    typeof obj.salt === "string" &&
    typeof obj.iv === "string" &&
    typeof obj.ct === "string"
  );
};

export const isLegacyPayload = (obj) => {
  return (
    obj &&
    typeof obj === "object" &&
    (Array.isArray(obj.passwords) ||
      Array.isArray(obj.certificateInfos) ||
      Array.isArray(obj.certificateImagePaths))
  );
};
