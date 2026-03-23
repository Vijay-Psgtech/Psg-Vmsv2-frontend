"use client";

import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Alert,
  CircularProgress,
  Box,
  InputAdornment,
  Chip,
  Typography,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import DoorFrontIcon from "@mui/icons-material/DoorFront";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SaveIcon from "@mui/icons-material/Save";

import api from "../utils/api";

export default function VisitorRegistrationForm({ onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    company: "",
    purpose: "",
    host: "",
    gate: "",
    date: "",
    time: "",
    expectedDuration: 120,
    vehicleNumber: "",
  });

  const [employees, setEmployees] = useState([]);
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  /* ================= LOAD EMPLOYEES & GATES ================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesRes, gatesRes] = await Promise.all([
          api.get("/visitor/employees"),
          api.get("/visitor/buildings"),
        ]);
        setEmployees(employeesRes.data || []);
        setGates(gatesRes.data || []);
      } catch (err) {
        console.error("Failed to load data", err);
        setError("Failed to load employees and gates");
      }
    };
    loadData();
  }, []);

  /* ================= SET DEFAULT DATE/TIME ================= */
  useEffect(() => {
    const now = new Date();
    setForm((prev) => ({
      ...prev,
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().slice(0, 5),
    }));
  }, []);

  /* ================= HANDLE CHANGE ================= */
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  /* ================= VALIDATE FORM ================= */
  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.phone.trim()) errors.phone = "Phone is required";
    else if (!/^\d{10}$/.test(form.phone))
      errors.phone = "Phone must be 10 digits";

    if (!form.host) errors.host = "Host is required";
    if (!form.gate) errors.gate = "Gate is required";
    if (!form.date) errors.date = "Date is required";
    if (!form.time) errors.time = "Time is required";

    const selectedDateTime = new Date(`${form.date}T${form.time}`);
    if (selectedDateTime.getTime() < Date.now() - 60000) {
      errors.date = "Cannot schedule for past date/time";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ================= SUBMIT ================= */
  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      setError("Please fix the errors below");
      return;
    }

    setLoading(true);

    try {
      const allowedUntil = new Date(`${form.date}T${form.time}`);

      await api.post("/visitor/create", {
        ...form,
        expectedDuration: Number(form.expectedDuration),
        allowedUntil,
      });

      const now = new Date();
      setForm({
        name: "",
        phone: "",
        company: "",
        purpose: "",
        host: "",
        gate: "",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().slice(0, 5),
        expectedDuration: 120,
        vehicleNumber: "",
      });

      onSuccess?.("✅ Visitor registered successfully! Pending admin approval.");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= CALCULATE ALLOWED UNTIL ================= */
  const getAllowedUntil = () => {
    if (!form.date || !form.time) return "";
    const dt = new Date(`${form.date}T${form.time}`);
    dt.setMinutes(dt.getMinutes() + Number(form.expectedDuration));
    return dt.toLocaleString();
  };

  return (
    <Box component="form" onSubmit={submit}>
      <Stack spacing={2.5}>
        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <TextField
          label="Visitor Name"
          name="name"
          value={form.name}
          onChange={onChange}
          error={!!validationErrors.name}
          helperText={validationErrors.name}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon />
              </InputAdornment>
            ),
          }}
          required
          fullWidth
        />

        <TextField
          label="Phone Number"
          name="phone"
          value={form.phone}
          onChange={onChange}
          error={!!validationErrors.phone}
          helperText={validationErrors.phone || "10 digit number"}
          inputProps={{ maxLength: 10 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon />
              </InputAdornment>
            ),
          }}
          required
          fullWidth
        />

        <TextField
          label="Company (Optional)"
          name="company"
          value={form.company}
          onChange={onChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <BusinessIcon />
              </InputAdornment>
            ),
          }}
          fullWidth
        />

        <TextField
          label="Purpose of Visit"
          name="purpose"
          value={form.purpose}
          onChange={onChange}
          fullWidth
        />

        <FormControl fullWidth error={!!validationErrors.host} required>
          <InputLabel>Select Host</InputLabel>
          <Select name="host" value={form.host} onChange={onChange} label="Select Host">
            <MenuItem value="">
              <em>-- Select Host --</em>
            </MenuItem>
            {employees.map((e) => (
              <MenuItem key={e._id} value={e.name}>
                {e.name} — {e.department}
              </MenuItem>
            ))}
          </Select>
          {validationErrors.host && (
            <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>
              {validationErrors.host}
            </Typography>
          )}
        </FormControl>

        <FormControl fullWidth error={!!validationErrors.gate} required>
          <InputLabel>Select Gate</InputLabel>
          <Select name="gate" value={form.gate} onChange={onChange} label="Select Gate">
            <MenuItem value="">
              <em>-- Select Gate --</em>
            </MenuItem>
            {gates.map((g) => (
              <MenuItem key={g._id} value={g._id}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <DoorFrontIcon fontSize="small" />
                  <span>{g.name}</span>
                </Stack>
              </MenuItem>
            ))}
          </Select>
          {validationErrors.gate && (
            <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>
              {validationErrors.gate}
            </Typography>
          )}
        </FormControl>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            type="date"
            label="Visit Date"
            name="date"
            value={form.date}
            onChange={onChange}
            error={!!validationErrors.date}
            helperText={validationErrors.date}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            type="time"
            label="Visit Time"
            name="time"
            value={form.time}
            onChange={onChange}
            error={!!validationErrors.time}
            helperText={validationErrors.time}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>

        <FormControl fullWidth>
          <InputLabel>Expected Duration</InputLabel>
          <Select
            name="expectedDuration"
            value={form.expectedDuration}
            onChange={onChange}
            label="Expected Duration"
          >
            <MenuItem value={30}>30 minutes</MenuItem>
            <MenuItem value={60}>1 hour</MenuItem>
            <MenuItem value={120}>2 hours</MenuItem>
            <MenuItem value={180}>3 hours</MenuItem>
            <MenuItem value={240}>4 hours</MenuItem>
            <MenuItem value={480}>Full day (8 hours)</MenuItem>
          </Select>
        </FormControl>

        {form.date && form.time && (
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f0f9ff" }}>
            <Typography fontSize={13} color="text.secondary">
              Visit Schedule
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                label={`Entry: ${new Date(
                  `${form.date}T${form.time}`
                ).toLocaleString()}`}
              />
              <Typography>→</Typography>
              <Chip size="small" color="success" label={`Valid until: ${getAllowedUntil()}`} />
            </Stack>
          </Box>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? "Registering..." : "Register Visitor"}
        </Button>
      </Stack>
    </Box>
  );
}




