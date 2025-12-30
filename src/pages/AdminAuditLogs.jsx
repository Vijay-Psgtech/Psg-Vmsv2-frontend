"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  MenuItem,
  Stack,
  Button,
} from "@mui/material";
import api from "../utils/api";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    action: "",
    role: "",
  });

  const loadLogs = async () => {
    const res = await api.get("/audit", { params: filters });
    setLogs(res.data);
  };

  useEffect(() => {
    loadLogs();
  }, [filters]);

  return (
    <Box p={4}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Audit Logs
      </Typography>

      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          select
          label="Action"
          value={filters.action}
          onChange={(e) =>
            setFilters({ ...filters, action: e.target.value })
          }
          sx={{ width: 200 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="VISITOR_CREATED">Created</MenuItem>
          <MenuItem value="VISITOR_CHECK_IN">Check-In</MenuItem>
          <MenuItem value="VISITOR_CHECK_OUT">Check-Out</MenuItem>
        </TextField>

        <TextField
          select
          label="Role"
          value={filters.role}
          onChange={(e) =>
            setFilters({ ...filters, role: e.target.value })
          }
          sx={{ width: 200 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="security">Security</MenuItem>
          <MenuItem value="reception">Reception</MenuItem>
        </TextField>

        <Button
          variant="outlined"
          onClick={() => window.open("/api/audit/csv")}
        >
          Export CSV
        </Button>
      </Stack>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Gate</TableCell>
              <TableCell>IP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l._id}>
                <TableCell>
                  {new Date(l.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>{l.actorRole}</TableCell>
                <TableCell>{l.action}</TableCell>
                <TableCell>{l.gateId || "-"}</TableCell>
                <TableCell>{l.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}