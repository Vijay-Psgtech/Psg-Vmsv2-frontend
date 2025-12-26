import React from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function QRCodeDisplay({ visitorId }) {
  if (!visitorId) return null;

  return (
    <div className="flex flex-col items-center">
      <QRCodeCanvas value={visitorId} size={180} />

      <p className="text-xs text-gray-600 mt-2">
        Visitor ID: {visitorId}
      </p>
    </div>
  );
}
