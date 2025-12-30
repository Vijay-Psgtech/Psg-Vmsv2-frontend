// import React, { useEffect, useMemo, useState } from "react";
// import api from "../utils/api";
// import { QRCodeCanvas } from "qrcode.react";
// import io from "socket.io-client";

// import {
//   Box,
//   Paper,
//   Typography,
//   Button,
//   Stack,
//   Chip,
//   Divider,
//   TextField,
//   Avatar,
//   MenuItem,
//   Select,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
  
//   Tab,
//   Tabs,
//   Alert as MuiAlert,
//   Badge,
//   IconButton,
//   Drawer,
//   Card,
//   CardContent,
// } from "@mui/material";

// import Grid from "@mui/material/Grid";


// import LogoutIcon from "@mui/icons-material/Logout";
// import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
// import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// import CancelIcon from "@mui/icons-material/Cancel";
// import NotificationsIcon from "@mui/icons-material/Notifications";
// import WarningIcon from "@mui/icons-material/Warning";
// import AccessTimeIcon from "@mui/icons-material/AccessTime";
// import CloseIcon from "@mui/icons-material/Close";

// export default function AdminDashboard() {
//   /* ================= STATE ================= */
//   const [visitors, setVisitors] = useState([]);
//   const [alerts, setAlerts] = useState([]);
//   const [selectedVisitor, setSelectedVisitor] = useState(null);
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("ALL");
//   const [gateFilter, setGateFilter] = useState("ALL");
//   const [tabValue, setTabValue] = useState(0);
//   const [approveDialog, setApproveDialog] = useState(null);
//   const [rejectDialog, setRejectDialog] = useState(null);
//   const [rejectionReason, setRejectionReason] = useState("");
//   const [expectedDuration, setExpectedDuration] = useState(120);
//   const [alertDrawer, setAlertDrawer] = useState(false);
//   const [, forceUpdate] = useState(0);

//   const admin = JSON.parse(localStorage.getItem("user"));

//   /* ================= SOCKET.IO ================= */
//   useEffect(() => {
//     const socket = io("http://localhost:5000", {
//       transports: ["websocket", "polling"],
//     });

//     socket.on("connect", () => {
//       console.log("✅ Socket connected");
//     });

//     socket.on("visitors:update", (data) => {
//       console.log("📡 Visitors updated via socket");
//       setVisitors(data);
//     });

//     socket.on("alert:new", (alert) => {
//       console.log("🔔 New alert received:", alert);
//       setAlerts((prev) => [alert, ...prev]);
//     });

//     return () => socket.disconnect();
//   }, []);

//   /* ================= LOAD DATA ================= */
//   const loadVisitors = async () => {
//     try {
//       const res = await api.get("/visitor");
//       setVisitors(res.data);
//     } catch (err) {
//       console.error("Failed to load visitors", err);
//     }
//   };

//   const loadAlerts = async () => {
//     try {
//       const res = await api.get("/alert");
//       setAlerts(res.data);
//     } catch (err) {
//       console.error("Failed to load alerts", err);
//     }
//   };

//   useEffect(() => {
//     loadVisitors();
//     loadAlerts();

//     const interval = setInterval(() => {
//       loadVisitors();
//       loadAlerts();
//     }, 10000);

//     const timer = setInterval(() => forceUpdate((n) => n + 1), 1000);

//     return () => {
//       clearInterval(interval);
//       clearInterval(timer);
//     };
//   }, []);

//   /* ================= LOGOUT ================= */
//   const logout = () => {
//     localStorage.clear();
//     window.location.href = "/login";
//   };

//   /* ================= APPROVE ================= */
//   const approveVisitor = async () => {
//     try {
//       await api.post(`/visitor/approve/${approveDialog._id}`, {
//         action: "APPROVED",
//         expectedDuration,
//       });

//       setSelectedVisitor(approveDialog);
//       setApproveDialog(null);
//       loadVisitors();
//     } catch (err) {
//       console.error("Approval failed", err);
//       alert(err.response?.data?.message || "Approval failed");
//     }
//   };

//   /* ================= REJECT ================= */
//   const rejectVisitor = async () => {
//     try {
//       await api.post(`/visitor/approve/${rejectDialog._id}`, {
//         action: "REJECTED",
//         reason: rejectionReason,
//       });

