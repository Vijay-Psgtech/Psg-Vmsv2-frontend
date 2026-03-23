"use client";

import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
} from "@mui/material";

export default function VisitorTimeline({ visitor }) {
  if (!visitor) return null;

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" mb={2}>
        Visitor Timeline – {visitor.name}
      </Typography>

      <Stack spacing={1}>
        {visitor.history.map((h, i) => (
          <Stack key={i} direction="row" spacing={2}>
            <Chip label={h.action} color="info" />
            <Typography variant="body2">
              {new Date(h.at || visitor.updatedAt).toLocaleString()}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
