import QRCode from "qrcode";

export async function generateQR(payload) {
  return QRCode.toDataURL(JSON.stringify(payload), {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 280,
  });
}