//       setRejectDialog(null);
//       setRejectionReason("");
//       loadVisitors();
//     } catch (err) {
//       console.error("Rejection failed", err);
//       alert(err.response?.data?.message || "Rejection failed");
//     }
//   };

//   /* ================= MARK ALERT AS READ ================= */
//   const markAlertAsRead = async (alertId) => {
//     try {
//       await api.patch(`/alert/${alertId}/read`);
//       setAlerts((prev) => prev.filter((a) => a._id !== alertId));
//     } catch (err) {
//       console.error("Failed to mark alert as read", err);
//     }
//   };

//   /* ================= LIVE DURATION ================= */
//   const getLiveDuration = (start) => {
//     if (!start) return "-";
//     const diff = Date.now() - new Date(start).getTime();
//     const hours = Math.floor(diff / 3600000);
//     const minutes = Math.floor((diff % 3600000) / 60000);
//     const seconds = Math.floor((diff % 60000) / 1000);
//     return `${hours}h ${minutes}m ${seconds}s`;
//   };

//   /* ================= FILTERED DATA ================= */
//   const filteredVisitors = useMemo(() => {
//     return visitors.filter((v) => {
//       const matchSearch =
//         v.name?.toLowerCase().includes(search.toLowerCase()) ||
//         v.phone?.includes(search) ||
//         v.visitorId?.includes(search.toUpperCase());

//       const matchStatus = statusFilter === "ALL" || v.status === statusFilter;
//       const matchGate = gateFilter === "ALL" || v.gate === gateFilter;

//       let matchTab = true;
//       if (tabValue === 0) {
//         matchTab = v.status === "PENDING";
//       } else if (tabValue === 1) {
//         matchTab = ["APPROVED", "IN", "OVERSTAY"].includes(v.status);
//       } else if (tabValue === 2) {
//         matchTab = ["OUT", "EXPIRED", "REJECTED"].includes(v.status);
//       }

//       return matchSearch && matchStatus && matchGate && matchTab;
//     });
//   }, [visitors, search, statusFilter, gateFilter, tabValue]);

//   /* ================= STATS ================= */
//   const stats = useMemo(() => {
//     return {
//       total: visitors.length,
//       pending: visitors.filter((v) => v.status === "PENDING").length,
//       approved: visitors.filter((v) => v.status === "APPROVED").length,
//       inside: visitors.filter((v) => v.status === "IN").length,
//       overstay: visitors.filter((v) => v.status === "OVERSTAY").length,
//       rejected: visitors.filter((v) => v.status === "REJECTED").length,
//       completed: visitors.filter((v) => v.status === "OUT").length,
//     };
//   }, [visitors]);

//   const gates = [...new Set(visitors.map((v) => v.gate).filter(Boolean))];

//   /* ================= SEVERITY COLOR ================= */
//   const getSeverityColor = (severity) => {
//     switch (severity) {
//       case "CRITICAL":
//         return "#ef4444";
//       case "HIGH":
//         return "#f59e0b";
//       case "MEDIUM":
//         return "#3b82f6";
//       default:
//         return "#6b7280";
//     }
//   };

//   return (
//     <Box p={4} bgcolor="#F8FAFC" minHeight="100vh">
//       {/* ================= HEADER ================= */}
//       <Stack
//         direction="row"
//         justifyContent="space-between"
//         alignItems="center"
//         mb={4}
//         flexWrap="wrap"
//         gap={2}
//       >
//         <Stack direction="row" spacing={2} alignItems="center">
//           <Avatar sx={{ bgcolor: "#2563EB", width: 56, height: 56 }}>
//             <AdminPanelSettingsIcon />
//           </Avatar>
//           <Box>
//             <Typography variant="h5" fontWeight={700}>
//               Admin Dashboard
//             </Typography>
//             <Typography fontSize={14} color="text.secondary">
//               {admin?.email || "Administrator"}
//             </Typography>
//           </Box>
//         </Stack>

//         <Stack direction="row" spacing={2}>
//           <IconButton onClick={() => setAlertDrawer(true)} color="inherit">
//             <Badge badgeContent={alerts.length} color="error">
//               <NotificationsIcon />
//             </Badge>
//           </IconButton>

