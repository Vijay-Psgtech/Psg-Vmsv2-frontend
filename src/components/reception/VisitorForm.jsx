import React, { useState } from "react";
import { TextField, Button, Stack, Typography, Alert, Box } from "@mui/material";
import api from "../../utils/api";
import QRCode from "qrcode";
import { useReception } from "./receptionContext";

export default function VisitorForm() {
  const { loadVisitors } = useReception();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    purpose: "",
    host: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null); // Clear error when user starts typing
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

    // Basic validation
    if (!form.name.trim() || !form.phone.trim() || !form.purpose.trim() || !form.host.trim()) {
      setError("All fields are required");
      return;
    }

    // Phone validation (basic)
    if (!/^\d{10}$|^\d{11}$|^\+\d{1,3}\d{9,}$/.test(form.phone.replace(/\s|-/g, ""))) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ⚠️ VERIFY THIS ENDPOINT WITH YOUR BACKEND!
      const res = await api.post("/api/visitor/checkin", form);
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

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Refresh list
      await loadVisitors();
    } catch (err) {
      console.error("Check-in failed:", err);
      setError(err.response?.data?.message || "Check-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500 }}>
      <Typography variant="h6" mb={3} fontWeight={600}>
        Visitor Check-In
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Visitor checked in successfully! QR code opened in new tab.
        </Alert>
      )}

      <Stack spacing={2} component="form" onSubmit={submit}>
        <TextField
          name="name"
          label="Visitor Name"
          value={form.name}
          onChange={handleChange}
          required
          disabled={loading}
          placeholder="Enter full name"
          variant="outlined"
          size="small"
        />

        <TextField
          name="phone"
          label="Phone Number"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          required
          disabled={loading}
          placeholder="10 or 11 digit number"
          variant="outlined"
          size="small"
        />

        <TextField
          name="purpose"
          label="Purpose of Visit"
          value={form.purpose}
          onChange={handleChange}
          required
          disabled={loading}
          placeholder="e.g., Meeting, Delivery, Maintenance"
          variant="outlined"
          size="small"
        />

        <TextField
          name="host"
          label="Host (Department/Person)"
          value={form.host}
          onChange={handleChange}
          required
          disabled={loading}
          placeholder="Who is this visitor meeting?"
          variant="outlined"
          size="small"
        />

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          fullWidth
          sx={{ py: 1.5, fontWeight: 600 }}
        >
          {loading ? "Checking In..." : "Check In"}
        </Button>
      </Stack>
    </Box>
  );
}



