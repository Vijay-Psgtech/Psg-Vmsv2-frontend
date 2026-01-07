import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  Divider,
  TextField,
  Avatar,
  Tab,
  Tabs,
  Badge,
  IconButton,
  Drawer,
  Card,
  CardContent,
  Grid,
} from "@mui/material";

import LogoutIcon from "@mui/icons-material/Logout";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DoorFrontIcon from "@mui/icons-material/DoorFront";
import BusinessIcon from "@mui/icons-material/Business";
import WarningIcon from "@mui/icons-material/Warning";
import SecurityIcon from "@mui/icons-material/Security";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import api from "../utils/api";

export default function SecurityDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [visitors, setVisitors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState("");
  const [alertDrawer, setAlertDrawer] = useState(false);
  const [, forceTick] = useState(0);

  useEffect(() => {
    loadVisitors();
    loadAlerts();

    const pollInterval = setInterval(() => {
      loadVisitors();
      loadAlerts();
    }, 5000);

    const tickInterval = setInterval(() => forceTick((n) => n + 1), 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(tickInterval);
    };
  }, []);

  const loadVisitors = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("visitor/visitorList", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.data) throw new Error("Failed to load visitors");

      const data = res.data || [];
      console.log("Loaded visitors:", data);
      setVisitors(data);
      setError("");
    } catch (err) {
      console.error("Load error:", err);
      setError("Failed to load visitors");
    }
  };

  const loadAlerts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/alert", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data) {
        const data = res.data;
        setAlerts(data || []);
      }
    } catch (err) {
      console.error("Failed to load alerts", err);
    }
  };

  const checkIn = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/visitor/check-in/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.data) {
        throw new Error("Check-in failed");
      }

      await loadVisitors();
      alert("Visitor checked in successfully");
    } catch (err) {
      alert(err.message || "Check-in failed");
    }
  };

  const checkOut = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/visitor/check-out/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.data) {
        throw new Error("Check-out failed");
      }

      await loadVisitors();
      alert("Visitor checked out successfully");
    } catch (err) {
      alert(err.message || "Check-out failed");
    }
  };

  const markAlertAsRead = async (alertId) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(`/alert/${alertId}/read`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
    } catch (err) {
      console.error("Failed to mark alert as read", err);
    }
  };

  const liveDuration = (start) => {
    if (!start) return "-";
    const diff = Date.now() - new Date(start).getTime();
    const s = Math.floor(diff / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m ${s % 60}s`;
  };

  const isOverstay = (v) => v.allowedUntil && new Date(v.allowedUntil) < new Date();

  const overstayMinutes = (v) => {
    if (!isOverstay(v)) return 0;
    return Math.floor((Date.now() - new Date(v.allowedUntil)) / 60000);
  };

  const overstaySeverity = (mins) => {
    if (mins >= 120) return { label: "CRITICAL", color: "error" };
    if (mins >= 60) return { label: "HIGH", color: "warning" };
    if (mins >= 30) return { label: "MEDIUM", color: "warning" };
    return { label: "LOW", color: "info" };
  };

  const normalizeGate = (gate) => {
    if (!gate) return null;
    if (typeof gate === "object") return gate._id || gate.name || null;
    return String(gate);
  };

  const visibleVisitors = useMemo(() => {
    return visitors.filter((v) => {
      if (user?.role === "security") {
        if (!user?.gateId || !v.gate) return false;

        const visitorGate = normalizeGate(v.gate);
        const userGate = normalizeGate(user.gateId);

        if (String(visitorGate) !== String(userGate)) return false;
      }

      const matchSearch =
        !search ||
        v.name?.toLowerCase().includes(search.toLowerCase()) ||
        v.phone?.includes(search) ||
        v.visitorId?.toUpperCase().includes(search.toUpperCase());

      let matchTab = true;

      if (tabValue === 0) {
        matchTab = ["PENDING", "APPROVED"].includes(v.status);
      } else if (tabValue === 1) {
        matchTab = ["IN", "OVERSTAY"].includes(v.status);
      } else if (tabValue === 2) {
        matchTab = ["OUT"].includes(v.status);
      }

      return matchSearch && matchTab;
    });
  }, [visitors, search, tabValue, user]);

  const stats = useMemo(() => {
    const myVisitors = visitors.filter((v) => {
      if (!user?.gateId || !v.gate) return false;

      const visitorGate = normalizeGate(v.gate);
      const userGate = normalizeGate(user.gateId);

      return String(visitorGate) === String(userGate);
    });

    return {
      approved: myVisitors.filter((v) => ["PENDING", "APPROVED"].includes(v.status)).length,
      inside: myVisitors.filter((v) => v.status === "IN").length,
      completed: myVisitors.filter((v) => v.status === "OUT").length,
      overstay: myVisitors.filter((v) => v.status === "OVERSTAY").length,
      total: myVisitors.filter((v) =>
        ["PENDING", "APPROVED", "IN", "OUT", "OVERSTAY"].includes(v.status)
      ).length,
    };
  }, [visitors, user]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "#ef4444";
      case "HIGH":
        return "#f59e0b";
      case "MEDIUM":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <Box minHeight="100vh" bgcolor="#F8FAFC" p={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: "#2563EB", width: 56, height: 56 }}>
            <SecurityIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Security Dashboard
            </Typography>
            <Typography fontSize={14} color="text.secondary">
              Gate {user?.gateId} - {user?.name}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2}>
          <IconButton onClick={() => setAlertDrawer(true)} color="inherit">
            <Badge badgeContent={alerts.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={logout}>
            Logout
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} mb={3}>
        {[
          ["Total Active", stats.total, "#3b82f6"],
          ["Waiting Check-in", stats.approved, "#10b981"],
          ["Currently Inside", stats.inside, "#f59e0b"],
          ["Completed", stats.completed, "#6b7280"],
          ["Overstay Alert", stats.overstay, "#ef4444"],
        ].map(([label, value, color]) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                borderLeft: `4px solid ${color}`,
              }}
            >
              <Typography fontSize={13} color="text.secondary" fontWeight={500}>
                {label}
              </Typography>
              <Typography variant="h4" fontWeight={700} mt={1} sx={{ color }}>
                {value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={`Waiting Check-in (${stats.approved})`} />
          <Tab label={`Inside (${stats.inside + stats.overstay})`} />
          <Tab label={`Completed (${stats.completed})`} />
        </Tabs>
      </Paper>

      <TextField
        fullWidth
        placeholder="Search by name, phone, or visitor ID"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, maxWidth: 400 }}
      />

      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}

      {visibleVisitors.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Typography color="text.secondary">
            {visitors.length === 0 ? "No visitors registered yet" : "No visitors for your gate"}
          </Typography>
        </Paper>
      )}

      <Stack spacing={3}>
        {visibleVisitors.map((v) => {
          const overstay = isOverstay(v);
          const mins = overstay ? overstayMinutes(v) : 0;
          const severity = overstay ? overstaySeverity(mins) : null;

          return (
            <Paper
              key={v._id}
              sx={{
                p: 3,
                borderRadius: 3,
                borderLeft: `6px solid ${v.status === "OVERSTAY" ? "#ef4444" : "#2563EB"}`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight={600}>
                    {v.name}
                  </Typography>

                  <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={1}>
                    <Chip icon={<PhoneIcon />} label={v.phone} size="small" />
                    {v.company && <Chip icon={<BusinessIcon />} label={v.company} size="small" />}
                  </Stack>

                  <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={1}>
                    <Chip
                      icon={<DoorFrontIcon />}
                      label={`Gate ${typeof v.gate === "object" ? v.gate.name || v.gate._id : v.gate}`}
                      size="small"
                    />
                    <Chip icon={<PersonIcon />} label={`Host: ${v.host}`} size="small" />
                    <Chip
                      label={v.status}
                      size="small"
                      color={
                        v.status === "PENDING"
                          ? "warning"
                          : v.status === "APPROVED"
                          ? "success"
                          : v.status === "IN"
                          ? "primary"
                          : v.status === "OVERSTAY"
                          ? "error"
                          : "default"
                      }
                    />
                  </Stack>

                  {v.status === "IN" && v.checkInTime && (
                    <Chip
                      icon={<AccessTimeIcon />}
                      label={`Inside ${liveDuration(v.checkInTime)}`}
                      color="primary"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}

                  {(v.status === "IN" || v.status === "OVERSTAY") && overstay && (
                    <Chip
                      icon={<WarningIcon />}
                      label={`OVERSTAY ${mins} min (${severity.label})`}
                      color={severity.color}
                      size="small"
                      sx={{ mt: 1, ml: 1 }}
                    />
                  )}

                  {v.purpose && (
                    <Typography fontSize={13} color="text.secondary" mt={1}>
                      Purpose: {v.purpose}
                    </Typography>
                  )}

                  {v.vehicleNumber && (
                    <Typography fontSize={13} color="text.secondary" mt={1}>
                      Vehicle: {v.vehicleNumber}
                    </Typography>
                  )}

                  <Typography fontSize={12} color="text.secondary" mt={1}>
                    ID: {v.visitorId}
                  </Typography>
                </Box>

                <Stack spacing={1} justifyContent="center">
                  {v.status === "APPROVED" && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => checkIn(v._id)}
                      sx={{ minWidth: 140 }}
                    >
                      Check In
                    </Button>
                  )}

                  {(v.status === "IN" || v.status === "OVERSTAY") && (
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => checkOut(v._id)}
                      sx={{ minWidth: 140 }}
                    >
                      Check Out
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      <Drawer anchor="right" open={alertDrawer} onClose={() => setAlertDrawer(false)}>
        <Box width={400} p={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight={600}>
              Alerts ({alerts.length})
            </Typography>
            <IconButton onClick={() => setAlertDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Stack spacing={2}>
            {alerts.length === 0 && (
              <Typography color="text.secondary" textAlign="center" py={4}>
                No alerts for your gate
              </Typography>
            )}

            {alerts.map((alert) => (
              <Card key={alert._id} sx={{ borderLeft: `4px solid ${getSeverityColor(alert.severity)}` }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <WarningIcon fontSize="small" sx={{ color: getSeverityColor(alert.severity) }} />
                    <Chip
                      label={alert.severity}
                      size="small"
                      sx={{ bgcolor: `${getSeverityColor(alert.severity)}20` }}
                    />
                    <Chip label={alert.type} size="small" />
                  </Stack>

                  <Typography fontWeight={600} fontSize={14}>
                    {alert.title}
                  </Typography>

                  <Typography fontSize={13} color="text.secondary" mt={1}>
                    {alert.message}
                  </Typography>

                  {alert.visitor && (
                    <Typography fontSize={12} color="text.secondary" mt={1}>
                      Visitor: {alert.visitor.name} ({alert.visitor.visitorId})
                    </Typography>
                  )}

                  <Divider sx={{ my: 1 }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontSize={11} color="text.secondary">
                      {new Date(alert.createdAt).toLocaleString()}
                    </Typography>

                    <Button size="small" onClick={() => markAlertAsRead(alert._id)}>
                      Dismiss
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}