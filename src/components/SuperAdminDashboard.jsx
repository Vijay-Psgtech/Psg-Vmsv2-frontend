import React, { useEffect, useState, useMemo } from "react";
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
  Badge,
  IconButton,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Drawer,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from "@mui/material";

import LogoutIcon from "@mui/icons-material/Logout";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PeopleIcon from "@mui/icons-material/People";
import SecurityIcon from "@mui/icons-material/Security";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssessmentIcon from "@mui/icons-material/Assessment";
import NotificationsIcon from "@mui/icons-material/Notifications";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";

export default function SuperAdminDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [gates, setGates] = useState([]);
  
  // Dialogs
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(null);
  const [deleteUserDialog, setDeleteUserDialog] = useState(null);
  const [viewUserDialog, setViewUserDialog] = useState(null);
  const [addDepartmentDialog, setAddDepartmentDialog] = useState(false);
  const [addGateDialog, setAddGateDialog] = useState(false);
  
  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [userDepartmentFilter, setUserDepartmentFilter] = useState("ALL");
  const [visitorSearch, setVisitorSearch] = useState("");
  const [visitorStatusFilter, setVisitorStatusFilter] = useState("ALL");
  
  // Form states
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "admin",
    department: "",
    gateId: "",
    isActive: true,
  });
  
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    code: "",
    description: "",
  });
  
  const [newGate, setNewGate] = useState({
    id: "",
    name: "",
    location: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [, forceUpdate] = useState(0);

  const superAdmin = JSON.parse(localStorage.getItem("user") || "{}");

  // Load data
  useEffect(() => {
    loadUsers();
    loadVisitors();
    loadAlerts();
    loadDepartments();
    loadGates();

    const interval = setInterval(() => {
      loadUsers();
      loadVisitors();
      loadAlerts();
    }, 30000);

    const timer = setInterval(() => forceUpdate((n) => n + 1), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const loadVisitors = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/visitor/visitorList", {
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

  const loadDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/departments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {
      // Use default departments if API fails
      setDepartments([
        { _id: "1", name: "Engineering", code: "ENG" },
        { _id: "2", name: "Human Resources", code: "HR" },
        { _id: "3", name: "Sales", code: "SALES" },
        { _id: "4", name: "Marketing", code: "MKT" },
        { _id: "5", name: "Operations", code: "OPS" },
        { _id: "6", name: "Finance", code: "FIN" },
      ]);
    }
  };

  const loadGates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/buildings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGates(data);
      }
    } catch (err) {
      // Use default gates if API fails
      setGates([
        { _id: "GATE-1", name: "Main Gate - Building A", location: "North Entrance" },
        { _id: "GATE-2", name: "East Gate - Building B", location: "East Wing" },
        { _id: "GATE-3", name: "West Gate - Building C", location: "West Wing" },
      ]);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError("Please fill all required fields");
      return;
    }

    if (newUser.role === "security" && !newUser.gateId) {
      setError("Please select a gate for security personnel");
      return;
    }

    if (newUser.role === "admin" && !newUser.department) {
      setError("Please select a department for admin");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/userSave", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add user");
      }

      setSuccess("User added successfully!");
      setAddUserDialog(false);
      setNewUser({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "admin",
        department: "",
        gateId: "",
        isActive: true,
      });
      loadUsers();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editUserDialog) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/userUpdate/${editUserDialog._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editUserDialog),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update user");
      }

      setSuccess("User updated successfully!");
      setEditUserDialog(null);
      loadUsers();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserDialog) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/userDelete/${deleteUserDialog._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete user");
      }

      setSuccess("User deleted successfully!");
      setDeleteUserDialog(null);
      loadUsers();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/userStatus/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        loadUsers();
      }
    } catch (err) {
      console.error("Failed to toggle user status", err);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // Statistics
  const stats = useMemo(() => {
    const adminCount = users.filter((u) => u.role === "admin").length;
    const securityCount = users.filter((u) => u.role === "security").length;
    const receptionCount = users.filter((u) => u.role === "reception").length;
    const activeUsers = users.filter((u) => u.isActive !== false).length;

    const totalVisitors = visitors.length;
    const pendingVisitors = visitors.filter((v) => v.status === "PENDING").length;
    const approvedVisitors = visitors.filter((v) => v.status === "APPROVED").length;
    const insideVisitors = visitors.filter((v) => v.status === "IN").length;
    const overstayVisitors = visitors.filter((v) => v.status === "OVERSTAY").length;

    const criticalAlerts = alerts.filter((a) => a.severity === "CRITICAL").length;
    const highAlerts = alerts.filter((a) => a.severity === "HIGH").length;

    return {
      users: {
        total: users.length,
        admin: adminCount,
        security: securityCount,
        reception: receptionCount,
        active: activeUsers,
      },
      visitors: {
        total: totalVisitors,
        pending: pendingVisitors,
        approved: approvedVisitors,
        inside: insideVisitors,
        overstay: overstayVisitors,
      },
      alerts: {
        total: alerts.length,
        critical: criticalAlerts,
        high: highAlerts,
      },
      departments: departments.length,
      gates: gates.length,
    };
  }, [users, visitors, alerts, departments, gates]);

  // Filtered data
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.phone?.includes(userSearch);

      const matchRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
      const matchDepartment =
        userDepartmentFilter === "ALL" || u.department === userDepartmentFilter;

      return matchSearch && matchRole && matchDepartment;
    });
  }, [users, userSearch, userRoleFilter, userDepartmentFilter]);

  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      const matchSearch =
        v.name?.toLowerCase().includes(visitorSearch.toLowerCase()) ||
        v.phone?.includes(visitorSearch) ||
        v.visitorId?.includes(visitorSearch.toUpperCase());

      const matchStatus = visitorStatusFilter === "ALL" || v.status === visitorStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [visitors, visitorSearch, visitorStatusFilter]);

  const getRoleColor = (role) => {
    switch (role) {
      case "superadmin":
        return "#8b5cf6";
      case "admin":
        return "#3b82f6";
      case "security":
        return "#10b981";
      case "reception":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "APPROVED":
        return "success";
      case "IN":
        return "primary";
      case "OVERSTAY":
        return "error";
      case "OUT":
        return "default";
      case "REJECTED":
        return "error";
      default:
        return "default";
    }
  };

  const exportData = (type) => {
    let data, filename;

    if (type === "users") {
      data = users;
      filename = "users_export.json";
    } else if (type === "visitors") {
      data = visitors;
      filename = "visitors_export.json";
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <Box p={4} bgcolor="#F8FAFC" minHeight="100vh">
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
        flexWrap="wrap"
        gap={2}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: "#8b5cf6", width: 60, height: 60 }}>
            <SupervisorAccountIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Super Admin Dashboard
            </Typography>
            <Typography fontSize={14} color="text.secondary">
              {superAdmin?.name} • {superAdmin?.email}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2}>
          <IconButton onClick={() => loadUsers()}>
            <RefreshIcon />
          </IconButton>
          <IconButton>
            <Badge badgeContent={alerts.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={logout}>
            Logout
          </Button>
        </Stack>
      </Stack>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Overview Stats */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderLeft: "4px solid #3b82f6" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontSize={13} color="text.secondary">
                    Total Users
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.users.total}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary" mt={1}>
                    {stats.users.active} Active
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#3b82f610" }}>
                  <PeopleIcon sx={{ color: "#3b82f6" }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderLeft: "4px solid #10b981" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontSize={13} color="text.secondary">
                    Admins
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.users.admin}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary" mt={1}>
                    {departments.length} Departments
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#10b98110" }}>
                  <AdminPanelSettingsIcon sx={{ color: "#10b981" }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderLeft: "4px solid #f59e0b" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontSize={13} color="text.secondary">
                    Security Personnel
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.users.security}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary" mt={1}>
                    {gates.length} Gates
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#f59e0b10" }}>
                  <SecurityIcon sx={{ color: "#f59e0b" }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderLeft: "4px solid #ef4444" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontSize={13} color="text.secondary">
                    Total Visitors
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.visitors.total}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary" mt={1}>
                    {stats.visitors.inside} Inside Now
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#ef444410" }}>
                  <DashboardIcon sx={{ color: "#ef4444" }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Stats */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              System Overview
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Active Admins</Typography>
                <Chip label={stats.users.admin} color="primary" size="small" />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Active Security</Typography>
                <Chip label={stats.users.security} color="success" size="small" />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Reception Staff</Typography>
                <Chip label={stats.users.reception} color="warning" size="small" />
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography>Departments</Typography>
                <Chip label={stats.departments} size="small" />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Gates</Typography>
                <Chip label={stats.gates} size="small" />
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Visitor Statistics
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Pending Approval</Typography>
                <Chip label={stats.visitors.pending} color="warning" size="small" />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Approved</Typography>
                <Chip label={stats.visitors.approved} color="success" size="small" />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Currently Inside</Typography>
                <Chip label={stats.visitors.inside} color="primary" size="small" />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Overstaying</Typography>
                <Chip label={stats.visitors.overstay} color="error" size="small" />
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={600}>Critical Alerts</Typography>
                <Chip label={stats.alerts.critical} color="error" size="small" />
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={`Users (${stats.users.total})`} />
          <Tab label={`Visitors (${stats.visitors.total})`} />
          <Tab label={`Departments (${stats.departments})`} />
          <Tab label={`Gates (${stats.gates})`} />
          <Tab label="System Logs" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Box>
          {/* User Management Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={600}>
              User Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setAddUserDialog(true)}
            >
              Add New User
            </Button>
          </Stack>

          {/* User Filters */}
          <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" gap={2}>
            <TextField
              placeholder="Search users..."
              size="small"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              sx={{ minWidth: 250 }}
            />

            <Select
              size="small"
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="ALL">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="security">Security</MenuItem>
              <MenuItem value="reception">Reception</MenuItem>
            </Select>

            <Select
              size="small"
              value={userDepartmentFilter}
              onChange={(e) => setUserDepartmentFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="ALL">All Departments</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d._id} value={d.name}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>

            <Button startIcon={<DownloadIcon />} onClick={() => exportData("users")}>
              Export
            </Button>
          </Stack>

          {/* Users Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell fontWeight={600}>Name</TableCell>
                  <TableCell fontWeight={600}>Email</TableCell>
                  <TableCell fontWeight={600}>Role</TableCell>
                  <TableCell fontWeight={600}>Department/Gate</TableCell>
                  <TableCell fontWeight={600}>Status</TableCell>
                  <TableCell fontWeight={600}>Created</TableCell>
                  <TableCell fontWeight={600}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ bgcolor: getRoleColor(user.role), width: 32, height: 32 }}>
                          {user.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={600}>{user.name}</Typography>
                          <Typography fontSize={12} color="text.secondary">
                            {user.phone || "N/A"}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: `${getRoleColor(user.role)}20`,
                          color: getRoleColor(user.role),
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {user.role === "admin" && user.department}
                      {user.role === "security" && `Gate ${user.gateId}`}
                      {user.role === "reception" && "Reception Desk"}
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={user.isActive !== false}
                            onChange={() => handleToggleUserStatus(user._id, user.isActive)}
                            size="small"
                          />
                        }
                        label={user.isActive !== false ? "Active" : "Inactive"}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={12}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" onClick={() => setViewUserDialog(user)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setEditUserDialog(user)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteUserDialog(user)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredUsers.length === 0 && (
            <Paper sx={{ p: 4, textAlign: "center", mt: 2 }}>
              <Typography color="text.secondary">No users found</Typography>
            </Paper>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          {/* Visitor Management Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={600}>
              Visitor Management
            </Typography>
            <Button startIcon={<DownloadIcon />} onClick={() => exportData("visitors")}>
              Export Visitors
            </Button>
          </Stack>

          {/* Visitor Filters */}
          <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" gap={2}>
            <TextField
              placeholder="Search visitors..."
              size="small"
              value={visitorSearch}
              onChange={(e) => setVisitorSearch(e.target.value)}
              sx={{ minWidth: 250 }}
            />

            <Select
              size="small"
              value={visitorStatusFilter}
              onChange={(e) => setVisitorStatusFilter(e.target.value)}
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
          </Stack>

          {/* Visitors List */}
          <Stack spacing={2}>
            {filteredVisitors.slice(0, 50).map((visitor) => (
              <Paper key={visitor._id} sx={{ p: 3, borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" fontWeight={600}>
                      {visitor.name}
                    </Typography>
                    <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={1}>
                      <Chip label={visitor.visitorId} size="small" />
                      <Chip label={`Host: ${visitor.host}`} size="small" />
                      <Chip label={`Gate ${visitor.gate}`} size="small" />
                      <Chip label={visitor.status} color={getStatusColor(visitor.status)} size="small" />
                    </Stack>
                    <Typography fontSize={13} color="text.secondary" mt={1}>
                      📞 {visitor.phone} • ✉️ {visitor.email}
                    </Typography>
                    {visitor.purpose && (
                      <Typography fontSize={13} color="text.secondary" mt={1}>
                        Purpose: {visitor.purpose}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Stack spacing={1} alignItems="flex-end">
                      <Typography fontSize={12} color="text.secondary">
                        Created: {new Date(visitor.createdAt).toLocaleString()}
                      </Typography>
                      {visitor.checkInTime && (
                        <Typography fontSize={12} color="text.secondary">
                          Checked In: {new Date(visitor.checkInTime).toLocaleString()}
                        </Typography>
                      )}
                      {visitor.checkOutTime && (
                        <Typography fontSize={12} color="text.secondary">
                          Checked Out: {new Date(visitor.checkOutTime).toLocaleString()}
                        </Typography>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>

          {filteredVisitors.length === 0 && (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">No visitors found</Typography>
            </Paper>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={600}>
              Department Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setAddDepartmentDialog(true)}
            >
              Add Department
            </Button>
          </Stack>

          <Grid container spacing={2}>
            {departments.map((dept) => (
              <Grid item xs={12} md={4} key={dept._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600}>
                      {dept.name}
                    </Typography>
                    <Chip label={dept.code} size="small" sx={{ mt: 1 }} />
                    {dept.description && (
                      <Typography fontSize={13} color="text.secondary" mt={2}>
                        {dept.description}
                      </Typography>
                    )}
                    <Typography fontSize={12} color="text.secondary" mt={2}>
                      {users.filter((u) => u.department === dept.name).length} Admins
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {tabValue === 3 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={600}>
              Gate Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setAddGateDialog(true)}
            >
              Add Gate
            </Button>
          </Stack>

          <Grid container spacing={2}>
            {gates.map((gate) => (
              <Grid item xs={12} md={4} key={gate._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600}>
                      {gate.name}
                    </Typography>
                    <Chip label={gate._id} size="small" sx={{ mt: 1 }} />
                    {gate.location && (
                      <Typography fontSize={13} color="text.secondary" mt={2}>
                        📍 {gate.location}
                      </Typography>
                    )}
                    <Typography fontSize={12} color="text.secondary" mt={2}>
                      {users.filter((u) => u.gateId === gate._id).length} Security Personnel
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      {visitors.filter((v) => v.gate === gate._id).length} Total Visitors
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {tabValue === 4 && (
        <Box>
          <Typography variant="h5" fontWeight={600} mb={3}>
            System Activity Logs
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">
              System logs and audit trail will be displayed here
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Add User Dialog */}
      <Dialog open={addUserDialog} onClose={() => setAddUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Phone"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                label="Role"
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="security">Security</MenuItem>
                <MenuItem value="reception">Reception</MenuItem>
              </Select>
            </FormControl>

            {newUser.role === "admin" && (
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  label="Department"
                >
                  {departments.map((d) => (
                    <MenuItem key={d._id} value={d.name}>
                      {d.name} ({d.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {newUser.role === "security" && (
              <FormControl fullWidth>
                <InputLabel>Assign Gate</InputLabel>
                <Select
                  value={newUser.gateId}
                  onChange={(e) => setNewUser({ ...newUser, gateId: e.target.value })}
                  label="Assign Gate"
                >
                  {gates.map((g) => (
                    <MenuItem key={g._id} value={g._id}>
                      {g.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={newUser.isActive}
                  onChange={(e) => setNewUser({ ...newUser, isActive: e.target.checked })}
                />
              }
              label="Active Status"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddUser} disabled={loading}>
            {loading ? "Adding..." : "Add User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={!!editUserDialog}
        onClose={() => setEditUserDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {editUserDialog && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={editUserDialog.name}
                onChange={(e) => setEditUserDialog({ ...editUserDialog, name: e.target.value })}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editUserDialog.email}
                onChange={(e) => setEditUserDialog({ ...editUserDialog, email: e.target.value })}
              />
              <TextField
                fullWidth
                label="Phone"
                value={editUserDialog.phone || ""}
                onChange={(e) => setEditUserDialog({ ...editUserDialog, phone: e.target.value })}
              />

              {editUserDialog.role === "admin" && (
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={editUserDialog.department || ""}
                    onChange={(e) =>
                      setEditUserDialog({ ...editUserDialog, department: e.target.value })
                    }
                    label="Department"
                  >
                    {departments.map((d) => (
                      <MenuItem key={d._id} value={d.name}>
                        {d.name} ({d.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {editUserDialog.role === "security" && (
                <FormControl fullWidth>
                  <InputLabel>Assign Gate</InputLabel>
                  <Select
                    value={editUserDialog.gateId || ""}
                    onChange={(e) =>
                      setEditUserDialog({ ...editUserDialog, gateId: e.target.value })
                    }
                    label="Assign Gate"
                  >
                    {gates.map((g) => (
                      <MenuItem key={g._id} value={g._id}>
                        {g.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={editUserDialog.isActive !== false}
                    onChange={(e) =>
                      setEditUserDialog({ ...editUserDialog, isActive: e.target.checked })
                    }
                  />
                }
                label="Active Status"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateUser} disabled={loading}>
            {loading ? "Updating..." : "Update User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog
        open={!!deleteUserDialog}
        onClose={() => setDeleteUserDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          {deleteUserDialog && (
            <Typography>
              Are you sure you want to delete <strong>{deleteUserDialog.name}</strong>? This action
              cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUserDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteUser} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View User Dialog */}
      <Dialog
        open={!!viewUserDialog}
        onClose={() => setViewUserDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {viewUserDialog && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box>
                <Typography fontSize={13} color="text.secondary">
                  Name
                </Typography>
                <Typography fontWeight={600}>{viewUserDialog.name}</Typography>
              </Box>
              <Box>
                <Typography fontSize={13} color="text.secondary">
                  Email
                </Typography>
                <Typography fontWeight={600}>{viewUserDialog.email}</Typography>
              </Box>
              <Box>
                <Typography fontSize={13} color="text.secondary">
                  Phone
                </Typography>
                <Typography fontWeight={600}>{viewUserDialog.phone || "N/A"}</Typography>
              </Box>
              <Box>
                <Typography fontSize={13} color="text.secondary">
                  Role
                </Typography>
                <Chip label={viewUserDialog.role.toUpperCase()} size="small" />
              </Box>
              {viewUserDialog.department && (
                <Box>
                  <Typography fontSize={13} color="text.secondary">
                    Department
                  </Typography>
                  <Typography fontWeight={600}>{viewUserDialog.department}</Typography>
                </Box>
              )}
              {viewUserDialog.gateId && (
                <Box>
                  <Typography fontSize={13} color="text.secondary">
                    Assigned Gate
                  </Typography>
                  <Typography fontWeight={600}>Gate {viewUserDialog.gateId}</Typography>
                </Box>
              )}
              <Box>
                <Typography fontSize={13} color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={viewUserDialog.isActive !== false ? "Active" : "Inactive"}
                  color={viewUserDialog.isActive !== false ? "success" : "default"}
                  size="small"
                />
              </Box>
              <Box>
                <Typography fontSize={13} color="text.secondary">
                  Created At
                </Typography>
                <Typography fontWeight={600}>
                  {new Date(viewUserDialog.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewUserDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
