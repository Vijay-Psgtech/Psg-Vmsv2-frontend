import React, { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { encryptQR } from "../utils/qrCrypto";

export default function QRCodeDisplay({ visitorId, gateId }) {
  const [qr, setQr] = useState("");

  useEffect(() => {
    if (visitorId && gateId) {
      const encrypted = encryptQR({ visitorId, gateId });
      setQr(encrypted);
    }
  }, [visitorId, gateId]);

  if (!qr) return null;

  return <QRCodeCanvas value={qr} size={180} />;
}
