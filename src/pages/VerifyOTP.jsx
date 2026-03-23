import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const { verifyOTP } = useAuth();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyOTP(otp);

      if (result.success) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError(result.message || 'OTP verification failed');
      }
    } catch (verifyError) {
      console.error('OTP verification error:', verifyError);
      setError(verifyError.message || 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            width: '100%',
          }}
        >
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
            Verify OTP
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Enter the 6-digit OTP sent to your email
          </Typography>

          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="OTP"
                type="text"
                inputProps={{
                  maxLength: 6,
                  pattern: '[0-9]*',
                }}
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setOtp(value);
                  setError('');
                }}
                placeholder="000000"
                disabled={loading}
              />

              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading || otp.length !== 6}
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
              </Button>
            </Stack>
          </form>

          <Typography
            variant="body2"
            sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}
          >
            Didn't receive the OTP?{' '}
            <Button
              size="small"
              onClick={() => navigate('/login', { replace: true })}
            >
              Go back to login
            </Button>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}