//           <Button
//             variant="outlined"
//             color="error"
//             startIcon={<LogoutIcon />}
//             onClick={logout}
//           >
//             Logout
//           </Button>
//         </Stack>
//       </Stack>

//       {/* ================= STATS ================= */}
//       <Grid container spacing={2} mb={3}>
//         {[
//           ["Total Visitors", stats.total, "#64748b"],
//           ["Pending", stats.pending, "#f59e0b"],
//           ["Approved", stats.approved, "#10b981"],
//           ["Inside", stats.inside, "#3b82f6"],
//           ["Overstay", stats.overstay, "#ef4444"],
//           ["Completed", stats.completed, "#06b6d4"],
//         ].map(([label, value, color]) => (
//           <Grid item xs={12} sm={6} md={2} key={label}>
//             <Paper
//               sx={{
//                 p: 2.5,
//                 borderRadius: 2,
//                 background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
//                 borderLeft: `4px solid ${color}`,
//               }}
//             >
//               <Typography fontSize={13} color="text.secondary" fontWeight={500}>
//                 {label}
//               </Typography>
//               <Typography variant="h4" fontWeight={700} mt={1} sx={{ color }}>
//                 {value}
//               </Typography>
//             </Paper>
//           </Grid>
//         ))}
//       </Grid>

//       {/* ================= TABS ================= */}
//       <Paper sx={{ mb: 3, borderRadius: 2 }}>
//         <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
//           <Tab label={`Pending (${stats.pending})`} />
//           <Tab label={`Active (${stats.approved + stats.inside + stats.overstay})`} />
//           <Tab label={`Completed (${stats.completed + stats.rejected})`} />
//         </Tabs>
//       </Paper>

//       {/* ================= FILTER BAR ================= */}
//       <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" gap={2}>
//         <TextField
//           placeholder="Search by name, phone, or ID"
//           size="small"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           sx={{ minWidth: 250 }}
//         />

//         <Select
//           size="small"
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//           sx={{ minWidth: 150 }}
//         >
//           <MenuItem value="ALL">All Status</MenuItem>
//           <MenuItem value="PENDING">Pending</MenuItem>
//           <MenuItem value="APPROVED">Approved</MenuItem>
//           <MenuItem value="IN">Inside</MenuItem>
//           <MenuItem value="OVERSTAY">Overstay</MenuItem>
//           <MenuItem value="OUT">Checked Out</MenuItem>
//           <MenuItem value="REJECTED">Rejected</MenuItem>
//         </Select>

//         <Select
//           size="small"
//           value={gateFilter}
//           onChange={(e) => setGateFilter(e.target.value)}
//           sx={{ minWidth: 150 }}
//         >
//           <MenuItem value="ALL">All Gates</MenuItem>
//           {gates.map((g) => (
//             <MenuItem key={g} value={g}>
//               Gate {g}
//             </MenuItem>
//           ))}
//         </Select>
//       </Stack>

//       {/* ================= VISITOR LIST ================= */}
//       {filteredVisitors.length === 0 && (
//         <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
//           <Typography color="text.secondary">No visitors found</Typography>
//         </Paper>
//       )}

//       <Stack spacing={2}>
//         {filteredVisitors.map((v) => (
//           <Paper
//             key={v._id}
//             sx={{
//               p: 3,
//               borderRadius: 3,
//               borderLeft: `6px solid ${
//                 v.status === "PENDING"
//                   ? "#f59e0b"
//                   : v.status === "OVERSTAY"
//                   ? "#ef4444"
//                   : "#2563EB"
//               }`,
//             }}
//           >
//             <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2}>
//               <Box flex={1}>
//                 <Typography variant="h6" fontWeight={600}>
//                   {v.name}
//                 </Typography>

//                 <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={1}>
//                   <Typography fontSize={14} color="text.secondary">
//                     📞 {v.phone}
//                   </Typography>
//                   {v.company && (
//                     <Typography fontSize={14} color="text.secondary">
//                       | 🏢 {v.company}
//                     </Typography>
//                   )}
//                 </Stack>

