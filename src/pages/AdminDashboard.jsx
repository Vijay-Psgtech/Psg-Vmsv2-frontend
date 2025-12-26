"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Stack,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useNavigate } from "react-router-dom";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import TodayIcon from '@mui/icons-material/Today';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';


import api from "../utils/api";
import { generateQR } from "../utils/qr";
import Webcam from "react-webcam";
import { useSocket } from "../context/SocketProvider";

/* ---------------- CONSTANTS ---------------- */
const STATUS_TABS = ["PENDING", "APPROVED", "REJECTED", "IN", "OUT"];
const OVERSTAY_LIMIT_MIN = 120;

/* ---------------- TIME UTILS ---------------- */
const minutesBetween = (start, end = new Date()) =>
  start ? Math.floor((new Date(end) - new Date(start)) / 60000) : 0;

const formatDuration = (mins) => `${Math.floor(mins / 60)}h ${mins % 60}m`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const webcamRef = useRef(null);

  const [stats, setStats] = useState({});
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("PENDING");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectId, setRejectId] = useState(null);

  const [selected, setSelected] = useState(null);
  const [faceImage, setFaceImage] = useState(null);
  const [qr, setQr] = useState(null);

  /* ---------------- FETCH ---------------- */
  const fetchAll = async () => {
    const [s, v] = await Promise.all([
      api.get("/visitor/stats"),
      api.get("/visitor"),
    ]);
    setStats(s.data);
    setVisitors(v.data);
  };

  /* ---------------- SOCKET ---------------- */
  useEffect(() => {
    fetchAll().finally(() => setLoading(false));

    if (!socket) return;

    socket.on("VISITOR_PENDING", fetchAll);
    socket.on("VISITOR_APPROVAL", fetchAll);
    socket.on("VISITOR_CHECKIN", fetchAll);
    socket.on("VISITOR_CHECKOUT", fetchAll);

    return () => {
      socket.off("VISITOR_PENDING", fetchAll);
      socket.off("VISITOR_APPROVAL", fetchAll);
      socket.off("VISITOR_CHECKIN", fetchAll);
      socket.off("VISITOR_CHECKOUT", fetchAll);
    };
  }, [socket]);

  /* ---------------- LOGOUT ---------------- */
  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  /* ---------------- FACE CAPTURE ---------------- */
  const captureFace = () => {
    const img = webcamRef.current.getScreenshot();
    setFaceImage(img);
  };

  /* ---------------- APPROVE ---------------- */
  const approveVisitor = async () => {
    if (!selected || !faceImage) return;

    await api.post(`/visitor/approve/${selected._id}`, {
      action: "APPROVED",
      faceImageBase64: faceImage,
    });

    const qrData = await generateQR({
      visitorId: selected._id,
      gateId: selected.gateId,
    });

    setQr(qrData);
    fetchAll();
  };

  /* ---------------- REJECT ---------------- */
  const submitReject = async () => {
    await api.post(`/visitor/approve/${rejectId}`, {
      action: "REJECTED",
      reason: rejectReason,
    });
    setRejectOpen(false);
    setRejectReason("");
    fetchAll();
  };

  /* ---------------- ANALYTICS ---------------- */
  const visitorsWithMetrics = useMemo(() => {
    return visitors.map((v) => {
      const minutesInside = minutesBetween(v.checkInTime, v.checkOutTime);
      return {
        ...v,
        minutesInside,
        isOverstay: v.status === "IN" && minutesInside > OVERSTAY_LIMIT_MIN,
      };
    });
  }, [visitors]);

  const filteredVisitors = useMemo(
    () => visitorsWithMetrics.filter((v) => v.status === tab),
    [visitorsWithMetrics, tab]
  );

  const avgVisitChart = useMemo(() => {
    const map = {};
    visitorsWithMetrics.forEach((v) => {
      if (!v.checkInTime) return;
      const date = new Date(v.checkInTime).toLocaleDateString();
      map[date] = map[date] || [];
      map[date].push(v.minutesInside);
    });

    return Object.entries(map).map(([date, arr]) => ({
      date,
      avgMinutes: Math.floor(arr.reduce((a, b) => a + b, 0) / arr.length),
    }));
  }, [visitorsWithMetrics]);

  if (loading) {
    return (
      <Box p={3} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  const STAT_KEYS = [
    { key: 'today', label: 'Today', icon: <TodayIcon sx={{ color: 'primary.main', fontSize: 28 }} /> },
    { key: 'checkedIn', label: 'Checked In', icon: <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} /> },
    { key: 'checkedOut', label: 'Checked Out', icon: <AccessTimeIcon sx={{ color: 'warning.main', fontSize: 28 }} /> },
  ];


  return (
    <Box p={3}>
      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="h5">Admin Dashboard</Typography>
        <Button color="error" onClick={logout}>
          Logout
        </Button>
      </Stack>

      {/* STATS */}
      <Grid container spacing={2} mt={2}>
        {STAT_KEYS.map((s) => (
          <Grid key={s.key} item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2, boxShadow: 2 }}>
              <Box sx={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper', borderRadius: 1 }}>
                {s.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography color="text.secondary">{s.label}</Typography>
                <Typography variant="h4">{stats?.[s.key] ?? 0}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* APPROVAL DIALOG */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth>
        <DialogTitle>Approve Visitor</DialogTitle>
        <DialogContent>
          <Webcam ref={webcamRef} screenshotFormat="image/jpeg" />
          <Button sx={{ mt: 1 }} onClick={captureFace}>
            Capture Face
          </Button>

          {qr && (
            <Box mt={2} textAlign="center">
              <img src={qr} alt="QR" />
              <Typography>QR Generated</Typography>
              <Button
                sx={{ mt: 1 }}
                href={`http://localhost:5000/api/visitor/badge/${selected._id}`}
                target="_blank"
              >
                Download Badge
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={approveVisitor} disabled={!faceImage}>
            Approve & Generate QR
          </Button>
        </DialogActions>
      </Dialog>

      {/* TABS */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 3 }}>
        {STATUS_TABS.map((s) => (
          <Tab key={s} value={s} label={s} />
        ))}
      </Tabs>

      {/* VISITORS */}
      <Paper sx={{ p: 2 }}>
        {filteredVisitors.map((v) => (
          <Paper key={v._id} sx={{ p: 2, mb: 2 }} variant="outlined">
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={600}>{v.name}</Typography> 
              <Chip label={v.status} />
            </Stack>

            {v.status === "PENDING" && (
              <Stack direction="row" spacing={1} mt={1}>
                <Button size="small" onClick={() => setSelected(v)}>
                  Approve
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => {
                    setRejectId(v._id);
                    setRejectOpen(true);
                  }}
                >
                  Reject
                </Button>
              </Stack>
            )}
          </Paper>
        ))}
      </Paper>

      {/* REJECT */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)}>
        <DialogTitle>Reject Visitor</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button color="error" onClick={submitReject}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
