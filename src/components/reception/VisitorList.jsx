"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Chip,
  Stack,
  InputAdornment,
  TableContainer,
  TablePagination,
  Tooltip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";

export default function VisitorList({ visitors = [], onUpdate }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  /* ================= FILTERING ================= */
  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      const matchSearch =
        v.name?.toLowerCase().includes(search.toLowerCase()) ||
        v.phone?.includes(search) ||
        v.visitorId?.toLowerCase().includes(search.toLowerCase()) ||
        v.host?.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" || v.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [visitors, search, statusFilter]);

  /* ================= PAGINATION ================= */
  const paginatedVisitors = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredVisitors.slice(start, start + rowsPerPage);
  }, [filteredVisitors, page, rowsPerPage]);

  /* ================= STATUS COLOR ================= */
  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return { bgcolor: "#fef3c7", color: "#92400e" };
      case "APPROVED":
        return { bgcolor: "#d1fae5", color: "#065f46" };
      case "IN":
        return { bgcolor: "#dbeafe", color: "#1e40af" };
      case "OVERSTAY":
        return { bgcolor: "#fee2e2", color: "#991b1b" };
      case "OUT":
        return { bgcolor: "#e5e7eb", color: "#374151" };
      case "REJECTED":
        return { bgcolor: "#fecaca", color: "#7f1d1d" };
      default:
        return { bgcolor: "#f3f4f6", color: "#6b7280" };
    }
  };

  /* ================= REFRESH ================= */
  const handleRefresh = async () => {
    setLoading(true);
    if (onUpdate) await onUpdate();
    setTimeout(() => setLoading(false), 500);
  };

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    return {
      total: visitors.length,
      pending: visitors.filter((v) => v.status === "PENDING").length,
      approved: visitors.filter((v) => v.status === "APPROVED").length,
      inside: visitors.filter((v) => v.status === "IN").length,
    };
  }, [visitors]);

  return (
    <Box>
      {/* STATS BAR */}
      <Stack
        direction="row"
        spacing={2}
        mb={2}
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: "#f9fafb",
          border: "1px solid #e5e7eb",
        }}
      >
        <Box>
          <Typography fontSize={11} color="text.secondary">
            Total
          </Typography>
          <Typography fontWeight={700} fontSize={20}>
            {stats.total}
          </Typography>
        </Box>
        <Box>
          <Typography fontSize={11} color="text.secondary">
            Pending
          </Typography>
          <Typography fontWeight={700} fontSize={20} color="#f59e0b">
            {stats.pending}
          </Typography>
        </Box>
        <Box>
          <Typography fontSize={11} color="text.secondary">
            Approved
          </Typography>
          <Typography fontWeight={700} fontSize={20} color="#10b981">
            {stats.approved}
          </Typography>
        </Box>
        <Box>
          <Typography fontSize={11} color="text.secondary">
            Inside
          </Typography>
          <Typography fontWeight={700} fontSize={20} color="#3b82f6">
            {stats.inside}
          </Typography>
        </Box>
      </Stack>

      {/* SEARCH & FILTER BAR */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
        <TextField
          size="small"
          placeholder="Search visitor by name, phone, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status Filter"
            startAdornment={
              <InputAdornment position="start">
                <FilterListIcon fontSize="small" color="action" />
              </InputAdornment>
            }
          >
            <MenuItem value="ALL">All Status</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="IN">Inside</MenuItem>
            <MenuItem value="OVERSTAY">Overstay</MenuItem>
            <MenuItem value="OUT">Checked Out</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </Select>
        </FormControl>

        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} disabled={loading} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* TABLE */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f9fafb" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Visitor ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Host</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Gate</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Registered At</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedVisitors.map((v) => {
                  const statusStyle = getStatusColor(v.status);
                  return (
                    <TableRow
                      key={v._id}
                      hover
                      sx={{
                        "&:hover": { bgcolor: "#f9fafb" },
                      }}
                    >
                      <TableCell>
                        <Typography fontSize={13} fontWeight={600} color="primary">
                          {v.visitorId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={14} fontWeight={500}>
                          {v.name}
                        </Typography>
                        {v.company && (
                          <Typography fontSize={12} color="text.secondary">
                            {v.company}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13}>{v.phone}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13}>{v.host}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`Gate ${v.gate}`} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={v.status}
                          size="small"
                          sx={{
                            ...statusStyle,
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={12} color="text.secondary">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography fontSize={11} color="text.secondary">
                          {new Date(v.createdAt).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {paginatedVisitors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {search || statusFilter !== "ALL"
                          ? "No visitors found matching your filters"
                          : "No visitors registered yet"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* PAGINATION */}
          <TablePagination
            component="div"
            count={filteredVisitors.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </>
      )}
    </Box>
  );
}