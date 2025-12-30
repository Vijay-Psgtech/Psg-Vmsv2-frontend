"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
} from "@mui/material";
import api from "../utils/api";

export default function SecurityReport() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    api.get("/audit").then((res) => {
      const bySecurity = {};

      res.data.forEach((l) => {
        if (l.actorRole !== "security") return;

        bySecurity[l.actorId] ??= {
          checkIn: 0,
          checkOut: 0,
        };

        if (l.action === "VISITOR_CHECK_IN") {
          bySecurity[l.actorId].checkIn++;
        }
        if (l.action === "VISITOR_CHECK_OUT") {
          bySecurity[l.actorId].checkOut++;
        }
      });

      setStats(Object.entries(bySecurity));
    });
  }, []);

  return (
    <Box p={4}>
      <Typography variant="h5" mb={2}>
        Security Performance
      </Typography>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Security ID</TableCell>
              <TableCell>Check-Ins</TableCell>
              <TableCell>Check-Outs</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.map(([id, s]) => (
              <TableRow key={id}>
                <TableCell>{id}</TableCell>
                <TableCell>{s.checkIn}</TableCell>
                <TableCell>{s.checkOut}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}