//                 <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={1}>
//                   <Chip label={`Gate ${v.gate}`} size="small" />
//                   <Chip label={`Host: ${v.host}`} size="small" />
//                   <Chip
//                     label={v.status}
//                     size="small"
//                     color={
//                       v.status === "PENDING"
//                         ? "warning"
//                         : v.status === "APPROVED"
//                         ? "success"
//                         : v.status === "IN"
//                         ? "primary"
//                         : v.status === "OVERSTAY"
//                         ? "error"
//                         : "default"
//                     }
//                   />
//                 </Stack>

//                 {v.status === "IN" && v.checkInTime && (
//                   <Chip
//                     icon={<AccessTimeIcon />}
//                     label={`Inside: ${getLiveDuration(v.checkInTime)}`}
//                     size="small"
//                     color="primary"
//                     sx={{ mt: 1 }}
//                   />
//                 )}

//                 {v.purpose && (
//                   <Typography fontSize={13} color="text.secondary" mt={1}>
//                     Purpose: {v.purpose}
//                   </Typography>
//                 )}

//                 <Typography fontSize={12} color="text.secondary" mt={1}>
//                   ID: {v.visitorId} | Created: {new Date(v.createdAt).toLocaleString()}
//                 </Typography>

//                 {v.status === "OVERSTAY" && (
//                   <MuiAlert severity="error" sx={{ mt: 2 }}>
//                     ⚠️ OVERSTAY ALERT - Exceeded allowed time by {v.overstayMinutes || 0} minutes!
//                   </MuiAlert>
//                 )}
//               </Box>

//               <Stack spacing={1} justifyContent="center">
//                 {v.status === "PENDING" && (
//                   <>
//                     <Button
//                       variant="contained"
//                       color="success"
//                       startIcon={<CheckCircleIcon />}
//                       onClick={() => setApproveDialog(v)}
//                     >
//                       Approve
//                     </Button>
//                     <Button
//                       variant="outlined"
//                       color="error"
//                       startIcon={<CancelIcon />}
//                       onClick={() => setRejectDialog(v)}
//                     >
//                       Reject
//                     </Button>
//                   </>
//                 )}

//                 {["APPROVED", "IN", "OVERSTAY"].includes(v.status) && (
//                   <Button variant="outlined" onClick={() => setSelectedVisitor(v)}>
//                     View Details
//                   </Button>
//                 )}
//               </Stack>
//             </Stack>
//           </Paper>
//         ))}
//       </Stack>

//       {/* ================= ALERTS DRAWER ================= */}
//       <Drawer anchor="right" open={alertDrawer} onClose={() => setAlertDrawer(false)}>
//         <Box width={400} p={3}>
//           <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
//             <Typography variant="h6" fontWeight={600}>
//               Alerts ({alerts.length})
//             </Typography>
//             <IconButton onClick={() => setAlertDrawer(false)}>
//               <CloseIcon />
//             </IconButton>
//           </Stack>

//           <Stack spacing={2}>
//             {alerts.length === 0 && (
//               <Typography color="text.secondary" textAlign="center" py={4}>
//                 No alerts
//               </Typography>
//             )}

//             {alerts.map((alert) => (
//               <Card
//                 key={alert._id}
//                 sx={{
//                   borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
//                 }}
//               >
//                 <CardContent>
//                   <Stack direction="row" spacing={1} alignItems="center" mb={1}>
//                     <WarningIcon fontSize="small" sx={{ color: getSeverityColor(alert.severity) }} />
//                     <Chip label={alert.severity} size="small" sx={{ bgcolor: `${getSeverityColor(alert.severity)}20` }} />
//                     <Chip label={alert.type} size="small" />
//                   </Stack>

//                   <Typography fontWeight={600} fontSize={14}>
//                     {alert.title}
//                   </Typography>

//                   <Typography fontSize={13} color="text.secondary" mt={1}>
//                     {alert.message}
//                   </Typography>

//                   {alert.visitor && (
//                     <Typography fontSize={12} color="text.secondary" mt={1}>
//                       Visitor: {alert.visitor.name} ({alert.visitor.visitorId})
//                     </Typography>
//                   )}

//                   <Divider sx={{ my: 1 }} />

//                   <Stack direction="row" justifyContent="space-between" alignItems="center">
//                     <Typography fontSize={11} color="text.secondary">
//                       {new Date(alert.createdAt).toLocaleString()}
//                     </Typography>

