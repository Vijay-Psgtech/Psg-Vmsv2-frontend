// src/pages/Register.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  TextField,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Container,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  LinearProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

// Password strength calculator
const calculatePasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 12.5;
  if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;
  return Math.min(strength, 100);
};

const getPasswordStrengthColor = (strength) => {
  if (strength < 40) return "#ef4444";
  if (strength < 70) return "#f59e0b";
  return "#10b981";
};

const getPasswordStrengthLabel = (strength) => {
  if (strength < 40) return "Weak";
  if (strength < 70) return "Fair";
  return "Strong";
};

export default function Register() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "reception",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Check if already logged in
  useEffect(() => {
    if (!loading && user && user.email) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  // Update password strength on change
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(calculatePasswordStrength(formData.password));
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Name must not exceed 50 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (passwordStrength < 40) {
      newErrors.password = "Password is too weak. Add uppercase, numbers, or symbols.";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    setGeneralError("");
  };

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMessage("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      if (response.data.user && response.data.token) {
        setSuccessMessage(
          "✅ Registration successful! Redirecting to login..."
        );
        
        // Clear form
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "reception",
          agreeToTerms: false,
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      } else {
        setGeneralError("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);

      if (error.response?.status === 400) {
        // Check for specific validation errors
        const errorMsg = error.response?.data?.error || error.response?.data?.message;
        if (errorMsg?.includes("email")) {
          setErrors((prev) => ({
            ...prev,
            email: "Email already registered. Please try another or login.",
          }));
        } else if (errorMsg?.includes("password")) {
          setErrors((prev) => ({
            ...prev,
            password: "Password does not meet requirements.",
          }));
        } else {
          setGeneralError(errorMsg || "Validation error. Please check your inputs.");
        }
      } else if (error.response?.status === 500) {
        setGeneralError(
          "Server error. Please try again later or contact support."
        );
      } else if (error.message === "Network Error") {
        setGeneralError(
          "Cannot connect to server. Please ensure backend is running."
        );
      } else {
        setGeneralError(
          error.response?.data?.message ||
          error.message ||
          "Registration failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        py={4}
      >
        {/* Logo/Header */}
        <Box mb={4} textAlign="center">
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
              mb: 2,
            }}
          >
            <SecurityIcon sx={{ fontSize: 40, color: "#10b981" }} />
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              VPASS
            </Typography>
          </Box>
          <Typography color="text.secondary" variant="body2">
            Create Your Account
          </Typography>
        </Box>

        {/* Register Card */}
        <Card
          sx={{
            width: "100%",
            p: 4,
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            borderRadius: 2,
          }}
        >
          {/* Title */}
          <Typography variant="h5" fontWeight={700} mb={1}>
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Join the visitor management system
          </Typography>

          <form onSubmit={handleRegister}>
            {/* Error Alert */}
            {generalError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGeneralError("")}>
                {generalError}
              </Alert>
            )}

            {/* Success Alert */}
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            {/* Full Name Field */}
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              margin="normal"
              placeholder="John Doe"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: "text.secondary", mr: 1 }} />
                  </InputAdornment>
                ),
              }}
              disabled={isLoading}
              autoComplete="name"
            />

            {/* Email Field */}
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              margin="normal"
              placeholder="john@example.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: "text.secondary", mr: 1 }} />
                  </InputAdornment>
                ),
              }}
              disabled={isLoading}
              autoComplete="email"
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              placeholder="••••••••"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "text.secondary", mr: 1 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              disabled={isLoading}
              autoComplete="new-password"
            />

            {/* Password Strength Indicator */}
            {formData.password && (
              <Box mt={1}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="caption">Password Strength:</Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: getPasswordStrengthColor(passwordStrength),
                      fontWeight: 600,
                    }}
                  >
                    {getPasswordStrengthLabel(passwordStrength)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength}
                  sx={{
                    height: 6,
                    borderRadius: 1,
                    backgroundColor: "#e5e7eb",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: getPasswordStrengthColor(passwordStrength),
                    },
                  }}
                />
              </Box>
            )}

            {/* Confirm Password Field */}
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              margin="normal"
              placeholder="••••••••"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "text.secondary", mr: 1 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              disabled={isLoading}
              autoComplete="new-password"
            />

            {/* Role Selection */}
            <FormControl fullWidth margin="normal" disabled={isLoading}>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
              >
                <MenuItem value="reception">Reception Staff</MenuItem>
                <MenuItem value="security">Security Officer</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
              </Select>
            </FormControl>

            {/* Terms Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              }
              label={
                <Typography variant="caption">
                  I agree to the Terms of Service and Privacy Policy
                </Typography>
              }
              sx={{ mt: 2 }}
            />
            {errors.agreeToTerms && (
              <Typography variant="caption" color="error" display="block" mt={1}>
                {errors.agreeToTerms}
              </Typography>
            )}

            {/* Register Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 3,
                mb: 2,
                bgcolor: "#10b981",
                "&:hover": {
                  bgcolor: "#059669",
                },
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
              }}
              onClick={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={20} sx={{ color: "white" }} />
                  <span>Creating Account...</span>
                </Stack>
              ) : (
                "Create Account"
              )}
            </Button>

            {/* Footer */}
            <Box textAlign="center">
              <Typography variant="caption" color="text.secondary">
                Already have an account?{" "}
                <Box
                  component="button"
                  onClick={() => navigate("/login")}
                  sx={{
                    background: "none",
                    border: "none",
                    color: "#10b981",
                    textDecoration: "none",
                    fontWeight: 600,
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Sign in here
                </Box>
              </Typography>
            </Box>
          </form>
        </Card>

        {/* Password Requirements */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: "#f9fafb",
            borderRadius: 1,
            border: "1px solid #e5e7eb",
            fontSize: "0.8rem",
          }}
        >
          <Typography variant="caption" fontWeight={600} display="block" mb={1}>
            Password Requirements:
          </Typography>
          <Typography variant="caption" display="block">
            ✓ At least 8 characters
          </Typography>
          <Typography variant="caption" display="block">
            ✓ Mix of uppercase and lowercase letters
          </Typography>
          <Typography variant="caption" display="block">
            ✓ At least one number
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}