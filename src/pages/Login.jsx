// src/pages/Login.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Card, TextField, Button, Stack, Typography,
  CircularProgress, Alert, Container, InputAdornment,
  IconButton, Tabs, Tab,
} from "@mui/material";
import {
  Visibility, VisibilityOff,
  Email as EmailIcon, Lock as LockIcon,
} from "@mui/icons-material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { logger } from "../utils/logger";
import { getRedirectUrl } from "../routes/dashboardRoutes";

// ─── Helpers ────────────────────────────────────────────────────────────────

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

/**
 * Normalises the API response shape.
 *
 * api.js interceptor returns `response.data` directly, so after a successful
 * call `res` is already `{ token, user, ... }` — NOT `{ data: { token, user } }`.
 *
 * This helper handles both shapes defensively so a future interceptor change
 * won't break login again.
 *
 *   Shape A (current): res = { token, user, refreshToken }
 *   Shape B (fallback): res = { data: { token, user, refreshToken } }
 */
function extractPayload(res) {
  if (res?.token  && res?.user)       return res;       // Shape A — direct data
  if (res?.data?.token && res?.data?.user) return res.data; // Shape B — wrapped
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();
  const { loginUser, user, loading: authLoading } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // ── Email / password state ─────────────────────────────────────────────────
  const [formData,     setFormData]     = useState({ email: "", password: "" });
  const [errors,       setErrors]       = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading,    setIsLoading]    = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── OTP state ──────────────────────────────────────────────────────────────
  const [otpEmail,           setOtpEmail]           = useState("");
  const [otpCode,            setOtpCode]            = useState("");
  const [otpErrors,          setOtpErrors]          = useState({});
  const [otpGeneralError,    setOtpGeneralError]    = useState("");
  const [otpIsLoading,       setOtpIsLoading]       = useState(false);
  const [otpSent,            setOtpSent]            = useState(false);
  const [otpResendCountdown, setOtpResendCountdown] = useState(0);

  // ── Redirect once logged in ────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (user?._id && user?.email && user?.role) {
      navigate(getRedirectUrl(user.role), { replace: true });
    }
  }, [user, authLoading, navigate]);

  // ── Resend OTP countdown ───────────────────────────────────────────────────
  useEffect(() => {
    if (otpResendCountdown <= 0) return;
    const t = setInterval(() => setOtpResendCountdown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [otpResendCountdown]);

  // ════════════════════════════════════════════════════════════════════════════
  // EMAIL / PASSWORD LOGIN
  // ════════════════════════════════════════════════════════════════════════════

  const validateForm = useCallback(() => {
    const e = {};
    if (!formData.email.trim())
      e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = "Enter a valid email";
    if (!formData.password)
      e.password = "Password is required";
    else if (formData.password.length < 6)
      e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    setGeneralError("");
  };

  // ✅ form onSubmit handler only — button is type="submit" with NO onClick
  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setGeneralError("");
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      // api interceptor returns response.data → res = { token, user, ... }
      const res = await api.post("/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      const payload = extractPayload(res);
      if (!payload) throw new Error("Invalid server response");

      const result = loginUser(payload);
      if (result && !result.success) throw new Error(result.error || "Login failed");
    } catch (err) {
      const s = err.status;
      setGeneralError(
        s === 401 ? "Invalid credentials. Check your email and password." :
        s === 403 ? "Account is inactive. Contact administrator." :
        s === 404 ? "Account not found. Please register first." :
        s === 500 ? "Server error. Please try again later." :
        err.message?.includes("Network") ? "Cannot connect to server." :
        err.message || "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, loginUser]);

  // ════════════════════════════════════════════════════════════════════════════
  // OTP LOGIN
  // ════════════════════════════════════════════════════════════════════════════

  const validateOtpEmail = useCallback(() => {
    const e = {};
    if (!otpEmail.trim())
      e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail))
      e.email = "Enter a valid email";
    setOtpErrors(e);
    return Object.keys(e).length === 0;
  }, [otpEmail]);

  const handleSendOtp = useCallback(async () => {
    setOtpGeneralError("");
    if (!validateOtpEmail()) return;
    setOtpIsLoading(true);
    try {
      logger.debug("📧 Sending OTP to:", otpEmail);
      await api.post("/auth/send-otp", { email: otpEmail.trim().toLowerCase() });
      setOtpSent(true);
      setOtpResendCountdown(120);
    } catch (err) {
      logger.error("❌ OTP send error:", err);
      setOtpGeneralError(
        err.status === 429 ? "Too many requests. Wait before retrying." :
        err.data?.message || err.message || "Failed to send OTP."
      );
    } finally {
      setOtpIsLoading(false);
    }
  }, [otpEmail, validateOtpEmail]);

  const validateOtpCode = useCallback(() => {
    const e = {};
    if (!otpCode) e.code = "OTP is required";
    else if (!/^\d{6}$/.test(otpCode)) e.code = "OTP must be exactly 6 digits";
    setOtpErrors(e);
    return Object.keys(e).length === 0;
  }, [otpCode]);

  // ✅ Single-fire guarantee:
  //   • <form onSubmit={handleVerifyOtp}>  — the one true trigger
  //   • Verify button is type="submit" with NO onClick
  //   • e.preventDefault() stops page reload
  //   • otpIsLoading guard drops any duplicate call in-flight
  const handleVerifyOtp = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setOtpGeneralError("");
    if (!validateOtpCode()) return;
    if (otpIsLoading) return; // in-flight guard

    setOtpIsLoading(true);
    try {
      logger.debug("🔐 Verifying OTP for", otpEmail);

      // api interceptor returns response.data → res = { token, user, ... }
      const res = await api.post("/auth/verify-otp", {
        email: otpEmail.trim().toLowerCase(),
        otp: otpCode,
      });

      const payload = extractPayload(res);
      if (!payload) throw new Error("Invalid server response");

      logger.debug("✅ OTP verified — logging in");
      loginUser(payload); // redirect handled by useEffect above
    } catch (err) {
      logger.error("❌ OTP verification error:", err);
      setOtpGeneralError(
        err.status === 400
          ? (err.data?.error || err.data?.message || "Invalid or expired OTP. Request a new one.")
        : err.status === 401
          ? "OTP expired or invalid. Please request a new one."
        : err.message?.includes("Invalid server response")
          ? "Unexpected response from server. Please try again."
        : "OTP verification failed. Please try again."
      );
    } finally {
      setOtpIsLoading(false);
    }
  }, [otpEmail, otpCode, otpIsLoading, validateOtpCode, loginUser]);

  const handleResendOtp = useCallback(() => handleSendOtp(), [handleSendOtp]);

  const handleDemoLogin = useCallback(() => {
    setFormData({ email: "admin@test.com", password: "Admin123" });
  }, []);

  // ── Loading screen while auth initialises ─────────────────────────────────
  if (authLoading) {
    return (
      <Container maxWidth="sm" sx={{ height: "100vh", display: "flex", alignItems: "center" }}>
        <Box sx={{ textAlign: "center", width: "100%" }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h4" fontWeight={700} mb={1}>VPASS Login</Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to manage your facility
        </Typography>
        {/* Add back to home link with icon and label */}
        <Typography variant="caption" color="text.secondary">
          <a href="/book-visit" rel="noopener noreferrer">
            <ArrowBackIcon fontSize="small" /> Back to Home
          </a>
        </Typography>
      </Box>

      <Card sx={{ p: 4 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Email & Password" />
          <Tab label="OTP Login" />
        </Tabs>

        {/* ══ TAB 0: EMAIL / PASSWORD ══════════════════════════════════════ */}
        <TabPanel value={tabValue} index={0}>
          {generalError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGeneralError("")}>
              {generalError}
            </Alert>
          )}

          {/* onSubmit only — Login button is type="submit", no onClick */}
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth label="Email" name="email"
              value={formData.email} onChange={handleChange}
              error={!!errors.email} helperText={errors.email}
              margin="normal" placeholder="admin@test.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: "text.secondary", mr: 1 }} />
                  </InputAdornment>
                ),
              }}
              disabled={isLoading}
            />
            <TextField
              fullWidth label="Password" name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password} onChange={handleChange}
              error={!!errors.password} helperText={errors.password}
              margin="normal" placeholder="••••••••"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "text.secondary", mr: 1 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((p) => !p)}
                      edge="end"
                      disabled={!formData.password}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              disabled={isLoading}
            />

            {/* type="submit" — form's onSubmit is the single trigger */}
            <Button
              fullWidth variant="contained" size="large"
              type="submit" sx={{ mt: 3, mb: 2 }} disabled={isLoading}
            >
              {isLoading
                ? <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={20} sx={{ color: "white" }} />
                    <span>Logging in...</span>
                  </Stack>
                : "Login"}
            </Button>

            {/* type="button" — must NOT submit the form */}
            <Button
              fullWidth variant="outlined" size="large" type="button"
              onClick={handleDemoLogin} disabled={isLoading}
              sx={{ textTransform: "none", color: "#10b981", borderColor: "#10b981" }}
            >
              Use Demo Credentials
            </Button>

            <Box sx={{ mt: 3, p: 2, bgcolor: "#f0fdf4", borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                📝 Test Credentials:
              </Typography>
              <Typography variant="caption" display="block">
                <strong>Email:</strong> admin@test.com
              </Typography>
              <Typography variant="caption" display="block">
                <strong>Password:</strong> Admin123
              </Typography>
            </Box>
          </form>
        </TabPanel>

        {/* ══ TAB 1: OTP ═══════════════════════════════════════════════════ */}
        <TabPanel value={tabValue} index={1}>
          {otpGeneralError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOtpGeneralError("")}>
              {otpGeneralError}
            </Alert>
          )}

          {!otpSent ? (
            /* ── Step 1: enter email ──────────────────────────────────────── */
            <>
              <TextField
                fullWidth label="Email Address" value={otpEmail}
                onChange={(e) => {
                  setOtpEmail(e.target.value);
                  if (otpErrors.email) setOtpErrors({});
                }}
                error={!!otpErrors.email} helperText={otpErrors.email}
                margin="normal" placeholder="you@example.com"
                disabled={otpIsLoading}
              />
              {/* type="button" — this is NOT inside a <form>, but be explicit */}
              <Button
                fullWidth variant="contained" size="large" type="button"
                sx={{ mt: 3 }} onClick={handleSendOtp} disabled={otpIsLoading}
              >
                {otpIsLoading ? "Sending..." : "Send OTP"}
              </Button>
            </>
          ) : (
            /* ── Step 2: enter OTP ───────────────────────────────────────────
               IMPORTANT: <form onSubmit> is the SINGLE trigger.
               Verify button → type="submit", NO onClick.
               All other buttons inside → type="button" to prevent accidental submit. */
            <form onSubmit={handleVerifyOtp}>
              <TextField
                fullWidth label="Enter OTP Code" value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  if (otpErrors.code) setOtpErrors({});
                }}
                error={!!otpErrors.code} helperText={otpErrors.code}
                margin="normal" placeholder="000000"
                inputProps={{ maxLength: 6, inputMode: "numeric" }}
                disabled={otpIsLoading}
                autoFocus
              />

              {/* ✅ type="submit", NO onClick */}
              <Button
                fullWidth variant="contained" size="large" type="submit"
                sx={{ mt: 3 }} disabled={otpIsLoading || otpCode.length !== 6}
              >
                {otpIsLoading
                  ? <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={20} sx={{ color: "white" }} />
                      <span>Verifying...</span>
                    </Stack>
                  : "Verify OTP"}
              </Button>

              {/* ✅ type="button" — must NOT submit the form */}
              <Button
                fullWidth variant="text" size="small" type="button"
                sx={{ mt: 2, color: "#10b981" }}
                onClick={handleResendOtp}
                disabled={otpIsLoading || otpResendCountdown > 0}
              >
                {otpResendCountdown > 0 ? `Resend in ${otpResendCountdown}s` : "Resend OTP"}
              </Button>

              {/* ✅ type="button" — must NOT submit the form */}
              <Button
                fullWidth variant="text" size="small" type="button"
                sx={{ mt: 1 }}
                onClick={() => { setOtpSent(false); setOtpCode(""); setOtpErrors({}); }}
                disabled={otpIsLoading}
              >
                Change Email
              </Button>
            </form>
          )}
        </TabPanel>
      </Card>
    </Container>
  );
}