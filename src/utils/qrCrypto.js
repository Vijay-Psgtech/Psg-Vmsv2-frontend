/**
 * ═══════════════════════════════════════════════════════════════════════════
 * QR CRYPTO - BACKEND VERSION
 * File: backend/utils/qrCrypto.js
 * ═══════════════════════════════════════════════════════════════════════════
 * MATCHES frontend crypto implementation (CryptoJS)
 * Uses crypto-js for AES encryption/decryption
 */

import CryptoJS from "crypto-js";
import dotenv from "dotenv";

dotenv.config();

/**
 * CRITICAL: This secret MUST match:
 * 1. Frontend: src/utils/qrCrypto.js (VITE_QR_SECRET)
 * 2. Backend: .env file (QR_SECRET)
 * 
 * If they don't match, QR codes won't decrypt!
 */
const QR_SECRET = process.env.QR_SECRET || "CHANGE_THIS_TO_32_CHAR_SECRET";

console.log("🔐 QR Crypto initialized");
console.log(`   Secret set: ${QR_SECRET ? "✅ Yes" : "❌ No"}`);
if (QR_SECRET === "CHANGE_THIS_TO_32_CHAR_SECRET") {
  console.warn("   ⚠️  WARNING: Using default secret! Set QR_SECRET in .env");
}

/**
 * Encrypt QR payload (visitor data)
 * @param {Object} payload - { visitorId, name, gate, allowedUntil, ... }
 * @returns {string} - Encrypted QR string
 */
export function encryptQR(payload) {
  try {
    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid QR payload");
    }

    const data = JSON.stringify({
      ...payload,
      ts: Date.now(), // anti-replay timestamp
    });

    const encrypted = CryptoJS.AES.encrypt(data, QR_SECRET).toString();
    
    console.log(`✅ QR encrypted for visitor:`, {
      visitorId: payload.visitorId,
      timestamp: new Date().toISOString(),
      encryptedLength: encrypted.length,
    });

    return encrypted;
  } catch (err) {
    console.error("❌ QR encryption failed:", err.message);
    throw new Error(`QR encryption failed: ${err.message}`);
  }
}

/**
 * Decrypt QR payload (when scanning QR code)
 * @param {string} encrypted - Encrypted QR string from frontend
 * @returns {Object} - Decrypted payload { visitorId, name, gate, ... }
 */
export function decryptQR(encrypted) {
  try {
    if (!encrypted) {
      throw new Error("No encrypted QR data provided");
    }

    const bytes = CryptoJS.AES.decrypt(encrypted, QR_SECRET);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      throw new Error("Decryption resulted in empty string");
    }

    const payload = JSON.parse(decrypted);

    console.log(`✅ QR decrypted:`, {
      visitorId: payload.visitorId,
      timestamp: new Date(payload.ts).toISOString(),
      ageSeconds: Math.round((Date.now() - payload.ts) / 1000),
    });

    return payload;
  } catch (err) {
    console.error("❌ QR decryption failed:", err.message);
    throw new Error(`QR decryption failed: ${err.message}`);
  }
}

/**
 * Validate QR timestamp (anti-replay protection)
 * @param {number} timestamp - Timestamp from decrypted QR
 * @param {number} maxAgeSeconds - Max age allowed (default 24 hours)
 * @returns {boolean} - True if timestamp is valid
 */
export function isQRTimestampValid(timestamp, maxAgeSeconds = 86400) {
  const ageSeconds = Math.round((Date.now() - timestamp) / 1000);
  const isValid = ageSeconds <= maxAgeSeconds;

  console.log(`🕐 QR timestamp validation:`, {
    ageSeconds,
    maxAgeSeconds,
    isValid,
  });

  return isValid;
}

export default {
  encryptQR,
  decryptQR,
  isQRTimestampValid,
};