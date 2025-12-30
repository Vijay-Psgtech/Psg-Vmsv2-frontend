import CryptoJS from "crypto-js";

/**
 * IMPORTANT:
 * This secret MUST match backend secret exactly
 * Put same value in server .env
 */
const QR_SECRET =
  import.meta.env.VITE_QR_SECRET || "CHANGE_THIS_TO_32_CHAR_SECRET";

/**
 * Encrypt QR payload
 * @param {Object} payload { visitorId, gateId }
 * @returns {string} encrypted string
 */
export function encryptQR(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid QR payload");
  }

  const data = JSON.stringify({
    ...payload,
    ts: Date.now(), // anti-replay timestamp
  });

  return CryptoJS.AES.encrypt(data, QR_SECRET).toString();
}

/**
 * Decrypt QR payload
 * @param {string} encrypted
 * @returns {Object}
 */
export function decryptQR(encrypted) {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, QR_SECRET);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      throw new Error("Decryption failed");
    }

    return JSON.parse(decrypted);
  } catch {
    throw new Error("Invalid QR data");
  }
}