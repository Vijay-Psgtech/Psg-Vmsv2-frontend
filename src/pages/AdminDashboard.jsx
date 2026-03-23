/**
 * ADMIN DASHBOARD - FULLY ENHANCED
 * New features:
 * 1. Status filter dropdown on table
 * 2. Export to CSV + PDF (jsPDF via CDN)
 * 3. 7-day visitor trend chart (Recharts AreaChart)
 * 4. Auto-refresh every 30s with live countdown + last-updated timestamp
 * 5. Visitor detail side drawer with full timeline
 * 6. Bulk approve / reject with checkbox selection
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, Paper, Stack, TextField, Typography,
  Avatar, Chip, Badge, Alert, CircularProgress, Drawer, Container,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Tooltip, MenuItem, Select, FormControl, InputLabel,
  Checkbox, Stepper, Step, StepLabel, StepContent, Divider, LinearProgress,
  InputAdornment,
} from "@mui/material";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer,
} from "recharts";

import CheckCircleIcon  from "@mui/icons-material/CheckCircle";
import CancelIcon       from "@mui/icons-material/Cancel";
import LogoutIcon       from "@mui/icons-material/Logout";
import PersonIcon       from "@mui/icons-material/Person";
import RefreshIcon      from "@mui/icons-material/Refresh";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon        from "@mui/icons-material/Close";
import WarningIcon      from "@mui/icons-material/Warning";
import SearchIcon       from "@mui/icons-material/Search";
import InfoIcon         from "@mui/icons-material/Info";
import TrendingUpIcon   from "@mui/icons-material/TrendingUp";
import DownloadIcon     from "@mui/icons-material/Download";
import FilterListIcon   from "@mui/icons-material/FilterList";
import TimelineIcon     from "@mui/icons-material/Timeline";
import VisibilityIcon   from "@mui/icons-material/Visibility";
import SelectAllIcon    from "@mui/icons-material/SelectAll";
import DoneAllIcon      from "@mui/icons-material/DoneAll";
import BlockIcon        from "@mui/icons-material/Block";

import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketProvider";
import { api } from "../utils/api";
import { logger } from "../utils/logger";

// ─── Helpers ─────────────────────────────────────────────────────────────
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function fmtDT(d)   { return d ? new Date(d).toLocaleString("en-IN",    { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"; }
function fmtTime(d) { return d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"; }

function extractVisitors(res) {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.visitors)) return d.visitors;
  if (Array.isArray(d.data)) return d.data;
  return [];
}

// ─── CSV Export ───────────────────────────────────────────────────────────
function exportCSV(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
    download: `${filename}_${new Date().toISOString().slice(0, 10)}.csv`,
  });
  a.click();
}

// ─── PDF Export (jsPDF from CDN) ──────────────────────────────────────────
async function exportPDF(rows, title) {
  if (!rows.length) return;
  if (!window.jspdf) {
    await new Promise((ok, err) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = ok; s.onerror = err;
      document.head.appendChild(s);
    });
    await new Promise((ok, err) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js";
      s.onload = ok; s.onerror = err;
      document.head.appendChild(s);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  const keys = Object.keys(rows[0]);
  doc.autoTable({
    head: [keys],
    body: rows.map(r => keys.map(k => String(r[k] ?? ""))),
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });
  doc.save(`${title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function buildExportRows(visitors) {
  return visitors.map(v => ({
    "Visitor ID":   v.visitorId || v._id,
    "Name":         v.name,
    "Email":        v.email,
    "Phone":        v.phone || "",
    "Company":      v.company || "",
    "Host":         v.host || "",
    "Gate":         v.gate || "",
    "Purpose":      v.purpose || "",
    "Status":       v.status,
    "Duration(min)": v.expectedDuration || "",
    "Booked":       fmtDate(v.createdAt),
    "Check-in":     fmtDT(v.checkInTime),
    "Check-out":    fmtDT(v.checkOutTime),
    "Actual(min)":  v.actualDuration || "",
  }));
}

// ─── Stat Card ────────────────────────────────────────────────────────────
const GRAD = {
  amber:   "linear-gradient(135deg,#F59E0B,#FBBF24)",
  emerald: "linear-gradient(135deg,#10B981,#34D399)",
  blue:    "linear-gradient(135deg,#3B82F6,#60A5FA)",
  red:     "linear-gradient(135deg,#EF4444,#F87171)",
  slate:   "linear-gradient(135deg,#6B7280,#9CA3AF)",
};

function StatCard({ label, value, color, icon: Icon, pulse }) {
  return (
    <Box sx={{
      borderRadius: "12px", overflow: "hidden", background: "#fff",
      border: "1px solid #E5E7EB", transition: "all 0.3s",
      animation: pulse ? "pulseCard 1.5s ease-in-out infinite" : "none",
      "&:hover": { borderColor: "#D1D5DB", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)", transform: "translateY(-2px)" },
      "@keyframes pulseCard": { "0%,100%": { borderColor: "#E5E7EB" }, "50%": { borderColor: "#EF4444", boxShadow: "0 0 0 3px #fee2e220" } },
    }}>
      <Box sx={{ background: GRAD[color] || GRAD.slate, p: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {Icon && <Icon sx={{ fontSize: 22, color: "#fff", opacity: 0.9 }} />}
        <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#fff", opacity: 0.85, letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</Typography>
      </Box>
      <CardContent sx={{ p: "16px 20px", pb: "16px !important" }}>
        <Typography sx={{ fontSize: "30px", fontWeight: 700, color: "#111827", letterSpacing: "-1px" }}>{value}</Typography>
      </CardContent>
    </Box>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────
const STATUS_STYLE = {
  PENDING:  { bg: "#FEF3C7", color: "#92400E" },
  APPROVED: { bg: "#DBEAFE", color: "#1E40AF" },
  IN:       { bg: "#D1FAE5", color: "#065F46" },
  OVERSTAY: { bg: "#FEE2E2", color: "#7F1D1D" },
  OUT:      { bg: "#F3F4F6", color: "#374151" },
  REJECTED: { bg: "#FEE2E2", color: "#7F1D1D" },
};
function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
  return <Box sx={{ display: "inline-flex", alignItems: "center", gap: "5px", px: "10px", py: "5px", borderRadius: "6px", bgcolor: s.bg, color: s.color, fontSize: "12px", fontWeight: 600 }}>{status}</Box>;
}

// ─── 7-day chart ──────────────────────────────────────────────────────────
function TrendChart({ visitors }) {
  const data = useMemo(() => {
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    visitors.forEach(v => {
      const k = v.createdAt ? new Date(v.createdAt).toISOString().slice(0, 10) : null;
      if (k && map[k] !== undefined) map[k]++;
    });
    return Object.entries(map).map(([date, count]) => ({ date: date.slice(5), count }));
  }, [visitors]);

  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;

  return (
    <Card sx={{ mb: 3, border: "1px solid #E5E7EB", borderRadius: "10px", boxShadow: "none" }}>
      <CardContent sx={{ p: "20px 24px" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>Visitor Trend — Last 7 Days</Typography>
            <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>{total} total bookings this week</Typography>
          </Box>
          <TrendingUpIcon sx={{ color: "#3B82F6", fontSize: 22 }} />
        </Stack>
        <Box sx={{ height: 140 }}>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
              <ChartTooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #E5E7EB" }} />
              <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} fill="url(#trendGrad)" dot={{ r: 4, fill: "#3B82F6" }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Visitor Detail Drawer ────────────────────────────────────────────────
function VisitorDetailDrawer({ visitor, open, onClose, onApprove, onReject }) {
  if (!visitor) return null;

  const now = new Date();
  const steps = [
    { label: "Booking submitted",  time: visitor.createdAt,   done: true,                  color: "#3B82F6", desc: `Booked to meet ${visitor.host || "—"} at Gate ${visitor.gate}` },
    { label: "Approved by host",   time: visitor.approvedAt,  done: !!visitor.approvedAt,  color: "#10B981", desc: visitor.approvedAt ? `Approved for ${visitor.expectedDuration || 120} min. QR sent to ${visitor.email}` : "Awaiting approval" },
    { label: "QR code sent",       time: visitor.approvedAt,  done: !!visitor.approvedAt && visitor.qrGenerated, color: "#10B981", desc: visitor.qrGenerated ? "QR code delivered to visitor" : "QR pending" },
    { label: "Checked in",         time: visitor.checkInTime, done: !!visitor.checkInTime, color: "#06B6D4", desc: visitor.checkInTime ? `Entered at Gate ${visitor.gate} at ${fmtTime(visitor.checkInTime)}` : "Not yet checked in" },
    { label: visitor.checkOutTime ? "Checked out" : visitor.status === "OVERSTAY" ? "Overstaying" : "Pending checkout",
      time: visitor.checkOutTime || (visitor.status === "OVERSTAY" ? visitor.allowedUntil : null),
      done: !!visitor.checkOutTime || visitor.status === "OVERSTAY",
      color: visitor.status === "OVERSTAY" ? "#EF4444" : "#6B7280",
      desc: visitor.checkOutTime ? `Duration: ${visitor.actualDuration || "—"} min` : visitor.status === "OVERSTAY" ? `Exceeded allowed time` : "Still inside" },
  ];

  const overstayMins = visitor.status === "OVERSTAY" && visitor.allowedUntil
    ? Math.max(0, Math.floor((now - new Date(visitor.allowedUntil)) / 60000)) : 0;
  const remainMins = visitor.status === "IN" && visitor.allowedUntil
    ? Math.max(0, Math.ceil((new Date(visitor.allowedUntil) - now) / 60000)) : null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 440 } } }}>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: "1px solid #E5E7EB", bgcolor: "#F9FAFB" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width: 48, height: 48, background: "linear-gradient(135deg,#3B82F6,#1F2937)", fontSize: 18, fontWeight: 700, color: "#fff" }}>
                {visitor.name?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography fontWeight={700} fontSize={16} color="#111827">{visitor.name}</Typography>
                <Typography fontSize={12} color="#6B7280">{visitor.visitorId}</Typography>
              </Box>
            </Stack>
            <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
          </Stack>
          <Box sx={{ mt: 1.5 }}><StatusBadge status={visitor.status} /></Box>
        </Box>

        {/* Scrollable content */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          {/* Info grid */}
          <Typography fontWeight={700} fontSize={13} color="#374151" mb={1.5}>Visitor Information</Typography>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#F9FAFB", border: "1px solid #E5E7EB", mb: 3 }}>
            {[["Email", visitor.email], ["Phone", visitor.phone], ["Company", visitor.company],
              ["Host", visitor.host], ["Gate", `Gate ${visitor.gate}`], ["Purpose", visitor.purpose],
              ["Duration", `${visitor.expectedDuration || 120} minutes`], ["Booked on", fmtDT(visitor.createdAt)]].map(([l, v]) => v ? (
              <Stack key={l} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: "1px solid #F3F4F6" }}>
                <Typography fontSize={12} color="#6B7280">{l}</Typography>
                <Typography fontSize={12} fontWeight={600} color="#111827" sx={{ maxWidth: 200, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</Typography>
              </Stack>
            ) : null)}
          </Box>

          {/* Time indicators */}
          {visitor.status === "OVERSTAY" && overstayMins > 0 && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography fontSize={12} fontWeight={700}>⚠️ Overstaying by {overstayMins} minutes</Typography>
              <LinearProgress variant="determinate" value={Math.min(100, (overstayMins / 120) * 100)}
                sx={{ mt: 0.75, height: 4, borderRadius: 2, bgcolor: "#fecaca", "& .MuiLinearProgress-bar": { bgcolor: "#ef4444" } }} />
            </Alert>
          )}
          {remainMins !== null && (
            <Alert severity={remainMins < 15 ? "warning" : "success"} sx={{ mb: 2, borderRadius: 2 }}>
              <Typography fontSize={12} fontWeight={600}>
                {remainMins < 15 ? `⏰ Only ${remainMins} minutes remaining` : `✅ ${remainMins} minutes remaining`}
              </Typography>
            </Alert>
          )}

          {/* Timeline */}
          <Typography fontWeight={700} fontSize={13} color="#374151" mb={1.5}>Visit Timeline</Typography>
          <Stepper activeStep={steps.filter(s => s.done).length} orientation="vertical">
            {steps.map((s, i) => (
              <Step key={i} completed={s.done}>
                <StepLabel
                  StepIconProps={{ sx: { color: s.done ? s.color : "#D1D5DB", fontSize: 20 } }}
                  sx={{ "& .MuiStepLabel-label": { fontWeight: s.done ? 700 : 400, fontSize: "13px" } }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <span>{s.label}</span>
                    {s.time && s.done && <Typography fontSize={11} color="#9CA3AF">{fmtDT(s.time)}</Typography>}
                  </Stack>
                </StepLabel>
                <StepContent>
                  <Typography fontSize={12} color="#6B7280" sx={{ pb: 1 }}>{s.desc}</Typography>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Footer actions */}
        {visitor.status === "PENDING" && (
          <Box sx={{ p: 2.5, borderTop: "1px solid #E5E7EB", bgcolor: "#F9FAFB" }}>
            <Stack direction="row" spacing={1}>
              <Button fullWidth variant="contained" sx={{ bgcolor: "#10B981", color: "#fff", fontWeight: 700, "&:hover": { bgcolor: "#059669" } }}
                onClick={() => { onClose(); onApprove(visitor); }}>
                Approve
              </Button>
              <Button fullWidth variant="outlined" color="error" sx={{ fontWeight: 700 }}
                onClick={() => { onClose(); onReject(visitor); }}>
                Reject
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}

// ─── Auto-refresh countdown indicator ────────────────────────────────────
function RefreshIndicator({ lastUpdated, countdown }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#10B981", animation: "pulse 2s infinite", "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } } }} />
      <Typography fontSize={11} color="#6B7280">
        Updated {lastUpdated} · refreshing in {countdown}s
      </Typography>
    </Stack>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logoutUser, isSuperAdmin, isHostAdmin, isAdmin } = useAuth();
  const { socket } = useSocket();

  const [visitors, setVisitors]         = useState([]);
  const [hostInfo, setHostInfo]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError]               = useState("");

  // Approve / Reject dialogs
  const [approveDialog, setApproveDialog]   = useState(null);
  const [rejectDialog, setRejectDialog]     = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalDuration, setApprovalDuration] = useState(120);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading]   = useState(false);
  const [actionSuccess, setActionSuccess]   = useState("");

  // Table pagination
  const [page, setPage]             = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Detail drawer
  const [drawerVisitor, setDrawerVisitor] = useState(null);

  // Notifications
  const [notifDrawer, setNotifDrawer]   = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Bulk selection
  const [selected, setSelected] = useState(new Set());
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [bulkRejectDlg, setBulkRejectDlg]     = useState(false);
  const [bulkLoading, setBulkLoading]           = useState(false);

  // Auto-refresh
  const [countdown, setCountdown]   = useState(30);
  const [lastUpdated, setLastUpdated] = useState("just now");
  const refreshRef                    = useRef(null);

  // Auth guard
  useEffect(() => {
    if (!user) { navigate("/login", { replace: true }); return; }
    if (!isAdmin && !isHostAdmin && !isSuperAdmin) navigate("/login", { replace: true });
  }, [user, navigate, isAdmin, isHostAdmin, isSuperAdmin]);

  // Load data
  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError("");

      // Host info
      try {
        const r = await api.get("/hostadmin/me").catch(() => api.get("/auth/me"));
        setHostInfo(r.data?.data || { name: user?.name, department: "—" });
      } catch { setHostInfo({ name: user?.name, department: "—" }); }

      // Visitors
      try {
        let res;
        if (isHostAdmin) {
          res = await api.get("/visitor/host-visitors").catch(() => api.get("/visitor/by-host")).catch(() => api.get("/visitor"));
        } else {
          res = await api.get("/visitor/all").catch(() => api.get("/visitor"));
        }
        setVisitors(extractVisitors(res));
      } catch { setError("Failed to load visitors. Please refresh."); setVisitors([]); }

      // Notifications
      try {
        const nr = await api.get("/notification").catch(() => null);
        if (nr?.data?.notifications) setNotifications(nr.data.notifications);
      } catch { /* silent */ }

      setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      setCountdown(30);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isHostAdmin, user]);

  // Initial load
  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 30s with countdown
  useEffect(() => {
    const countdownId = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { loadData(true); return 30; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownId);
  }, [loadData]);

  // Socket real-time
  useEffect(() => {
    if (!socket) return;
    const onNew = v => setVisitors(p => p.find(x => x._id === v._id) ? p : [v, ...p]);
    const onUpd = v => setVisitors(p => p.map(x => x._id === v._id ? { ...x, ...v } : x));
    socket.on("visitor:new", onNew);
    socket.on("visitor:updated", onUpd);
    socket.on("visitor:approved", onUpd);
    return () => { socket.off("visitor:new", onNew); socket.off("visitor:updated", onUpd); socket.off("visitor:approved", onUpd); };
  }, [socket]);

  // ── Single approve ────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!approveDialog?._id) return;
    setApproveLoading(true);
    try {
      await api.post(`/visitor/${approveDialog._id}/approve`, { action: "APPROVED", expectedDuration: approvalDuration });
      setActionSuccess(`✅ ${approveDialog.name} approved! QR code email sent.`);
      addNotif({ title: "Visitor Approved", message: `${approveDialog.name} approved. QR sent to ${approveDialog.email}`, type: "SUCCESS" });
      setApproveDialog(null); setApprovalDuration(120);
      loadData(true);
    } catch (e) { setError(`Approval failed: ${e.response?.data?.message || e.message}`); }
    finally { setApproveLoading(false); }
  };

  // ── Single reject ─────────────────────────────────────────────────
  const handleReject = async () => {
    if (!rejectDialog?._id || !rejectionReason.trim()) return;
    setRejectLoading(true);
    try {
      await api.post(`/visitor/${rejectDialog._id}/approve`, { action: "REJECTED", reason: rejectionReason });
      setActionSuccess(`Visitor rejected. Notification sent.`);
      addNotif({ title: "Visitor Rejected", message: `${rejectDialog.name} rejected`, type: "INFO" });
      setRejectDialog(null); setRejectionReason("");
      loadData(true);
    } catch (e) { setError(`Rejection failed: ${e.response?.data?.message || e.message}`); }
    finally { setRejectLoading(false); }
  };

  // ── Bulk approve ──────────────────────────────────────────────────
  const handleBulkApprove = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkLoading(true);
    let done = 0, failed = 0;
    await Promise.allSettled(ids.map(id =>
      api.post(`/visitor/${id}/approve`, { action: "APPROVED", expectedDuration: 120 })
        .then(() => done++)
        .catch(() => failed++)
    ));
    setSelected(new Set());
    setActionSuccess(`✅ ${done} visitor(s) approved${failed ? `, ${failed} failed` : ""}`);
    setBulkLoading(false);
    loadData(true);
  };

  // ── Bulk reject ───────────────────────────────────────────────────
  const handleBulkReject = async () => {
    if (!bulkRejectReason.trim()) return;
    const ids = [...selected];
    setBulkLoading(true);
    let done = 0, failed = 0;
    await Promise.allSettled(ids.map(id =>
      api.post(`/visitor/${id}/approve`, { action: "REJECTED", reason: bulkRejectReason })
        .then(() => done++)
        .catch(() => failed++)
    ));
    setSelected(new Set()); setBulkRejectDlg(false); setBulkRejectReason("");
    setActionSuccess(`${done} visitor(s) rejected${failed ? `, ${failed} failed` : ""}`);
    setBulkLoading(false);
    loadData(true);
  };

  const addNotif = (n) => setNotifications(p => [{ _id: Date.now(), createdAt: new Date(), ...n }, ...p].slice(0, 20));

  // ── Checkbox helpers ───────────────────────────────────────────────
  const pendingFiltered = useMemo(() => {
    let r = visitors.filter(v => {
      const s = search.toLowerCase();
      return !search || (v.name + v.email + v.phone + v.visitorId).toLowerCase().includes(s);
    });
    if (statusFilter !== "all") r = r.filter(v => v.status === statusFilter);
    return r.filter(v => v.status === "PENDING");
  }, [visitors, search, statusFilter]);

  const allPendingSelected = pendingFiltered.length > 0 && pendingFiltered.every(v => selected.has(v._id));

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingFiltered.map(v => v._id)));
    }
  };

  const toggleRow = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Filter + paginate ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return visitors.filter(v => {
      const matchSearch = !search || (v.name + v.email + v.phone + (v.visitorId || "")).toLowerCase().includes(s);
      const matchStatus = statusFilter === "all" || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [visitors, search, statusFilter]);

  const paginated = useMemo(() => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filtered, page, rowsPerPage]);

  const stats = useMemo(() => ({
    pending:   visitors.filter(v => v.status === "PENDING").length,
    approved:  visitors.filter(v => v.status === "APPROVED").length,
    inside:    visitors.filter(v => v.status === "IN").length,
    overstay:  visitors.filter(v => v.status === "OVERSTAY").length,
    completed: visitors.filter(v => v.status === "OUT").length,
  }), [visitors]);

  if (!user) return <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center"><CircularProgress /></Box>;

  const thCellSx = { fontSize: "11px", fontWeight: 700, color: "#6B7280", letterSpacing: "0.5px", textTransform: "uppercase", py: 1.5, px: 2, borderBottom: "1px solid #E5E7EB", bgcolor: "#F9FAFB" };
  const tdCellSx = { py: 1.5, px: 2, borderBottom: "1px solid #F3F4F6" };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F9FAFB", py: { xs: 2, md: 3 } }}>
      <Container maxWidth="xl">

        {/* HEADER */}
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2} mb={4}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 48, height: 48, borderRadius: "10px", background: "linear-gradient(135deg,#3B82F6,#1F2937)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PersonIcon sx={{ color: "#fff", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>
                {hostInfo?.name || user?.name} Dashboard
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography sx={{ fontSize: "13px", color: "#6B7280", fontWeight: 500 }}>
                  {user?.role?.toUpperCase()} · {hostInfo?.department || "—"}
                </Typography>
                <RefreshIndicator lastUpdated={lastUpdated} countdown={countdown} />
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Refresh now">
              <span>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadData()} disabled={loading} size="small"
                  sx={{ borderColor: "#D1D5DB", color: "#6B7280", "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F3F4F6" } }}>
                  Refresh
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton size="small" onClick={() => setNotifDrawer(true)} sx={{ color: "#6B7280" }}>
                <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} size="small"
              onClick={() => { logoutUser(); navigate("/login", { replace: true }); }}
              sx={{ borderColor: "#FCA5A5", "&:hover": { borderColor: "#DC2626", bgcolor: "#FEF2F2" } }}>
              Logout
            </Button>
          </Stack>
        </Stack>

        {/* ALERTS */}
        {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {actionSuccess && <Alert severity="success" onClose={() => setActionSuccess("")} sx={{ mb: 2, borderRadius: 2 }}>{actionSuccess}</Alert>}
        {stats.overstay > 0 && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontWeight: 700 }}>🚨 {stats.overstay} visitor(s) are overstaying!</Alert>}

        {/* STAT CARDS */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: "Pending",   value: stats.pending,   color: "amber",   icon: TrendingUpIcon },
            { label: "Approved",  value: stats.approved,  color: "emerald", icon: CheckCircleIcon },
            { label: "Inside",    value: stats.inside,    color: "blue",    icon: PersonIcon },
            { label: "Overstay",  value: stats.overstay,  color: "red",     icon: WarningIcon, pulse: stats.overstay > 0 },
            { label: "Completed", value: stats.completed, color: "slate",   icon: CheckCircleIcon },
          ].map(s => (
            <Grid item xs={6} sm={4} md={2.4} key={s.label}>
              <StatCard {...s} />
            </Grid>
          ))}
        </Grid>

        {/* 7-DAY TREND CHART */}
        <TrendChart visitors={visitors} />

        {/* TOOLBAR: search + status filter + export + bulk */}
        <Card sx={{ mb: 2, border: "1px solid #E5E7EB", borderRadius: "10px", boxShadow: "none" }}>
          <CardContent sx={{ p: "12px 16px" }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>

              {/* Search */}
              <Stack direction="row" spacing={1} alignItems="center" flex={1}>
                <SearchIcon sx={{ color: "#9CA3AF", fontSize: 18 }} />
                <TextField fullWidth placeholder="Search by name, email, phone, visitor ID…" size="small" value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }} variant="standard"
                  InputProps={{ disableUnderline: true, style: { fontSize: "13px", color: "#111827" } }} />
              </Stack>

              {/* Status filter dropdown */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="status-filter-label" sx={{ fontSize: 13 }}>Status</InputLabel>
                <Select labelId="status-filter-label" label="Status" value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setPage(0); setSelected(new Set()); }}
                  sx={{ fontSize: 13, borderRadius: 1.5 }}>
                  {["all", "PENDING", "APPROVED", "IN", "OVERSTAY", "OUT", "REJECTED"].map(s => (
                    <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s === "all" ? "All Status" : s}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Export buttons */}
              <Stack direction="row" spacing={0.75}>
                <Tooltip title="Export filtered visitors to CSV">
                  <Button size="small" variant="outlined" startIcon={<DownloadIcon />}
                    onClick={() => exportCSV(buildExportRows(filtered), "visitors")}
                    sx={{ borderColor: "#D1D5DB", color: "#374151", fontSize: "11px", fontWeight: 600 }}>
                    CSV
                  </Button>
                </Tooltip>
                <Tooltip title="Export filtered visitors to PDF">
                  <Button size="small" variant="outlined" startIcon={<DownloadIcon />}
                    onClick={() => exportPDF(buildExportRows(filtered), "Visitor Report")}
                    sx={{ borderColor: "#D1D5DB", color: "#374151", fontSize: "11px", fontWeight: 600 }}>
                    PDF
                  </Button>
                </Tooltip>
              </Stack>
            </Stack>

            {/* Bulk action bar — visible when rows selected */}
            {selected.size > 0 && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #E5E7EB" }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography fontSize={13} fontWeight={600} color="#374151">
                    {selected.size} selected
                  </Typography>
                  <Button size="small" variant="contained" startIcon={<DoneAllIcon />}
                    onClick={handleBulkApprove} disabled={bulkLoading}
                    sx={{ bgcolor: "#10B981", color: "#fff", fontWeight: 700, fontSize: "11px", "&:hover": { bgcolor: "#059669" } }}>
                    {bulkLoading ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : "Approve All"}
                  </Button>
                  <Button size="small" variant="outlined" color="error" startIcon={<BlockIcon />}
                    onClick={() => setBulkRejectDlg(true)} disabled={bulkLoading}
                    sx={{ fontWeight: 700, fontSize: "11px" }}>
                    Reject All
                  </Button>
                  <Button size="small" variant="text" onClick={() => setSelected(new Set())}
                    sx={{ color: "#6B7280", fontSize: "11px" }}>
                    Clear
                  </Button>
                  <Typography fontSize={11} color="#9CA3AF" sx={{ ml: "auto" }}>
                    Only PENDING visitors can be actioned
                  </Typography>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>

        <Typography fontSize={12} color="#6B7280" mb={1.5}>
          Showing {filtered.length} of {visitors.length} visitors
          {statusFilter !== "all" && ` · filtered by ${statusFilter}`}
        </Typography>

        {/* LOADING */}
        {loading && <Card sx={{ border: "1px solid #E5E7EB", borderRadius: "10px", boxShadow: "none", p: 5, textAlign: "center" }}>
          <CircularProgress /><Typography sx={{ mt: 2, color: "#6B7280", fontSize: "14px" }}>Loading…</Typography>
        </Card>}

        {/* EMPTY */}
        {!loading && visitors.length === 0 && (
          <Card sx={{ border: "1px solid #E5E7EB", borderRadius: "10px", boxShadow: "none", p: 5, textAlign: "center" }}>
            <InfoIcon sx={{ fontSize: 48, color: "#D1D5DB", mb: 2 }} />
            <Typography fontWeight={600} fontSize={15} color="#6B7280">No Visitors Yet</Typography>
            <Typography fontSize={13} color="#9CA3AF">No visitor bookings to display.</Typography>
          </Card>
        )}

        {/* TABLE */}
        {!loading && visitors.length > 0 && (
          <Card sx={{ border: "1px solid #E5E7EB", borderRadius: "10px", boxShadow: "none", overflow: "hidden" }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {/* Bulk checkbox header */}
                    <TableCell sx={{ ...thCellSx, width: 48 }}>
                      <Tooltip title={allPendingSelected ? "Deselect all pending" : "Select all pending"}>
                        <Checkbox size="small" checked={allPendingSelected} indeterminate={selected.size > 0 && !allPendingSelected}
                          onChange={toggleSelectAll}
                          sx={{ p: 0, "& .MuiSvgIcon-root": { fontSize: 18 } }} />
                      </Tooltip>
                    </TableCell>
                    {["Visitor", "Contact", "Host / Gate", "Status", "Booked", "Duration", "Actions"].map(h => (
                      <TableCell key={h} align={h === "Actions" ? "right" : "left"} sx={thCellSx}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map(v => (
                    <TableRow key={v._id} sx={{
                      "&:hover": { bgcolor: "#F9FAFB" },
                      bgcolor: v.status === "OVERSTAY" ? "#FEF2F2" : selected.has(v._id) ? "#EFF6FF" : "transparent",
                    }}>
                      {/* Checkbox — only for PENDING */}
                      <TableCell sx={tdCellSx}>
                        {v.status === "PENDING" && (
                          <Checkbox size="small" checked={selected.has(v._id)} onChange={() => toggleRow(v._id)}
                            sx={{ p: 0, "& .MuiSvgIcon-root": { fontSize: 18 } }} />
                        )}
                      </TableCell>

                      {/* Visitor */}
                      <TableCell sx={tdCellSx}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#3B82F6,#1F2937)", color: "#fff" }}>
                            {v.name?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography fontSize={13} fontWeight={600} color="#111827">{v.name}</Typography>
                            <Typography fontSize={11} color="#9CA3AF">{v.visitorId}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Contact */}
                      <TableCell sx={tdCellSx}>
                        <Typography fontSize={12} color="#374151">{v.email}</Typography>
                        <Typography fontSize={11} color="#9CA3AF">{v.phone}</Typography>
                      </TableCell>

                      {/* Host / Gate */}
                      <TableCell sx={tdCellSx}>
                        <Typography fontSize={12} color="#374151">{v.host || "—"}</Typography>
                        <Typography fontSize={11} color="#9CA3AF">Gate {v.gate || "—"}</Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={tdCellSx}><StatusBadge status={v.status} /></TableCell>

                      {/* Booked */}
                      <TableCell sx={tdCellSx}>
                        <Typography fontSize={12} color="#6B7280">{fmtDate(v.createdAt)}</Typography>
                      </TableCell>

                      {/* Duration */}
                      <TableCell sx={tdCellSx}>
                        <Typography fontSize={12} color="#6B7280">{v.expectedDuration ? `${v.expectedDuration}m` : "—"}</Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" sx={tdCellSx}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View details & timeline">
                            <IconButton size="small" onClick={() => setDrawerVisitor(v)}
                              sx={{ color: "#6B7280", "&:hover": { color: "#3B82F6", bgcolor: "#EFF6FF" } }}>
                              <VisibilityIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          {v.status === "PENDING" && (
                            <>
                              <Tooltip title="Approve">
                                <Button size="small" variant="contained"
                                  sx={{ bgcolor: "#10B981", color: "#fff", fontSize: "11px", fontWeight: 600, px: 1.5, py: 0.5, minWidth: 0, "&:hover": { bgcolor: "#059669" } }}
                                  onClick={() => setApproveDialog(v)}>
                                  ✓
                                </Button>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <Button size="small" variant="outlined"
                                  sx={{ borderColor: "#FECACA", color: "#EF4444", fontSize: "11px", fontWeight: 600, px: 1.5, py: 0.5, minWidth: 0, "&:hover": { borderColor: "#FCA5A5", bgcolor: "#FEF2F2" } }}
                                  onClick={() => setRejectDialog(v)}>
                                  ✗
                                </Button>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ borderTop: "1px solid #E5E7EB" }}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filtered.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              />
            </Box>
          </Card>
        )}
      </Container>

      {/* ── APPROVE DIALOG ── */}
      <Dialog open={!!approveDialog} onClose={() => setApproveDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #E5E7EB", fontSize: 17 }}>Approve Visitor</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {approveDialog && (
            <Stack spacing={2.5}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#F0FDF4", border: "1.5px solid #BBF7D0", borderLeft: "4px solid #10B981" }}>
                <Typography fontWeight={700} fontSize={15}>{approveDialog.name}</Typography>
                <Typography fontSize={12} color="#6B7280">{approveDialog.email} · Gate {approveDialog.gate}</Typography>
              </Box>
              <TextField label="Expected Duration (minutes)" type="number" fullWidth size="small" value={approvalDuration}
                onChange={e => setApprovalDuration(Number(e.target.value))} inputProps={{ min: 15, step: 15 }} />
              <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                ✉️ QR code approval email will be sent to <strong>{approveDialog.email}</strong>
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #E5E7EB" }}>
          <Button onClick={() => setApproveDialog(null)} sx={{ color: "#6B7280" }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: "#10B981", color: "#fff", fontWeight: 700, "&:hover": { bgcolor: "#059669" } }}
            onClick={handleApprove} disabled={approveLoading}>
            {approveLoading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Approve & Send QR"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── REJECT DIALOG ── */}
      <Dialog open={!!rejectDialog} onClose={() => setRejectDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #E5E7EB", fontSize: 17 }}>Reject Visitor</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {rejectDialog && (
            <Stack spacing={2.5}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#FEF2F2", border: "1.5px solid #FECACA", borderLeft: "4px solid #EF4444" }}>
                <Typography fontWeight={700} fontSize={15}>{rejectDialog.name}</Typography>
                <Typography fontSize={12} color="#6B7280">{rejectDialog.email}</Typography>
              </Box>
              <TextField label="Rejection Reason *" multiline rows={4} fullWidth size="small" value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)} placeholder="Provide a clear reason…" />
              <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
                Rejection notification will be sent to <strong>{rejectDialog.email}</strong>
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #E5E7EB" }}>
          <Button onClick={() => setRejectDialog(null)} sx={{ color: "#6B7280" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={!rejectionReason.trim() || rejectLoading}
            sx={{ fontWeight: 700 }}>
            {rejectLoading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Reject & Notify"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── BULK REJECT DIALOG ── */}
      <Dialog open={bulkRejectDlg} onClose={() => setBulkRejectDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #E5E7EB" }}>
          Reject {selected.size} Visitor(s)
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            <Typography fontSize={13} color="#6B7280">This rejection reason will be sent to all {selected.size} selected visitors.</Typography>
            <TextField label="Rejection Reason *" multiline rows={3} fullWidth size="small" value={bulkRejectReason}
              onChange={e => setBulkRejectReason(e.target.value)} placeholder="Reason applied to all selected visitors…" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #E5E7EB" }}>
          <Button onClick={() => setBulkRejectDlg(false)} sx={{ color: "#6B7280" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleBulkReject} disabled={!bulkRejectReason.trim() || bulkLoading} sx={{ fontWeight: 700 }}>
            {bulkLoading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : `Reject ${selected.size} Visitors`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── VISITOR DETAIL DRAWER ── */}
      <VisitorDetailDrawer
        visitor={drawerVisitor}
        open={!!drawerVisitor}
        onClose={() => setDrawerVisitor(null)}
        onApprove={setApproveDialog}
        onReject={setRejectDialog}
      />

      {/* ── NOTIFICATIONS DRAWER ── */}
      <Drawer anchor="right" open={notifDrawer} onClose={() => setNotifDrawer(false)}>
        <Box sx={{ width: { xs: "100%", sm: 380 }, p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography fontWeight={700} fontSize={17} color="#111827">Notifications ({notifications.length})</Typography>
            <IconButton size="small" onClick={() => setNotifDrawer(false)}><CloseIcon /></IconButton>
          </Stack>
          <Stack spacing={1.5}>
            {notifications.length === 0
              ? <Typography color="#9CA3AF" textAlign="center" py={4} fontSize={13}>No notifications</Typography>
              : notifications.map(n => (
                <Card key={n._id} elevation={0} sx={{ border: "1px solid #E5E7EB", borderLeft: `4px solid ${n.type === "SUCCESS" ? "#10B981" : "#3B82F6"}`, borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography fontWeight={700} fontSize={13} color="#111827">{n.title}</Typography>
                    <Typography fontSize={12} color="#6B7280" mt={0.25}>{n.message}</Typography>
                    <Typography fontSize={11} color="#9CA3AF" mt={0.5}>{fmtDT(n.createdAt)}</Typography>
                  </CardContent>
                </Card>
              ))}
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}