//                     <Button size="small" onClick={() => markAlertAsRead(alert._id)}>
//                       Dismiss
//                     </Button>
//                   </Stack>
//                 </CardContent>
//               </Card>
//             ))}
//           </Stack>
//         </Box>
//       </Drawer>

//       {/* ================= APPROVE DIALOG ================= */}
//       <Dialog open={!!approveDialog} onClose={() => setApproveDialog(null)} maxWidth="sm" fullWidth>
//         <DialogTitle>Approve Visitor</DialogTitle>
//         <DialogContent>
//           {approveDialog && (
//             <>
//               <Typography mb={2}>
//                 Approve <strong>{approveDialog.name}</strong> for entry?
//               </Typography>

//               <TextField
//                 fullWidth
//                 label="Expected Duration (minutes)"
//                 type="number"
//                 value={expectedDuration}
//                 onChange={(e) => setExpectedDuration(Number(e.target.value))}
//                 margin="normal"
//               />

//               <Typography fontSize={13} color="text.secondary" mt={1}>
//                 Visitor will be allowed until:{" "}
//                 {new Date(Date.now() + expectedDuration * 60000).toLocaleString()}
//               </Typography>
//             </>
//           )}
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setApproveDialog(null)}>Cancel</Button>
//           <Button variant="contained" color="success" onClick={approveVisitor}>
//             Approve
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* ================= REJECT DIALOG ================= */}
//       <Dialog open={!!rejectDialog} onClose={() => setRejectDialog(null)} maxWidth="sm" fullWidth>
//         <DialogTitle>Reject Visitor</DialogTitle>
//         <DialogContent>
//           {rejectDialog && (
//             <>
//               <Typography mb={2}>
//                 Reject <strong>{rejectDialog.name}</strong>?
//               </Typography>

//               <TextField
//                 fullWidth
//                 label="Rejection Reason"
//                 multiline
//                 rows={3}
//                 value={rejectionReason}
//                 onChange={(e) => setRejectionReason(e.target.value)}
//                 margin="normal"
//                 required
//               />
//             </>
//           )}
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setRejectDialog(null)}>Cancel</Button>
//           <Button
//             variant="contained"
//             color="error"
//             onClick={rejectVisitor}
//             disabled={!rejectionReason.trim()}
//           >
//             Reject
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* ================= VISITOR DETAILS DIALOG ================= */}
//       <Dialog open={!!selectedVisitor} onClose={() => setSelectedVisitor(null)} maxWidth="md" fullWidth>
//         <DialogTitle>Visitor Details</DialogTitle>
//         <DialogContent>
//           {selectedVisitor && (
//             <Stack spacing={3}>
//               <Box textAlign="center">
//                 <QRCodeCanvas
//                   value={JSON.stringify({
//                     visitorId: selectedVisitor.visitorId,
//                     gateId: selectedVisitor.gate,
//                   })}
//                   size={200}
//                   level="H"
//                 />
//                 <Typography mt={2} fontWeight={600}>
//                   Visitor ID: {selectedVisitor.visitorId}
//                 </Typography>
//               </Box>

//               <Divider />

//               <Grid container spacing={2}>
//                 <Grid item xs={6}>
//                   <Typography fontSize={13} color="text.secondary">
//                     Name
//                   </Typography>
//                   <Typography fontWeight={600}>{selectedVisitor.name}</Typography>
//                 </Grid>
//                 <Grid item xs={6}>
//                   <Typography fontSize={13} color="text.secondary">
//                     Phone
//                   </Typography>
//                   <Typography fontWeight={600}>{selectedVisitor.phone}</Typography>
//                 </Grid>
//                 <Grid item xs={6}>
//                   <Typography fontSize={13} color="text.secondary">
//                     Host
//                   </Typography>
//                   <Typography fontWeight={600}>{selectedVisitor.host}</Typography>
//                 </Grid>
//                 <Grid item xs={6}>
//                   <Typography fontSize={13} color="text.secondary">
//                     Gate
//                   </Typography>
//                   <Typography fontWeight={600}>{selectedVisitor.gate}</Typography>
//                 </Grid>
//                 <Grid item xs={6}>
//                   <Typography fontSize={13} color="text.secondary">
//                     Status
//                   </Typography>
//                   <Chip label={selectedVisitor.status} size="small" />
//                 </Grid>
//                 <Grid item xs={6}>
//                   <Typography fontSize={13} color="text.secondary">
//                     Expected Duration
//                   </Typography>
//                   <Typography fontWeight={600}>{selectedVisitor.expectedDuration} minutes</Typography>
//                 </Grid>
//                 {selectedVisitor.allowedUntil && (
//                   <Grid item xs={12}>
//                     <Typography fontSize={13} color="text.secondary">
//                       Valid Until
//                     </Typography>
//                     <Typography fontWeight={600}>
//                       {new Date(selectedVisitor.allowedUntil).toLocaleString()}
//                     </Typography>
//                   </Grid>
//                 )}
//               </Grid>

