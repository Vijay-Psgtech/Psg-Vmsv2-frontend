"use client";

import React, { useState } from "react";
import { Box, Typography, Button, Paper, Stack } from "@mui/material";
import { useSocket } from "../context/SocketProvider";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function SecurityDashboard() {
  const { user, logoutUser } = useAuth();
  const { connected } = useSocket();

  const [visitorId, setVisitorId] = useState("");
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("");

  /* ---------------- FACE VERIFY ---------------- */
  const verifyFace = async () => {
    if (!image || !visitorId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result;
        const res = await api.post("/visitor/verify-face", {
          visitorId,
          faceImageBase64: base64,
        });

        setStatus(res.data.verified ? "Face Verified ✅" : "Face Mismatch ❌");
      } catch (err) {
        setStatus("Verification Failed");
      }
    };

    reader.readAsDataURL(image);
  };

  /* ---------------- CHECK-IN ---------------- */
  const checkIn = async () => {
    try {
      await api.post(`/visitor/check-in/${visitorId}`);
      setStatus("Checked In Successfully 🟢");
    } catch {
      setStatus("Check-in Failed");
    }
  };

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="h5">
          Security Gate ({user?.gateId || "Unassigned"})
        </Typography>

        <Button color="error" onClick={logoutUser}>
          Logout
        </Button>
      </Stack>

      <Typography mt={1}>
        Socket: {connected ? "🟢 Connected" : "🔴 Offline"}
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Stack spacing={2}>
          <input
            placeholder="Visitor ID / QR ID"
            value={visitorId}
            onChange={(e) => setVisitorId(e.target.value)}
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />

          <Button
            onClick={verifyFace}
            disabled={!image || !visitorId}
          >
            Verify Face
          </Button>

          <Button
            onClick={checkIn}
            disabled={status !== "Face Verified ✅"}
          >
            Allow Entry
          </Button>

          <Button
            href={`http://localhost:5000/api/visitor/badge/${visitorId}`}
            target="_blank"
            disabled={!visitorId}
          >
            Download Badge
          </Button>

          {status && (
            <Typography fontWeight={600}>
              Status: {status}
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}