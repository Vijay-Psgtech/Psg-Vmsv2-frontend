import React, { useState, useCallback } from 'react';
import {
  Alert,
  CircularProgress,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  Stack,
  Paper,
  Card,
  CardContent,
  Divider,
  Grid,
  Modal,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../utils/api';

// ✅ Status color configuration
const STATUS_CONFIG = {
  Approved: {
    bgColor: '#dcfce7',
    textColor: '#166534',
    severity: 'success',
    icon: '✅',
    message: 'Please arrive 10 minutes early. Carry your ID card and wear a visitor badge.',
  },
  Pending: {
    bgColor: '#fef3c7',
    textColor: '#92400e',
    severity: 'warning',
    icon: '⏳',
    message: 'Your appointment request is still under review. Check again later or contact the office.',
  },
  Rejected: {
    bgColor: '#fee2e2',
    textColor: '#991b1b',
    severity: 'error',
    icon: '❌',
    message: 'Your appointment was not approved. Please contact support or reschedule.',
  },
  IN: {
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    severity: 'info',
    icon: '✅',
    message: 'You are currently checked in. Please proceed to your destination.',
  },
  OUT: {
    bgColor: '#e5e7eb',
    textColor: '#374151',
    severity: 'default',
    icon: '👋',
    message: 'Thank you for visiting! Your appointment has been closed.',
  },
  EXPIRED: {
    bgColor: '#fecaca',
    textColor: '#7f1d1d',
    severity: 'error',
    icon: '⏰',
    message: 'Your visit duration has expired. Please check out with security.',
  },
};

const AppointmentStatus = ({ visitorId: initialVisitorId = '' }) => {
  // ✅ State management
  const [visitorId, setVisitorId] = useState(initialVisitorId);
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // ✅ Get status config with fallback
  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || {
      bgColor: '#f3f4f6',
      textColor: '#6b7280',
      severity: 'default',
      icon: '📋',
      message: 'Check appointment details below.',
    };
  };

  // ✅ Fetch appointment data
  const fetchAppointment = useCallback(async (id) => {
    if (!id.trim()) {
      setError('Please enter a Visitor ID');
      return;
    }

    setLoading(true);
    setError('');
    setAppointment(null);
    setNotFound(false);

    try {
      // Try multiple API endpoints for compatibility
      let response;
      
      try {
        response = await api.get(`/api/visitor/check/${id}`);
      } catch {
        // Fallback to another endpoint
        response = await api.get(`/api/visitor/${id}`);
      }

      const visitor = response.data?.visitor || response.data;

      if (visitor && visitor._id) {
        setAppointment(visitor);
        setNotFound(false);
      } else {
        setNotFound(true);
        setError('❌ No appointment found for this Visitor ID');
      }
    } catch (err) {
      console.error('Error checking appointment:', err);

      if (err.response?.status === 404) {
        setNotFound(true);
        setError('❌ No appointment found. Please check your Visitor ID and try again.');
      } else if (err.response?.status === 500) {
        setError('❌ Server error. Please try again later.');
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          'Failed to check appointment. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Handle search
  const handleCheck = () => {
    fetchAppointment(visitorId);
  };

  // ✅ Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleCheck();
    }
  };

  // ✅ Download QR code
  const downloadQR = () => {
    if (!appointment) return;

    const link = document.createElement('a');
    link.href = `${import.meta.env.VITE_API_URL}/api/visitor/${appointment._id}/qr-code?token=${localStorage.getItem('token')}`;
    link.download = `visitor-qr-${appointment.visitorId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ Print QR code
  const printQR = () => {
    if (!appointment) return;

    const printWindow = window.open('', '', 'height=400,width=600');
    const qrUrl = `${import.meta.env.VITE_API_URL}/api/visitor/${appointment._id}/qr-code?token=${localStorage.getItem('token')}`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Visitor QR Code - ${appointment.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              margin: 20px;
            }
            .container {
              text-align: center;
              border: 2px solid #333;
              padding: 30px;
              border-radius: 10px;
            }
            h2 { color: #333; margin: 0 0 10px 0; }
            .visitor-info { 
              font-size: 12px;
              margin: 10px 0;
              text-align: left;
              display: inline-block;
            }
            img { margin: 20px 0; }
            .footer { font-size: 10px; color: #666; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Visitor Entry QR Code</h2>
            <div class="visitor-info">
              <p><strong>Visitor ID:</strong> ${appointment.visitorId}</p>
              <p><strong>Name:</strong> ${appointment.name}</p>
              <p><strong>Host:</strong> ${appointment.host || appointment.whomToMeet}</p>
            </div>
            <img src="${qrUrl}" alt="QR Code" width="250" height="250" />
            <div class="footer">
              Scan this QR code at the gate for quick entry
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  // ✅ Calculate time remaining if approved
  const getTimeRemaining = () => {
    if (!appointment || appointment.status !== 'Approved') return null;

    const allowedUntil = new Date(appointment.allowedUntil);
    const now = new Date();
    const diff = allowedUntil - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const statusConfig = appointment ? getStatusConfig(appointment.status) : null;

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* ✅ HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
          📋 Check Your Appointment Status
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Enter your Visitor ID to check the status of your appointment and download your QR code.
        </Typography>
      </Box>

      {/* ✅ SEARCH BOX */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f9fafb' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter your Visitor ID (e.g., PSG-V001)"
            value={visitorId}
            onChange={(e) => {
              setVisitorId(e.target.value);
              setError('');
              setNotFound(false);
            }}
            onKeyPress={handleKeyPress}
            disabled={loading}
            variant="outlined"
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff',
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleCheck}
            disabled={loading || !visitorId.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Search'}
          </Button>
        </Box>
      </Paper>

      {/* ✅ ERROR MESSAGE */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* ✅ APPOINTMENT DETAILS CARD */}
      {appointment && (
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
          <CardContent>
            {/* Status Header */}
            <Box
              sx={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.textColor,
                p: 2,
                borderRadius: 1,
                mb: 3,
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {statusConfig.icon} {appointment.status}
              </Typography>
              {getTimeRemaining() && (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {getTimeRemaining()}
                </Typography>
              )}
            </Box>

            {/* Personal Information */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid xs={12}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  VISITOR NAME
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {appointment.name}
                </Typography>
              </Grid>

              <Grid xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  VISITOR ID
                </Typography>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                  {appointment.visitorId}
                </Typography>
              </Grid>

              <Grid xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  PHONE
                </Typography>
                <Typography>{appointment.phone}</Typography>
              </Grid>

              {appointment.email && (
                <Grid xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    EMAIL
                  </Typography>
                  <Typography sx={{ wordBreak: 'break-all' }}>{appointment.email}</Typography>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Visit Details */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {(appointment.whomToMeet || appointment.host) && (
                <Grid xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    MEETING WITH
                  </Typography>
                  <Typography>{appointment.whomToMeet || appointment.host}</Typography>
                </Grid>
              )}

              {appointment.department && (
                <Grid xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    DEPARTMENT
                  </Typography>
                  <Typography>{appointment.department}</Typography>
                </Grid>
              )}

              {appointment.purpose && (
                <Grid xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    PURPOSE OF VISIT
                  </Typography>
                  <Typography>{appointment.purpose}</Typography>
                </Grid>
              )}

              {appointment.visitDate && (
                <Grid xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    VISIT DATE
                  </Typography>
                  <Typography>
                    {new Date(appointment.visitDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </Grid>
              )}

              {appointment.timeSlot && (
                <Grid xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    TIME SLOT
                  </Typography>
                  <Typography>{appointment.timeSlot}</Typography>
                </Grid>
              )}

              {appointment.meetingLocation && (
                <Grid xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    MEETING LOCATION
                  </Typography>
                  <Typography>{appointment.meetingLocation}</Typography>
                </Grid>
              )}

              {appointment.allowedUntil && (
                <Grid xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    VALID UNTIL
                  </Typography>
                  <Typography sx={{ color: 'warning.main', fontWeight: 600 }}>
                    {new Date(appointment.allowedUntil).toLocaleString()}
                  </Typography>
                </Grid>
              )}
            </Grid>

            {/* Status Message Alert */}
            <Alert severity={statusConfig.severity} sx={{ mb: 3 }}>
              {statusConfig.message}
            </Alert>

            {/* QR Code Download Section - Show only if Approved */}
            {appointment.status === 'Approved' && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ p: 2, backgroundColor: '#f0f9ff', borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                    📱 Your Entry QR Code
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    Scan this code at the security gate for quick entry. You can download or print it below.
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={downloadQR}
                    >
                      Download QR
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PrintIcon />}
                      onClick={printQR}
                    >
                      Print QR
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setQrModalOpen(true)}
                    >
                      View QR
                    </Button>
                  </Stack>
                </Box>
              </>
            )}

            {/* Additional Info */}
            {appointment.company && (
              <Box sx={{ p: 2, backgroundColor: '#f3f4f6', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  COMPANY
                </Typography>
                <Typography>{appointment.company}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* ✅ EMPTY STATE */}
      {!appointment && !loading && !error && (
        <Paper
          sx={{
            textAlign: 'center',
            py: 8,
            px: 3,
            backgroundColor: '#fafafa',
            borderRadius: 2,
            border: '2px dashed #e5e7eb',
          }}
        >
          <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">
            Enter your Visitor ID to check appointment status
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Format: PSG-V001 or similar ID provided in your confirmation email
          </Typography>
        </Paper>
      )}

      {/* ✅ NOT FOUND STATE */}
      {notFound && !loading && (
        <Paper
          sx={{
            textAlign: 'center',
            py: 8,
            px: 3,
            backgroundColor: '#fef2f2',
            borderRadius: 2,
            border: '2px dashed #fca5a5',
          }}
        >
          <Typography variant="h6" sx={{ color: 'error.main', mb: 2 }}>
            ❌ Appointment Not Found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            We couldn't find an appointment with this ID.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Please check your Visitor ID and try again. If the problem persists, contact support.
          </Typography>
        </Paper>
      )}

      {/* ✅ QR CODE MODAL */}
      <Modal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 400,
            position: 'relative',
          }}
        >
          <IconButton
            onClick={() => setQrModalOpen(false)}
            sx={{ position: 'absolute', top: 10, right: 10 }}
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
            📱 Your Visitor QR Code
          </Typography>

          <Box
            component="img"
            src={`${import.meta.env.VITE_API_URL}/api/visitor/${appointment?._id}/qr-code?token=${localStorage.getItem('token')}`}
            alt="QR Code"
            sx={{
              width: 300,
              height: 300,
              border: '2px solid #e5e7eb',
              borderRadius: 1,
              mb: 2,
            }}
          />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {appointment?.visitorId}
          </Typography>

          <Stack direction="row" spacing={1} justifyContent="center">
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={downloadQR}>
              Download
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={printQR}>
              Print
            </Button>
          </Stack>
        </Paper>
      </Modal>
    </Box>
  );
};

export default AppointmentStatus;
