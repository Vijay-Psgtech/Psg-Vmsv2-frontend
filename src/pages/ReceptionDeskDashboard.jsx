"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Divider,
  Avatar,
  Card,
  CardContent,
  Badge,
  IconButton,
  Drawer,
  Chip,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";

import LogoutIcon from "@mui/icons-material/Logout";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import WarningIcon from "@mui/icons-material/Warning";

import VisitorRegistrationForm from "../components/VisitorRegistrationForm";
import VisitorList from "../components/reception/VisitorList";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import io from "socket.io-client";

export default function ReceptionDeskDashboard() {
  const { user, logoutUser } = useAuth();

  const [visitors, setVisitors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertDrawer, setAlertDrawer] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [, forceUpdate] = useState(0);

  /* ================= SOCKET.IO ================= */
  useEffect(() => {
    const socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
    });

    socket.on("visitors:update", (data) => {
      setVisitors(data || []);
    });

    socket.on("alert:new", (alert) => {
      setAlerts((prev) => [alert, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  /* ================= LOAD DATA ================= */
  const loadVisitors = async () => {
    const res = await api.get("/visitor");
    setVisitors(res.data || []);
  };

  const loadAlerts = async () => {
    const res = await api.get("/alert");
    setAlerts(res.data || []);
  };

  useEffect(() => {
    loadVisitors();
    loadAlerts();

    const interval = setInterval(() => {
      loadVisitors();
      loadAlerts();
    }, 10000);

    const timer = setInterval(() => forceUpdate((n) => n + 1), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    return {
      total: visitors.length,
      pending: visitors.filter((v) => v.status === "PENDING").length,
      approved: visitors.filter((v) => v.status === "APPROVED").length,
      inside: visitors.filter((v) => v.status === "IN").length,
      completed: visitors.filter((v) => v.status === "OUT").length + visitors.filter((v) => v.status === "REJECTED").length,
    };
  }, [visitors]);

  const handleRegistrationSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 5000);
    loadVisitors();
  };

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

  return (
    <Box minHeight="100vh" p={4} bgcolor="#F8FAFC">
      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" mb={4}>
        <Stack direction="row" spacing={2}>
          <Avatar sx={{ bgcolor: "#10b981" }}>
            <PersonAddIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Reception Desk
            </Typography>
            <Typography fontSize={14} color="text.secondary">
              {user?.name} - Visitor Registration
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2}>
          <IconButton onClick={() => setAlertDrawer(true)}>
            <Badge badgeContent={alerts.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Button color="error" onClick={logoutUser} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Stack>
      </Stack>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* STATS */}
      <Grid container spacing={2} mb={4}>
        {[
          { label: "Total Registered", value: stats.total },
          { label: "Pending Approval", value: stats.pending },
          { label: "Approved", value: stats.approved },
          { label: "Currently Inside", value: stats.inside },
          { label: "Completed", value: stats.completed },
        ].map(({ label, value }) => (
          <Grid key={label} size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Typography fontSize={13}>{label}</Typography>
                <Typography variant="h4">{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* MAIN CONTENT */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 3 }}>
            <VisitorRegistrationForm onSuccess={handleRegistrationSuccess} />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3 }}>
            <VisitorList visitors={visitors} onUpdate={loadVisitors} />
          </Paper>
        </Grid>
      </Grid>

      {/* ALERT DRAWER */}
      <Drawer anchor="right" open={alertDrawer} onClose={() => setAlertDrawer(false)}>
        <Box width={400} p={3}>
          {alerts.map((alert) => (
            <Card key={alert._id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography fontWeight={600}>{alert.title}</Typography>
                <Typography fontSize={13}>{alert.message}</Typography>
                <Button size="small" onClick={() => markAlertAsRead(alert._id)}>
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Drawer>
    </Box>
  );
}