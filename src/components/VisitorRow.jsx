import { generateVisitorQR } from "@/utils/qr";
import { useState } from "react";

export default function VisitorRow({ visitor }) {
  const [qr, setQr] = useState(null);

  const showQR = async () => {
    const data = await generateVisitorQR(
      visitor.visitorId,
      visitor.gate
    );
    setQr(data);
  };

  return (
    <>
      <button onClick={showQR}>Show QR</button>
      {qr && <img src={qr} className="w-40 mt-2" />}
    </>
  );
}
