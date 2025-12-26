import React, { useState } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";

import api from "../../utils/api";
import { useReception } from "./receptionContext";

export default function VisitorList() {
  const reception = useReception();

  const visitors = reception?.visitors || [];
  const loading = reception?.loading;
  const fetchVisitors = reception?.fetchVisitors;

  const [q, setQ] = useState("");

  const checkout = async (id) => {
    try {
      await api.post(`/visitor/checkout/${id}`);
      fetchVisitors?.();
    } catch (err) {
      console.error("Checkout failed", err);
      alert(err.response?.data?.message || "Checkout failed");
    }
  };

  const filtered = visitors.filter((v) => {
    const name = v?.name?.toLowerCase() || "";
    const phone = v?.phone || "";
    return (
      name.includes(q.toLowerCase()) ||
      phone.includes(q)
    );
  });

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Visitors</Typography>
        <TextField
          size="small"
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </Box>

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Table */}
      {!loading && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Host</TableCell>
              <TableCell>Check-In</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.map((v) => (
              <TableRow key={v._id}>
                <TableCell>{v.name}</TableCell>
                <TableCell>{v.phone}</TableCell>
                <TableCell>{v.host}</TableCell>
                <TableCell>
                  {v.checkInTime
                    ? new Date(v.checkInTime).toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell>{v.status}</TableCell>
                <TableCell>
                  {v.status === "checked-in" && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => checkout(v._id)}
                    >
                      Checkout
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No visitors found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
