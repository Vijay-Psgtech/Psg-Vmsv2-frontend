import React, { useEffect, useRef, useState } from "react";

export default function FaceCapture({ onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      await videoRef.current.play();
      setReady(true);
    } catch (err) {
      console.error("Camera error:", err.name);

      if (err.name === "NotFoundError") {
        alert("No camera device found");
      } else if (err.name === "NotAllowedError") {
        alert("Camera permission denied");
      } else {
        alert("Unable to access camera");
      }
    }
  };

  const capture = () => {
    if (!videoRef.current || !ready) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);

    onCapture(canvas.toDataURL("image/png"));
  };

  useEffect(() => {
    return () => {
      // cleanup camera on unmount
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        width={320}
        height={240}
      />

      <div>
        <button onClick={startCamera}>Start</button>
        <button onClick={capture} disabled={!ready}>
          Capture
        </button>
      </div>
    </div>
  );
}
