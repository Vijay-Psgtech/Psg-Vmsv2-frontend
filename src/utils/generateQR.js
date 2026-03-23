import QRCode from "qrcode";
import { encryptQR } from "./qrCrypto";

/**
 * Generates an encrypted QR string (NOT image)
 * Used only for backend scan simulation
 */
export async function generateQR(payload) {
  if (!payload?.visitorId || !payload?.gateId) {
    throw new Error("Invalid QR payload");
  }

  // Encrypt payload (visitorId + gateId)
  const encrypted = encryptQR(payload);

  return encrypted; // return STRING (not image)
}
