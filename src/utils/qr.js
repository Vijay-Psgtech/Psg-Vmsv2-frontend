import QRCode from "qrcode";
import { encryptQR } from "../utils/qrCrypto";

export async function generateQR(payload) {
  const encrypted = encryptQR(payload);

  return QRCode.toDataURL(encrypted, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 280,
  });
}