//               <Button
//                 variant="outlined"
//                 href={`http://localhost:5000/api/visitor/badge/${selectedVisitor._id}`}
//                 target="_blank"
//               >
//                 Download Visitor Badge
//               </Button>
//             </Stack>
//           )}
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setSelectedVisitor(null)}>Close</Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }

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
  MenuItem,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Alert as MuiAlert,
  Badge,
  IconButton,
  Drawer,
  Card,
  CardContent,
  Grid,
} from "@mui/material";

import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import NotificationsIcon from "@mui/icons-material/Notifications";
import WarningIcon from "@mui/icons-material/Warning";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";

export default function AdminDashboard() {
  const [visitors, setVisitors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [gateFilter, setGateFilter] = useState("ALL");
  const [tabValue, setTabValue] = useState(0);
  const [approveDialog, setApproveDialog] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [expectedDuration, setExpectedDuration] = useState(120);
  const [alertDrawer, setAlertDrawer] = useState(false);
  const [, forceUpdate] = useState(0);

  const admin = JSON.parse(localStorage.getItem("user") || "{}");

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

  const loadVisitors = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/visitor", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setVisitors(data);
      }
    } catch (err) {
      console.error("Failed to load visitors", err);
    }
  };

  const loadAlerts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/alert", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error("Failed to load alerts", err);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const approveVisitor = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/visitor/approve/${approveDialog._id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "APPROVED",
          expectedDuration,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      const data = await res.json();
      setSelectedVisitor(data);
      setApproveDialog(null);
      loadVisitors();
      alert("Visitor approved successfully! Confirmation email sent.");
    } catch (err) {
      console.error("Approval failed", err);
      alert(err.message || "Approval failed");
    }
  };

  const rejectVisitor = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/visitor/approve/${rejectDialog._id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "REJECTED",
          reason: rejectionReason,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      setRejectDialog(null);
      setRejectionReason("");
      loadVisitors();
      alert("Visitor rejected. Notification email sent.");
    } catch (err) {
      console.error("Rejection failed", err);
      alert(err.message || "Rejection failed");
    }
  };

  const markAlertAsRead = async (alertId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/alert/${alertId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
    } catch (err) {
      console.error("Failed to mark alert as read", err);
    }
  };

  const getLiveDuration = (start) => {
    if (!start) return "-";
    const diff = Date.now() - new Date(start).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      const matchSearch =
        v.name?.toLowerCase().includes(search.toLowerCase()) ||
        v.phone?.includes(search) ||
        v.visitorId?.includes(search.toUpperCase());

      const matchStatus = statusFilter === "ALL" || v.status === statusFilter;
      const matchGate = gateFilter === "ALL" || String(v.gate) === String(gateFilter);

      let matchTab = true;
      if (tabValue === 0) {
        matchTab = v.status === "PENDING";
      } else if (tabValue === 1) {
        matchTab = ["APPROVED", "IN", "OVERSTAY"].includes(v.status);
      } else if (tabValue === 2) {
        matchTab = ["OUT", "EXPIRED", "REJECTED"].includes(v.status);
      }

      return matchSearch && matchStatus && matchGate && matchTab;
    });
  }, [visitors, search, statusFilter, gateFilter, tabValue]);

  const stats = useMemo(() => {
    return {
      total: visitors.length,
      pending: visitors.filter((v) => v.status === "PENDING").length,
      approved: visitors.filter((v) => v.status === "APPROVED").length,
      inside: visitors.filter((v) => v.status === "IN").length,
      overstay: visitors.filter((v) => v.status === "OVERSTAY").length,
      rejected: visitors.filter((v) => v.status === "REJECTED").length,
      completed: visitors.filter((v) => v.status === "OUT").length,
    };
  }, [visitors]);

  const gates = [...new Set(visitors.map((v) => String(v.gate)).filter(Boolean))];

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

  const downloadBadge = (visitorId) => {
    const token = localStorage.getItem("token");
    window.open(
      `http://localhost:5000/api/visitor/badge/${visitorId}?token=${token}`,
      "_blank"
    );
  };

  return (
    <Box p={4} bgcolor="#F8FAFC" minHeight="100vh">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
        flexWrap="wrap"
        gap={2}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: "#2563EB", width: 56, height: 56 }}>
            <AdminPanelSettingsIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Admin Dashboard
            </Typography>
            <Typography fontSize={14} color="text.secondary">
              {admin?.email || "Administrator"}
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
          ["Total Visitors", stats.total, "#64748b"],
          ["Pending", stats.pending, "#f59e0b"],
          ["Approved", stats.approved, "#10b981"],
          ["Inside", stats.inside, "#3b82f6"],
          ["Overstay", stats.overstay, "#ef4444"],
          ["Completed", stats.completed, "#06b6d4"],
        ].map(([label, value, color]) => (
          <Grid item xs={12} sm={6} md={2} key={label}>
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
          <Tab label={`Pending (${stats.pending})`} />
          <Tab label={`Active (${stats.approved + stats.inside + stats.overstay})`} />
          <Tab label={`Completed (${stats.completed + stats.rejected})`} />
        </Tabs>
      </Paper>

      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" gap={2}>
        <TextField
          placeholder="Search by name, phone, or ID"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 250 }}
        />

        <Select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="ALL">All Status</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="APPROVED">Approved</MenuItem>
          <MenuItem value="IN">Inside</MenuItem>
          <MenuItem value="OVERSTAY">Overstay</MenuItem>
          <MenuItem value="OUT">Checked Out</MenuItem>
          <MenuItem value="REJECTED">Rejected</MenuItem>
        </Select>

        <Select
          size="small"
          value={gateFilter}
          onChange={(e) => setGateFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="ALL">All Gates</MenuItem>
          {gates.map((g) => (
            <MenuItem key={g} value={g}>
              Gate {g}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {filteredVisitors.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Typography color="text.secondary">No visitors found</Typography>
        </Paper>
      )}

      <Stack spacing={2}>
        {filteredVisitors.map((v) => (
          <Paper
            key={v._id}
            sx={{
              p: 3,
              borderRadius: 3,
              borderLeft: `6px solid ${
                v.status === "PENDING"
                  ? "#f59e0b"
                  : v.status === "OVERSTAY"
                  ? "#ef4444"
                  : "#2563EB"
              }`,
            }}
          >
            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box flex={1}>
                <Typography variant="h6" fontWeight={600}>
                  {v.name}
                </Typography>

                <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={1}>
                  <Typography fontSize={14} color="text.secondary">
                    📞 {v.phone}
                  </Typography>
                  {v.email && (
                    <Typography fontSize={14} color="text.secondary">
                      | ✉️ {v.email}
                    </Typography>
                  )}
                  {v.company && (
                    <Typography fontSize={14} color="text.secondary">
                      | 🏢 {v.company}
                    </Typography>
                  )}
                </Stack>

                <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={1}>
                  <Chip label={`Gate ${v.gate}`} size="small" />
                  <Chip label={`Host: ${v.host}`} size="small" />
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
                    label={`Inside: ${getLiveDuration(v.checkInTime)}`}
                    size="small"
                    color="primary"
                    sx={{ mt: 1 }}
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
                  ID: {v.visitorId} | Created: {new Date(v.createdAt).toLocaleString()}
                </Typography>

                {v.status === "OVERSTAY" && (
                  <MuiAlert severity="error" sx={{ mt: 2 }}>
                    ⚠️ OVERSTAY ALERT - Exceeded allowed time by {v.overstayMinutes || 0} minutes!
                  </MuiAlert>
                )}

                {v.status === "REJECTED" && v.rejectionReason && (
                  <MuiAlert severity="error" sx={{ mt: 2 }}>
                    Rejection Reason: {v.rejectionReason}
                  </MuiAlert>
                )}
              </Box>

              <Stack spacing={1} justifyContent="center">
                {v.status === "PENDING" && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => setApproveDialog(v)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => setRejectDialog(v)}
                    >
                      Reject
                    </Button>
                  </>
                )}

                {["APPROVED", "IN", "OVERSTAY"].includes(v.status) && (
                  <>
                    <Button variant="outlined" onClick={() => setSelectedVisitor(v)}>
                      View Details
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => downloadBadge(v._id)}
                    >
                      Download Badge
                    </Button>
                  </>
                )}
              </Stack>
            </Stack>
          </Paper>
        ))}
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
                No alerts
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

      <Dialog open={!!approveDialog} onClose={() => setApproveDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Visitor</DialogTitle>
        <DialogContent>
          {approveDialog && (
            <>
              <Typography mb={2}>
                Approve <strong>{approveDialog.name}</strong> for entry?
              </Typography>

              <TextField
                fullWidth
                label="Expected Duration (minutes)"
                type="number"
                value={expectedDuration}
                onChange={(e) => setExpectedDuration(Number(e.target.value))}
                margin="normal"
              />

              <Typography fontSize={13} color="text.secondary" mt={1}>
                Visitor will be allowed until:{" "}
                {new Date(Date.now() + expectedDuration * 60000).toLocaleString()}
              </Typography>

              <Typography fontSize={13} color="text.primary" mt={2}>
                ✉️ Confirmation email will be sent to:
              </Typography>
              <Typography fontSize={13} color="text.secondary">
                - Visitor: {approveDialog.email}
              </Typography>
              <Typography fontSize={13} color="text.secondary">
                - Host: {approveDialog.hostEmail}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(null)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={approveVisitor}>
            Approve & Send Email
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!rejectDialog} onClose={() => setRejectDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Visitor</DialogTitle>
        <DialogContent>
          {rejectDialog && (
            <>
              <Typography mb={2}>
                Reject <strong>{rejectDialog.name}</strong>?
              </Typography>

              <TextField
                fullWidth
                label="Rejection Reason"
                multiline
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                margin="normal"
                required
              />

              <Typography fontSize={13} color="text.secondary" mt={2}>
                ✉️ Rejection notification will be sent to {rejectDialog.email}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={rejectVisitor}
            disabled={!rejectionReason.trim()}
          >
            Reject & Send Email
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selectedVisitor} onClose={() => setSelectedVisitor(null)} maxWidth="md" fullWidth>
        <DialogTitle>Visitor Details</DialogTitle>
        <DialogContent>
          {selectedVisitor && (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography fontSize={13} color="text.secondary">
                    Name
                  </Typography>
                  <Typography fontWeight={600}>{selectedVisitor.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography fontSize={13} color="text.secondary">
                    Phone
                  </Typography>
                  <Typography fontWeight={600}>{selectedVisitor.phone}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography fontSize={13} color="text.secondary">
                    Email
                  </Typography>
                  <Typography fontWeight={600}>{selectedVisitor.email || "N/A"}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography fontSize={13} color="text.secondary">
                    Host
                  </Typography>
                  <Typography fontWeight={600}>{selectedVisitor.host}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography fontSize={13} color="text.secondary">
                    Gate
                  </Typography>
                  <Typography fontWeight={600}>{selectedVisitor.gate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography fontSize={13} color="text.secondary">
                    Status
                  </Typography>
                  <Chip label={selectedVisitor.status} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography fontSize={13} color="text.secondary">
                    Expected Duration
                  </Typography>
                  <Typography fontWeight={600}>{selectedVisitor.expectedDuration} minutes</Typography>
                </Grid>
                {selectedVisitor.allowedUntil && (
                  <Grid item xs={6}>
                    <Typography fontSize={13} color="text.secondary">
                      Valid Until
                    </Typography>
                    <Typography fontWeight={600}>
                      {new Date(selectedVisitor.allowedUntil).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {selectedVisitor.purpose && (
                  <Grid item xs={12}>
                    <Typography fontSize={13} color="text.secondary">
                      Purpose
                    </Typography>
                    <Typography fontWeight={600}>{selectedVisitor.purpose}</Typography>
                  </Grid>
                )}
              </Grid>

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => downloadBadge(selectedVisitor._id)}
              >
                Download Visitor Badge
              </Button>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedVisitor(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}