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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import api from "../../utils/api";

export default function VisitorList({ visitors = [], onUpdate }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [openModal, setOpenModal] = useState(false);

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

  /* ================= ACTIONS ================= */
  const handleViewDetails = (visitor) => {
    setSelectedVisitor(visitor);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedVisitor(null);
  };

  const handleStatusChange = async (visitorId, newStatus) => {
    setLoading(true);
    try {
      // ⚠️ VERIFY THIS ENDPOINT WITH YOUR BACKEND!
      await api.post(`/api/visitor/${newStatus.toLowerCase()}/${visitorId}`);
      
      if (onUpdate) {
        await onUpdate();
      }
      
      handleCloseModal();
    } catch (err) {
      console.error("Status update failed:", err);
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setLoading(false);
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

  /* ================= CLEAR FILTERS ================= */
  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPage(0);
  };

  return (
    <Box>
      {/* STATS BAR */}
      <Stack
        direction="row"
        spacing={2}
        mb={3}
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: "#f9fafb",
          border: "1px solid #e5e7eb",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography fontSize={11} color="text.secondary" fontWeight={600}>
            TOTAL
          </Typography>
          <Typography fontWeight={700} fontSize={24} color="primary">
            {stats.total}
          </Typography>
        </Box>
        <Box>
          <Typography fontSize={11} color="text.secondary" fontWeight={600}>
            PENDING
          </Typography>
          <Typography fontWeight={700} fontSize={24} sx={{ color: "#f59e0b" }}>
            {stats.pending}
          </Typography>
        </Box>
        <Box>
          <Typography fontSize={11} color="text.secondary" fontWeight={600}>
            APPROVED
          </Typography>
          <Typography fontWeight={700} fontSize={24} sx={{ color: "#10b981" }}>
            {stats.approved}
          </Typography>
        </Box>
        <Box>
          <Typography fontSize={11} color="text.secondary" fontWeight={600}>
            INSIDE
          </Typography>
          <Typography fontWeight={700} fontSize={24} sx={{ color: "#3b82f6" }}>
            {stats.inside}
          </Typography>
        </Box>
      </Stack>

      {/* SEARCH & FILTER BAR */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2} alignItems="flex-end">
        <TextField
          size="small"
          placeholder="Search by name, phone, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
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

        <Tooltip title="Refresh Data">
          <IconButton onClick={handleRefresh} disabled={loading} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>

        {(search || statusFilter !== "ALL") && (
          <Tooltip title="Clear Filters">
            <IconButton onClick={handleClearFilters} color="error" size="small">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* TABLE */}
      {loading && !paginatedVisitors.length ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f9fafb" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Host</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Gate</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }} align="center">
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
                        <Typography fontSize={13} fontWeight={700} color="primary">
                          {v.visitorId || v._id?.slice(-6)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={14} fontWeight={600}>
                          {v.name}
                        </Typography>
                        {v.company && (
                          <Typography fontSize={11} color="text.secondary">
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
                        {v.gate ? (
                          <Chip label={`Gate ${v.gate}`} size="small" variant="outlined" />
                        ) : (
                          <Typography fontSize={12} color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={v.status}
                          size="small"
                          sx={{
                            ...statusStyle,
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={12} color="text.secondary">
                          {new Date(v.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </Typography>
                        <Typography fontSize={11} color="text.secondary">
                          {new Date(v.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDetails(v)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {paginatedVisitors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary" fontSize={14}>
                        {search || statusFilter !== "ALL"
                          ? "📭 No visitors found matching your filters"
                          : "📭 No visitors registered yet"}
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

      {/* VISITOR DETAILS MODAL */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>
          Visitor Details
        </DialogTitle>

        {selectedVisitor && (
          <>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    VISITOR ID
                  </Typography>
                  <Typography>{selectedVisitor.visitorId}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    NAME
                  </Typography>
                  <Typography>{selectedVisitor.name}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    PHONE
                  </Typography>
                  <Typography>{selectedVisitor.phone}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    PURPOSE
                  </Typography>
                  <Typography>{selectedVisitor.purpose}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    HOST
                  </Typography>
                  <Typography>{selectedVisitor.host}</Typography>
                </Box>

                {selectedVisitor.company && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      COMPANY
                    </Typography>
                    <Typography>{selectedVisitor.company}</Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    GATE
                  </Typography>
                  <Typography>{selectedVisitor.gate || "Not assigned"}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    CURRENT STATUS
                  </Typography>
                  <Chip
                    label={selectedVisitor.status}
                    sx={{
                      ...getStatusColor(selectedVisitor.status),
                      fontWeight: 700,
                      mt: 0.5,
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    CHECK-IN TIME
                  </Typography>
                  <Typography>
                    {new Date(selectedVisitor.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Box>

                {selectedVisitor.checkoutTime && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      CHECK-OUT TIME
                    </Typography>
                    <Typography>
                      {new Date(selectedVisitor.checkoutTime).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              {selectedVisitor.status === "PENDING" && (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() =>
                      handleStatusChange(selectedVisitor._id, "REJECT")
                    }
                    disabled={loading}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() =>
                      handleStatusChange(selectedVisitor._id, "APPROVE")
                    }
                    disabled={loading}
                  >
                    Approve
                  </Button>
                </>
              )}

              {selectedVisitor.status === "APPROVED" && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleStatusChange(selectedVisitor._id, "IN")}
                  disabled={loading}
                >
                  Check In
                </Button>
              )}

              {selectedVisitor.status === "IN" && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleStatusChange(selectedVisitor._id, "OUT")}
                  disabled={loading}
                >
                  Check Out
                </Button>
              )}

              <Button onClick={handleCloseModal} variant="text">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}