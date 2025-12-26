import React, { useState } from "react";
import { TextField, Button, Stack, Typography } from "@mui/material";
import api from "../../utils/api";
import QRCode from "qrcode";
import { useReception } from "./receptionContext";

export default function VisitorForm() {
  // Safe context access
  const reception = typeof useReception === "function" ? useReception() : null;
  const fetchVisitors = reception?.fetchVisitors;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    purpose: "",
    host: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // QR generation
  const generateQR = async (visitor) => {
    try {
      return await QRCode.toDataURL(
        JSON.stringify({
          visitorId: visitor._id,
          name: visitor.name,
          phone: visitor.phone,
          purpose: visitor.purpose,
        })
      );
    } catch (err) {
      console.error("QR generation failed", err);
      return null;
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ FIX: send `form`, not `formData`
      const res = await api.post("/visitor/checkin", form);
      const visitor = res.data;

      // Generate QR
      const qr = await generateQR(visitor);
      if (qr) {
        window.open(qr, "_blank");
      }

      // Reset form
      setForm({
        name: "",
        phone: "",
        purpose: "",
        host: "",
      });

      // Refresh list if context exists
      fetchVisitors?.();
    } catch (err) {
      console.error("Check-in failed:", err);
      alert(err.response?.data?.error || "Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography variant="h6" mb={2}>
        Visitor Check-In
      </Typography>

      <Stack spacing={2} component="form" onSubmit={submit}>
        <TextField
          name="name"
          label="Visitor Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <TextField
          name="phone"
          label="Phone"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <TextField
          name="purpose"
          label="Purpose"
          value={form.purpose}
          onChange={handleChange}
          required
        />

        <TextField
          name="host"
          label="Host"
          value={form.host}
          onChange={handleChange}
          required
        />

        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Checking In..." : "Check In"}
        </Button>
      </Stack>
    </>
  );
}



