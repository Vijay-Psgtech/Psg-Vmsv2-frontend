"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Button,
  Divider,
} from "@mui/material";

import api from "../utils/api";
import GateHeatmap from "../components/GateHeatmap";

/* =========================
   HELPERS
========================= */
const overstayMinutes = (v) =>
  Math.max(
    0,
    Math.floor((Date.now() - new Date(v.allowedUntil)) / 60000)
  );

const severityColor = (mins) => {
  if (mins >= 240) return "error";     // CRITICAL
  if (mins >= 120) return "warning";   // HIGH
  return "default";                   // MEDIUM
};

const severityLabel = (mins) => {
  if (mins >= 240) return "CRITICAL";
  if (mins >= 120) return "HIGH";
  return "MEDIUM";
};

export default function AdminOverstayDashboard() {
  const [visitors, setVisitors] = useState([]);
  const [error, setError] = useState("");

  /* =========================
     LOAD VISITORS
  ========================= */
  const loadVisitors = async () => {
    try {
      const res = await api.get("/visitor");
      setVisitors(res.data);
    } catch {
      setError("Failed to load visitor data");
    }
  };

  useEffect(() => {
    loadVisitors();
    const poll = setInterval(loadVisitors, 15000);
    return () => clearInterval(poll);
  }, []);

  /* =========================
     OVERSTAY FILTER
  ========================= */
  const overstayedVisitors = useMemo(() => {
    return visitors
      .filter(
        (v) =>
          v.status === "IN" &&
          v.allowedUntil &&
          new Date(v.allowedUntil) < new Date()
      )
      .map((v) => ({
        ...v,
        overstayMinutes: overstayMinutes(v),
      }))
      .sort((a, b) => b.overstayMinutes - a.overstayMinutes);
  }, [visitors]);

  /* =========================
     CSV EXPORT
  ========================= */
  const exportCSV = () => {
    const rows = [
      "Name,Gate,Host,Overstay Minutes,Severity",
      ...overstayedVisitors.map(
        (v) =>
          `${v.name},${v.gate},${v.host},${v.overstayMinutes},${severityLabel(
            v.overstayMinutes
          )}`
      ),
    ];

    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    window.open(url);
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <Box minHeight="100vh" bgcolor="#F8FAFC" p={4}>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Overstay Monitoring
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Real-time SLA violations and gate-level congestion
      </Typography>

      {error && <Typography color="error">{error}</Typography>}

      {/* ================= GATE HEATMAP ================= */}
      <GateHeatmap visitors={overstayedVisitors} />

      <Divider sx={{ my: 3 }} />

      {/* ================= EXPORT ================= */}
      <Button
        variant="contained"
        color="primary"
        onClick={exportCSV}
        sx={{ mb: 3 }}
      >
        Export Overstay Report (CSV)
      </Button>

      {/* ================= OVERSTAY LIST ================= */}
      <Stack spacing={2}>
        {overstayedVisitors.length === 0 && (
          <Typography>No active overstays 🎉</Typography>
        )}

        {overstayedVisitors.map((v) => (
          <Paper key={v._id} sx={{ p: 2, borderRadius: 2 }}>
            <Typography fontWeight={600}>{v.name}</Typography>

            <Stack direction="row" spacing={2} mt={1} flexWrap="wrap">
              <Chip label={`Gate ${v.gate}`} />
              <Chip label={`Host: ${v.host}`} />

              <Chip
                label={`Overstay ${v.overstayMinutes} min`}
                color={severityColor(v.overstayMinutes)}
              />

              <Chip
                label={severityLabel(v.overstayMinutes)}
                color={severityColor(v.overstayMinutes)}
                variant="outlined"
              />
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}