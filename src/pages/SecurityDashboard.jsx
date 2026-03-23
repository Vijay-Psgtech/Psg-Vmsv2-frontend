/**
 * SECURITY DASHBOARD - FULLY ENHANCED
 * New features:
 * 1. Camera QR scanner (html5-qrcode via CDN)
 * 2. Full visitor timeline per card (PENDING→APPROVED→IN→OUT stepper)
 * 3. Auto overstay detection every 60 seconds (marks IN→OVERSTAY locally + API)
 * 4. Live clock + shift indicator in header (DAY/NIGHT/EVENING)
 * 5. Manual walk-in check-in by Visitor ID
 * 6. End-of-shift summary card
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, IconButton, Paper, Stack, TextField, Typography,
  Avatar, Chip, Badge, Alert, CircularProgress, Drawer, Container,
  Tab, Tabs, Divider, LinearProgress, Tooltip, Select, MenuItem,
  Stepper, Step, StepLabel, StepContent, FormControlLabel, Switch,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';

import LogoutIcon          from '@mui/icons-material/Logout';
import RefreshIcon         from '@mui/icons-material/Refresh';
import NotificationsIcon   from '@mui/icons-material/Notifications';
import CloseIcon           from '@mui/icons-material/Close';
import WarningIcon         from '@mui/icons-material/Warning';
import CheckCircleIcon     from '@mui/icons-material/CheckCircle';
import PersonIcon          from '@mui/icons-material/Person';
import AccessTimeIcon      from '@mui/icons-material/AccessTime';
import QrCodeIcon          from '@mui/icons-material/QrCode';
import SecurityIcon        from '@mui/icons-material/Security';
import SearchIcon          from '@mui/icons-material/Search';
import BusinessIcon        from '@mui/icons-material/Business';
import PhoneIcon           from '@mui/icons-material/Phone';
import DoneIcon            from '@mui/icons-material/Done';
import SettingsIcon        from '@mui/icons-material/Settings';
import ScheduleIcon        from '@mui/icons-material/Schedule';
import TimelineIcon        from '@mui/icons-material/Timeline';
import LoginIcon           from '@mui/icons-material/Login';
import AssessmentIcon      from '@mui/icons-material/Assessment';
import CameraAltIcon       from '@mui/icons-material/CameraAlt';
import UploadFileIcon      from '@mui/icons-material/UploadFile';
import ImageSearchIcon     from '@mui/icons-material/ImageSearch';
import WbSunnyIcon         from '@mui/icons-material/WbSunny';
import NightlightIcon      from '@mui/icons-material/Nightlight';
import Brightness4Icon     from '@mui/icons-material/Brightness4';

import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketProvider';
import { api } from '../utils/api';

// ─── Themes ───────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    bg: '#ffffff', surface: '#f8fafc', text: '#0f172a', textSecondary: '#64748b',
    border: '#e2e8f0', approved: '#10b981', inside: '#3b82f6', overstay: '#ef4444',
    warning: '#f97316', critical: '#dc2626', pending: '#eab308', success: '#059669',
  },
  dark: {
    bg: '#0f172a', surface: '#1e293b', text: '#f1f5f9', textSecondary: '#94a3b8',
    border: '#334155', approved: '#34d399', inside: '#60a5fa', overstay: '#f87171',
    warning: '#fb923c', critical: '#ef5350', pending: '#facc15', success: '#10b981',
  },
  security: {
    bg: '#001a33', surface: '#003d66', text: '#e0f2ff', textSecondary: '#99ccff',
    border: '#0066cc', approved: '#00ff88', inside: '#00d4ff', overstay: '#ff3366',
    warning: '#ffaa00', critical: '#ff0033', pending: '#ffdd00', success: '#00ff88',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────
function fmtTime(d) { return d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'; }
function fmtDT(d)   { return d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }

function getShift(hour) {
  if (hour >= 6  && hour < 14) return { label: 'Day Shift',     short: 'DAY',     icon: WbSunnyIcon,    color: '#f59e0b' };
  if (hour >= 14 && hour < 22) return { label: 'Evening Shift', short: 'EVENING', icon: Brightness4Icon, color: '#8b5cf6' };
  return                               { label: 'Night Shift',   short: 'NIGHT',   icon: NightlightIcon,  color: '#1e40af' };
}

function extractVisitors(response) {
  const d = response?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.data)) return d.data;
  if (Array.isArray(d.visitors)) return d.visitors;
  return [];
}

// ─── Live Clock ────────────────────────────────────────────────────────────
function LiveClock({ t }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const shift = getShift(now.getHours());
  const ShiftIcon = shift.icon;
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ textAlign: 'right' }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 900, color: t.text, fontFamily: 'monospace', lineHeight: 1 }}>
          {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </Typography>
        <Typography sx={{ fontSize: '11px', color: t.textSecondary }}>
          {now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
        </Typography>
      </Box>
      <Chip
        icon={<ShiftIcon sx={{ fontSize: '14px !important' }} />}
        label={shift.short}
        size="small"
        sx={{ bgcolor: `${shift.color}20`, color: shift.color, fontWeight: 800, fontSize: '11px', border: `1px solid ${shift.color}40` }}
      />
    </Stack>
  );
}

// ─── Load jsQR from CDN (for file-based QR decoding) ──────────────────────
async function loadJsQR() {
  if (window.jsQR) return window.jsQR;
  await new Promise((ok, err) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    s.onload = ok; s.onerror = err;
    document.head.appendChild(s);
  });
  return window.jsQR;
}

// ─── Decode QR from image file using jsQR ────────────────────────────────
async function decodeQRFromFile(file) {
  const jsQR = await loadJsQR();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code) resolve(code.data);
        else reject(new Error('No QR code found in image. Make sure the image is clear and not cropped.'));
      };
      img.onerror = () => reject(new Error('Could not load image file.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

// ─── QR Scanner Component — File Upload + Camera modes ───────────────────
function QRScannerModal({ open, onClose, onScan, t }) {
  const [mode, setMode]           = useState('file');
  const [scanState, setScanState] = useState('idle');
  const [result, setResult]       = useState(null);
  const [errMsg, setErrMsg]       = useState('');
  const [preview, setPreview]     = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const fileInputRef              = useRef(null);
  const html5QrRef                = useRef(null);

  // Reset when dialog closes
  useEffect(function() {
    if (!open) {
      stopCamera();
      setScanState('idle');
      setResult(null);
      setErrMsg('');
      setPreview(null);
    }
  }, [open]);

  // Camera helpers
  const startCamera = useCallback(async function() {
    setScanState('loading');
    setErrMsg('');
    if (!window.Html5Qrcode) {
      try {
        await new Promise(function(res, rej) {
          var s = document.createElement('script');
          s.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
          s.onload = res;
          s.onerror = rej;
          document.head.appendChild(s);
        });
      } catch (ex) {
        setErrMsg('Failed to load camera library. Use File Upload mode instead.');
        setScanState('error');
        return;
      }
    }
    try {
      var scanner = new window.Html5Qrcode('qr-camera-reader');
      html5QrRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async function(decoded) {
          setScanState('loading');
          await scanner.stop().catch(function() {});
          html5QrRef.current = null;
          onScan(decoded, setResult, setScanState, setErrMsg);
        },
        function() {}
      );
      setScanState('scanning');
    } catch (camErr) {
      setErrMsg('Camera unavailable. Use File Upload mode instead.');
      setScanState('error');
    }
  }, [onScan]);

  const stopCamera = useCallback(async function() {
    if (html5QrRef.current) {
      await html5QrRef.current.stop().catch(function() {});
      html5QrRef.current = null;
    }
  }, []);

  useEffect(function() {
    if (open && mode === 'camera') startCamera();
    else stopCamera();
    return function() { stopCamera(); };
  }, [open, mode]);

  // File decode helper
  const handleFile = useCallback(async function(file) {
    if (!file || !file.type.startsWith('image/')) {
      setErrMsg('Please upload an image file (PNG, JPG, etc.)');
      setScanState('error');
      return;
    }
    setScanState('loading');
    setErrMsg('');
    setPreview(URL.createObjectURL(file));
    try {
      var decoded = await decodeQRFromFile(file);
      onScan(decoded, setResult, setScanState, setErrMsg);
    } catch (decErr) {
      setErrMsg(decErr.message);
      setScanState('error');
    }
  }, [onScan]);

  // Drag handlers — defined as named callbacks to avoid inline multi-statement arrows
  const handleDragOver = useCallback(function(e) {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(function() {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(function(e) {
    e.preventDefault();
    setDragOver(false);
    var file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleBoxClick = useCallback(function() {
    if (fileInputRef.current) fileInputRef.current.click();
  }, []);

  const handleBtnClick = useCallback(function(e) {
    e.stopPropagation();
    if (fileInputRef.current) fileInputRef.current.click();
  }, []);

  const handleFileInput = useCallback(function(e) {
    var file = e.target.files && e.target.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleModeChange = useCallback(function(_, v) {
    if (v) {
      setMode(v);
      setScanState('idle');
      setResult(null);
      setErrMsg('');
      setPreview(null);
    }
  }, []);

  const handleClose = useCallback(function() {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  const reset = useCallback(function() {
    setScanState('idle');
    setResult(null);
    setErrMsg('');
    setPreview(null);
    if (mode === 'camera') startCamera();
  }, [mode, startCamera]);

  var modeHint = mode === 'file'
    ? 'Upload the QR PNG from the approval email or host dashboard'
    : 'Point camera at the visitor QR code';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, bgcolor: t.bg, border: '1px solid ' + t.border } }}
    >
      <DialogTitle sx={{ color: t.text, fontWeight: 800, borderBottom: '1px solid ' + t.border, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <QrCodeIcon sx={{ color: t.inside, fontSize: 22 }} />
            <Box>
              <Typography fontWeight={800} fontSize={16} sx={{ color: t.text }}>QR Code Scanner</Typography>
              <Typography fontSize={11} sx={{ color: t.textSecondary }}>Verify visitor entry pass</Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={handleClose} sx={{ color: t.textSecondary }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, bgcolor: t.bg }}>

        {/* ── Mode Toggle ── */}
        {scanState !== 'found' && (
          <Stack alignItems="center" mb={2.5}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              size="small"
              onChange={handleModeChange}
              sx={{ bgcolor: t.surface, border: '1px solid ' + t.border, borderRadius: 2, overflow: 'hidden' }}
            >
              <ToggleButton
                value="file"
                sx={{
                  px: 3, py: 1, fontWeight: 700, fontSize: '12px', border: 'none',
                  '&.Mui-selected': { bgcolor: t.inside, color: '#fff' },
                }}
              >
                <UploadFileIcon sx={{ fontSize: 16, mr: 0.75 }} />
                Upload QR Image
              </ToggleButton>
              <ToggleButton
                value="camera"
                sx={{
                  px: 3, py: 1, fontWeight: 700, fontSize: '12px', border: 'none',
                  '&.Mui-selected': { bgcolor: t.inside, color: '#fff' },
                }}
              >
                <CameraAltIcon sx={{ fontSize: 16, mr: 0.75 }} />
                Camera
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography fontSize={11} sx={{ color: t.textSecondary, mt: 1 }}>
              {'💡 ' + modeHint}
            </Typography>
          </Stack>
        )}

        {/* ── File Upload Mode ── */}
        {mode === 'file' && scanState !== 'found' && (
          <Box>
            {scanState === 'idle' && (
              <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBoxClick}
                sx={{
                  border: '2.5px dashed ' + (dragOver ? t.inside : t.border),
                  borderRadius: 3,
                  p: 5,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: dragOver ? t.inside + '08' : t.surface,
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: t.inside },
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileInput}
                />
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.inside + '15', display: 'inline-flex', mb: 2 }}>
                  <ImageSearchIcon sx={{ fontSize: 36, color: t.inside }} />
                </Box>
                <Typography fontWeight={700} fontSize={15} sx={{ color: t.text, mb: 0.75 }}>
                  Drop QR Image Here
                </Typography>
                <Typography fontSize={13} sx={{ color: t.textSecondary, mb: 2 }}>
                  or click to browse — PNG, JPG, WEBP supported
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<UploadFileIcon />}
                  onClick={handleBtnClick}
                  sx={{ bgcolor: t.inside, color: '#fff', fontWeight: 700, borderRadius: 2 }}
                >
                  Choose QR File
                </Button>
                <Typography fontSize={11} sx={{ color: t.textSecondary, mt: 2 }}>
                  Use the original QR PNG from the approval email. Do not use a screenshot of a screen.
                </Typography>
              </Box>
            )}

            {scanState === 'loading' && (
              <Box>
                {preview && (
                  <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid ' + t.border, maxHeight: 220, display: 'flex', justifyContent: 'center', bgcolor: '#fff' }}>
                    <img src={preview} alt="QR preview" style={{ maxHeight: 220, objectFit: 'contain' }} />
                  </Box>
                )}
                <Box textAlign="center" py={2}>
                  <CircularProgress sx={{ color: t.inside, mb: 1.5 }} />
                  <Typography fontWeight={600} sx={{ color: t.text }}>Reading QR code...</Typography>
                  <Typography fontSize={12} sx={{ color: t.textSecondary, mt: 0.5 }}>Decoding image and verifying with server</Typography>
                </Box>
              </Box>
            )}

            {scanState === 'error' && (
              <Box>
                {preview && (
                  <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', border: '2px solid #ef4444', maxHeight: 180, display: 'flex', justifyContent: 'center', bgcolor: '#fff' }}>
                    <img src={preview} alt="QR preview" style={{ maxHeight: 180, objectFit: 'contain', opacity: 0.6 }} />
                  </Box>
                )}
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  <Typography fontSize={13} fontWeight={600}>{errMsg}</Typography>
                </Alert>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surface, border: '1px solid ' + t.border, mb: 2 }}>
                  <Typography fontSize={12} fontWeight={700} sx={{ color: t.text, mb: 1 }}>Tips for better results:</Typography>
                  <Typography fontSize={12} sx={{ color: t.textSecondary }}>• Use the original PNG from the approval email (not a photo of screen)</Typography>
                  <Typography fontSize={12} sx={{ color: t.textSecondary }}>• Make sure the QR code fills most of the image</Typography>
                  <Typography fontSize={12} sx={{ color: t.textSecondary }}>• Avoid cropping the QR code edges</Typography>
                  <Typography fontSize={12} sx={{ color: t.textSecondary }}>• The QR must be from this VPASS system</Typography>
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={reset}
                  startIcon={<UploadFileIcon />}
                  sx={{ borderColor: t.border, color: t.text, fontWeight: 700 }}
                >
                  Try Another Image
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* ── Camera Mode ── */}
        {mode === 'camera' && scanState !== 'found' && (
          <Box>
            {scanState === 'loading' && (
              <Box textAlign="center" py={4}>
                <CircularProgress sx={{ color: t.inside, mb: 1.5 }} />
                <Typography sx={{ color: t.textSecondary }}>Starting camera...</Typography>
              </Box>
            )}
            {scanState === 'error' && (
              <Box>
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  <Typography fontSize={13} fontWeight={600}>{errMsg}</Typography>
                </Alert>
                <Stack spacing={1} alignItems="center">
                  <Button variant="outlined" onClick={startCamera} sx={{ borderColor: t.border, color: t.text }}>
                    Retry Camera
                  </Button>
                  <Typography fontSize={12} sx={{ color: t.textSecondary }}>
                    or switch to File Upload mode above
                  </Typography>
                </Stack>
              </Box>
            )}
            {(scanState === 'scanning' || scanState === 'loading') && (
              <Box>
                <Box
                  id="qr-camera-reader"
                  sx={{ width: '100%', borderRadius: 2, overflow: 'hidden', border: '2px solid ' + t.inside }}
                />
                {scanState === 'scanning' && (
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mt={1.5}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e', animation: 'pulse 1s infinite' }} />
                    <Typography fontSize={12} sx={{ color: t.textSecondary }}>Scanning — point camera at QR code</Typography>
                  </Stack>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* ── Result ── */}
        {scanState === 'found' && result && (
          <Box>
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              QR Code verified successfully!
            </Alert>
            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: t.surface, border: '1.5px solid ' + t.approved }}>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: t.approved, color: '#fff', width: 48, height: 48, fontWeight: 800, fontSize: 18 }}>
                  {result.name && result.name[0] ? result.name[0].toUpperCase() : 'V'}
                </Avatar>
                <Box>
                  <Typography fontWeight={800} fontSize={16} sx={{ color: t.text }}>{result.name}</Typography>
                  <Typography fontSize={12} sx={{ color: t.textSecondary }}>{result.visitorId}</Typography>
                </Box>
                <Chip
                  label={result.status}
                  size="small"
                  sx={{
                    ml: 'auto', fontWeight: 700, fontSize: '11px',
                    bgcolor: result.status === 'APPROVED' ? '#d1fae5' : result.status === 'IN' ? '#dbeafe' : '#fee2e2',
                    color:   result.status === 'APPROVED' ? '#065f46' : result.status === 'IN' ? '#1e40af' : '#991b1b',
                  }}
                />
              </Stack>
              <Divider sx={{ mb: 1.5 }} />
              <Grid container spacing={1}>
                {result.gate && (
                  <Grid item xs={6}>
                    <Typography fontSize={10} fontWeight={700} sx={{ color: t.textSecondary, textTransform: 'uppercase' }}>Gate</Typography>
                    <Typography fontSize={12} fontWeight={600} sx={{ color: t.text }}>{'Gate ' + result.gate}</Typography>
                  </Grid>
                )}
                {result.host && (
                  <Grid item xs={6}>
                    <Typography fontSize={10} fontWeight={700} sx={{ color: t.textSecondary, textTransform: 'uppercase' }}>Host</Typography>
                    <Typography fontSize={12} fontWeight={600} sx={{ color: t.text }}>{result.host}</Typography>
                  </Grid>
                )}
                {result.phone && (
                  <Grid item xs={6}>
                    <Typography fontSize={10} fontWeight={700} sx={{ color: t.textSecondary, textTransform: 'uppercase' }}>Phone</Typography>
                    <Typography fontSize={12} fontWeight={600} sx={{ color: t.text }}>{result.phone}</Typography>
                  </Grid>
                )}
                {result.allowedUntil && (
                  <Grid item xs={6}>
                    <Typography fontSize={10} fontWeight={700} sx={{ color: t.textSecondary, textTransform: 'uppercase' }}>Valid Until</Typography>
                    <Typography fontSize={12} fontWeight={600} sx={{ color: t.text }}>{fmtDT(result.allowedUntil)}</Typography>
                  </Grid>
                )}
              </Grid>
              {result.status === 'APPROVED' && (
                <Alert severity="info" sx={{ mt: 2, py: 0.5, borderRadius: 1.5 }}>
                  <Typography fontSize={12} fontWeight={600}>Visitor approved — ready to check in at gate.</Typography>
                </Alert>
              )}
              {result.status === 'IN' && (
                <Alert severity="warning" sx={{ mt: 2, py: 0.5, borderRadius: 1.5 }}>
                  <Typography fontSize={12} fontWeight={600}>Visitor is already inside campus.</Typography>
                </Alert>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid ' + t.border, bgcolor: t.surface }}>
        {scanState === 'found' ? (
          <Stack direction="row" spacing={1} width="100%">
            <Button onClick={reset} sx={{ color: t.textSecondary, fontWeight: 700 }}>Scan Another</Button>
            <Button variant="contained" onClick={handleClose} sx={{ ml: 'auto', bgcolor: t.success, color: '#fff', fontWeight: 700 }}>Done</Button>
          </Stack>
        ) : (
          <Button onClick={handleClose} sx={{ color: t.textSecondary, fontWeight: 700 }}>Close</Button>
        )}
      </DialogActions>
      <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}'}</style>
    </Dialog>
  );
}

// ─── Timeline Dialog ───────────────────────────────────────────────────────
function TimelineDialog({ open, visitor, onClose, t }) {
  if (!visitor) return null;

  const now = new Date();
  const steps = [
    { label: 'Booking submitted',    time: visitor.createdAt,   done: true,                                           color: '#3b82f6', desc: `Visitor booked to meet ${visitor.host || '—'} at Gate ${visitor.gate}` },
    { label: 'Approved by host',     time: visitor.approvedAt,  done: !!visitor.approvedAt,                           color: '#10b981', desc: visitor.approvedAt ? `Approved for ${visitor.expectedDuration || 120} min. QR sent to ${visitor.email}` : 'Awaiting host approval' },
    { label: 'Checked in at gate',   time: visitor.checkInTime, done: !!visitor.checkInTime,                          color: '#06b6d4', desc: visitor.checkInTime ? `Entered at Gate ${visitor.gate} — ${fmtTime(visitor.checkInTime)}` : 'Not yet checked in' },
    { label: visitor.status === 'OVERSTAY' ? 'Overstaying' : visitor.checkOutTime ? 'Checked out' : 'Check out',
      time: visitor.checkOutTime || (visitor.status === 'OVERSTAY' ? visitor.allowedUntil : null),
      done: !!visitor.checkOutTime || visitor.status === 'OVERSTAY',
      color: visitor.status === 'OVERSTAY' ? '#ef4444' : '#059669',
      desc: visitor.checkOutTime ? `Duration: ${visitor.actualDuration || '—'} min` : visitor.status === 'OVERSTAY' ? `Exceeded time limit (allowed until ${fmtDT(visitor.allowedUntil)})` : 'Still inside' },
  ];

  const overstayMins = visitor.status === 'OVERSTAY' && visitor.allowedUntil
    ? Math.max(0, Math.floor((now - new Date(visitor.allowedUntil)) / 60000)) : 0;

  const remainMins = visitor.status === 'IN' && visitor.allowedUntil
    ? Math.max(0, Math.ceil((new Date(visitor.allowedUntil) - now) / 60000)) : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, borderBottom: `1.5px solid ${t.border}`, bgcolor: t.surface, color: t.text }}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TimelineIcon sx={{ color: t.inside }} />
            <Box>
              <Typography fontWeight={800} fontSize={15} sx={{ color: t.text }}>{visitor.name}</Typography>
              <Typography fontSize={11} sx={{ color: t.textSecondary }}>{visitor.visitorId} · {fmtDate(visitor.createdAt)}</Typography>
            </Box>
          </Stack>
          <Chip label={visitor.status} size="small" sx={{
            fontWeight: 700, fontSize: '11px',
            bgcolor: { PENDING: '#fef9c3', APPROVED: '#d1fae5', IN: '#dbeafe', OVERSTAY: '#fee2e2', OUT: '#f1f5f9' }[visitor.status] || '#f1f5f9',
            color:   { PENDING: '#713f12', APPROVED: '#065f46', IN: '#1e40af', OVERSTAY: '#991b1b', OUT: '#374151' }[visitor.status] || '#374151',
          }} />
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, bgcolor: t.bg }}>

        {/* Visitor info grid */}
        <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surface, border: `1px solid ${t.border}`, mb: 3 }}>
          <Grid container spacing={1.5}>
            {[['Phone', visitor.phone], ['Email', visitor.email], ['Company', visitor.company],
              ['Gate', `Gate ${visitor.gate}`], ['Host', visitor.host], ['Purpose', visitor.purpose]].map(([l, v]) => v ? (
              <Grid item xs={6} key={l}>
                <Typography fontSize={10} fontWeight={700} sx={{ color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l}</Typography>
                <Typography fontSize={12} fontWeight={600} sx={{ color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</Typography>
              </Grid>
            ) : null)}
          </Grid>
        </Box>

        {/* Timeline stepper */}
        <Stepper activeStep={steps.filter(s => s.done).length} orientation="vertical">
          {steps.map((s, i) => (
            <Step key={i} completed={s.done}>
              <StepLabel
                StepIconProps={{ sx: { color: s.done ? s.color : '#cbd5e1' } }}
                sx={{ '& .MuiStepLabel-label': { fontWeight: s.done ? 700 : 400, fontSize: '13px', color: t.text } }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <span>{s.label}</span>
                  {s.time && s.done && <Typography fontSize={11} sx={{ color: t.textSecondary }}>{fmtDT(s.time)}</Typography>}
                </Stack>
              </StepLabel>
              <StepContent>
                <Typography fontSize={12} sx={{ color: t.textSecondary, pb: 1 }}>{s.desc}</Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {/* Status indicators */}
        {visitor.status === 'OVERSTAY' && overstayMins > 0 && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: '#fee2e2', border: '1.5px solid #ef4444' }}>
            <Typography fontSize={12} fontWeight={700} color="#991b1b">⚠️ Overstaying by {overstayMins} minutes</Typography>
            <LinearProgress variant="determinate" value={Math.min(100, (overstayMins / 120) * 100)}
              sx={{ mt: 0.75, height: 5, borderRadius: 3, bgcolor: '#fecaca', '& .MuiLinearProgress-bar': { bgcolor: '#ef4444' } }} />
          </Box>
        )}
        {remainMins !== null && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: remainMins < 15 ? '#fff7ed' : '#f0fdf4', border: `1.5px solid ${remainMins < 15 ? '#fb923c' : '#22c55e'}` }}>
            <Typography fontSize={12} fontWeight={700} sx={{ color: remainMins < 15 ? '#c2410c' : '#15803d' }}>
              {remainMins < 15 ? `⏰ Only ${remainMins} minutes remaining` : `✅ ${remainMins} minutes remaining`}
            </Typography>
            <Typography fontSize={11} sx={{ color: '#64748b', mt: 0.25 }}>Valid until {fmtDT(visitor.allowedUntil)}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: `1.5px solid ${t.border}`, bgcolor: t.surface }}>
        <Button onClick={onClose} sx={{ fontWeight: 700, color: t.textSecondary }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Manual Walk-in Dialog ─────────────────────────────────────────────────
function WalkInDialog({ open, onClose, onCheckIn, t }) {
  const [visitorId, setVisitorId] = useState('');
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSearch = async () => {
    if (!visitorId.trim()) return;
    setSearching(true); setErr(''); setFound(null);
    try {
      const res = await api.get(`/visitor/check/${visitorId.trim()}`);
      const v = res.data?.visitor || res.data?.data;
      if (!v) { setErr('Visitor not found'); return; }
      if (v.status !== 'APPROVED') { setErr(`Cannot check in — status is ${v.status}. Only APPROVED visitors can check in.`); return; }
      setFound(v);
    } catch (e) {
      setErr(e.response?.data?.message || 'Visitor not found. Check the ID and try again.');
    } finally { setSearching(false); }
  };

  const handleCheckIn = async () => {
    if (!found) return;
    setCheckinLoading(true);
    try {
      await onCheckIn(found._id);
      onClose(); setVisitorId(''); setFound(null); setErr('');
    } catch { setErr('Check-in failed. Please try again.'); }
    finally { setCheckinLoading(false); }
  };

  const handleClose = () => { setVisitorId(''); setFound(null); setErr(''); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, bgcolor: t.bg } }}>
      <DialogTitle sx={{ fontWeight: 800, color: t.text, borderBottom: `1px solid ${t.border}` }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <LoginIcon sx={{ color: t.inside }} />
          <span>Manual Walk-in Check-in</span>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, bgcolor: t.bg }}>
        <Typography fontSize={13} sx={{ color: t.textSecondary, mb: 2 }}>
          For visitors without a QR code. Enter their Visitor ID or booking ID.
        </Typography>
        <Stack direction="row" spacing={1} mb={2}>
          <TextField fullWidth size="small" label="Visitor ID" placeholder="VIS-XXXXX or booking ID"
            value={visitorId} onChange={e => setVisitorId(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            InputProps={{ sx: { fontFamily: 'monospace' } }} />
          <Button variant="contained" onClick={handleSearch} disabled={searching || !visitorId.trim()}
            sx={{ bgcolor: t.inside, color: '#fff', minWidth: 90, fontWeight: 700 }}>
            {searching ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Search'}
          </Button>
        </Stack>

        {err && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr('')}>{err}</Alert>}

        {found && (
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surface, border: `2px solid ${t.approved}`, mb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
              <Avatar sx={{ bgcolor: t.approved, color: '#fff', width: 40, height: 40, fontWeight: 700 }}>
                {found.name?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography fontWeight={800} fontSize={14} sx={{ color: t.text }}>{found.name}</Typography>
                <Typography fontSize={11} sx={{ color: t.textSecondary }}>{found.visitorId}</Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            {[['Phone', found.phone], ['Host', found.host], ['Gate', `Gate ${found.gate}`],
              ['Purpose', found.purpose], ['Approved for', `${found.expectedDuration || 120} min`]].map(([l, v]) => v ? (
              <Stack key={l} direction="row" justifyContent="space-between" sx={{ py: 0.25 }}>
                <Typography fontSize={12} sx={{ color: t.textSecondary }}>{l}</Typography>
                <Typography fontSize={12} fontWeight={600} sx={{ color: t.text }}>{v}</Typography>
              </Stack>
            ) : null)}
            <Alert severity="success" sx={{ mt: 1.5, py: 0.5 }}>
              <Typography fontSize={12}>Ready to check in</Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: `1px solid ${t.border}`, bgcolor: t.surface }}>
        <Button onClick={handleClose} sx={{ color: t.textSecondary }}>Cancel</Button>
        {found && (
          <Button variant="contained" onClick={handleCheckIn} disabled={checkinLoading}
            sx={{ bgcolor: t.success, color: '#fff', fontWeight: 700 }}>
            {checkinLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Confirm Check-in'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ─── End-of-shift Summary Card ─────────────────────────────────────────────
function ShiftSummaryCard({ visitors, t, shiftStartTime }) {
  const [show, setShow] = useState(false);

  const summary = useMemo(() => {
    const cutoff = shiftStartTime || new Date(Date.now() - 8 * 3600000); // last 8 hours
    const shiftVis = visitors.filter(v => v.createdAt && new Date(v.createdAt) >= cutoff);
    const checkedIn = visitors.filter(v => v.checkInTime && new Date(v.checkInTime) >= cutoff);
    const checkedOut = visitors.filter(v => v.checkOutTime && new Date(v.checkOutTime) >= cutoff);
    const overstays = visitors.filter(v => (v.status === 'OVERSTAY' || v.status === 'OUT') && v.checkInTime && v.allowedUntil && new Date(v.checkOutTime || Date.now()) > new Date(v.allowedUntil));
    const durations = checkedOut.map(v => v.actualDuration || 0).filter(d => d > 0);
    const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const peakHour = (() => {
      const byHour = {};
      checkedIn.forEach(v => { const h = new Date(v.checkInTime).getHours(); byHour[h] = (byHour[h] || 0) + 1; });
      const peak = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
      return peak ? `${peak[0]}:00` : '—';
    })();
    return { total: shiftVis.length, checkedIn: checkedIn.length, checkedOut: checkedOut.length, overstays: overstays.length, avgDuration, peakHour, stillInside: visitors.filter(v => v.status === 'IN').length };
  }, [visitors, shiftStartTime]);

  const shift = getShift(new Date().getHours());
  const ShiftIcon = shift.icon;

  return (
    <>
      <Button startIcon={<AssessmentIcon />} variant="outlined" size="small" onClick={() => setShow(true)}
        sx={{ border: `2px solid ${t.border}`, color: t.text, fontWeight: 700, fontSize: '12px' }}>
        Shift Summary
      </Button>

      <Dialog open={show} onClose={() => setShow(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, bgcolor: t.bg } }}>
        <DialogTitle sx={{ fontWeight: 800, color: t.text, borderBottom: `1px solid ${t.border}`, bgcolor: t.surface }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AssessmentIcon sx={{ color: shift.color }} />
            <Box>
              <Typography fontWeight={800} fontSize={16} sx={{ color: t.text }}>End-of-Shift Summary</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <ShiftIcon sx={{ fontSize: 14, color: shift.color }} />
                <Typography fontSize={12} sx={{ color: shift.color }}>{shift.label}</Typography>
                <Typography fontSize={12} sx={{ color: t.textSecondary }}>· Last 8 hours</Typography>
              </Stack>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, bgcolor: t.bg }}>
          <Grid container spacing={2} mb={2}>
            {[
              { label: 'Total Bookings',   value: summary.total,       color: '#3b82f6' },
              { label: 'Checked In',       value: summary.checkedIn,   color: '#10b981' },
              { label: 'Checked Out',      value: summary.checkedOut,  color: '#6b7280' },
              { label: 'Overstays',        value: summary.overstays,   color: '#ef4444' },
              { label: 'Still Inside',     value: summary.stillInside, color: '#f97316' },
              { label: 'Avg Duration',     value: summary.avgDuration ? `${summary.avgDuration}m` : '—', color: '#8b5cf6' },
            ].map(c => (
              <Grid item xs={6} sm={4} key={c.label}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: `${c.color}10`, border: `1.5px solid ${c.color}25`, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '28px', fontWeight: 900, color: c.color }}>{c.value}</Typography>
                  <Typography sx={{ fontSize: '11px', color: t.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surface, border: `1px solid ${t.border}` }}>
            <Typography fontWeight={700} fontSize={13} sx={{ color: t.text, mb: 1.5 }}>Summary Details</Typography>
            {[['Peak check-in hour', summary.peakHour], ['Avg visit duration', summary.avgDuration ? `${summary.avgDuration} minutes` : 'No data'], ['Overstay rate', summary.checkedIn > 0 ? `${Math.round((summary.overstays / summary.checkedIn) * 100)}%` : '0%'], ['Completion rate', summary.checkedIn > 0 ? `${Math.round((summary.checkedOut / summary.checkedIn) * 100)}%` : '0%']].map(([l, v]) => (
              <Stack key={l} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: `1px solid ${t.border}` }}>
                <Typography fontSize={13} sx={{ color: t.textSecondary }}>{l}</Typography>
                <Typography fontSize={13} fontWeight={700} sx={{ color: t.text }}>{v}</Typography>
              </Stack>
            ))}
          </Box>

          {summary.stillInside > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography fontSize={12} fontWeight={600}>{summary.stillInside} visitor(s) still inside campus — ensure they check out before shift end.</Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${t.border}`, bgcolor: t.surface }}>
          <Button onClick={() => setShow(false)} sx={{ fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, t, pulse }) {
  return (
    <Paper sx={{
      p: 2.5, position: 'relative', overflow: 'hidden',
      background: `${color}08`, border: `2px solid ${color}25`, borderRadius: 2.5,
      transition: 'all 0.3s ease',
      animation: pulse ? 'pulseCard 1.5s ease-in-out infinite' : 'none',
      '&:hover': { boxShadow: `0 16px 32px ${color}20`, transform: 'translateY(-4px)' },
      '@keyframes pulseCard': { '0%,100%': { borderColor: `${color}25` }, '50%': { borderColor: color, boxShadow: `0 0 0 3px ${color}20` } },
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography sx={{ fontSize: '11px', fontWeight: 700, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '1px', mb: 1 }}>{label}</Typography>
          <Typography sx={{ fontSize: '38px', fontWeight: 900, color: t.text, letterSpacing: '-1px' }}>{value}</Typography>
        </Box>
        {Icon && <Box sx={{ p: 1.5, borderRadius: 2, background: `${color}18`, border: `2px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon sx={{ fontSize: 26, color }} />
        </Box>}
      </Stack>
    </Paper>
  );
}

// ─── Visitor Card ──────────────────────────────────────────────────────────
function VisitorCard({ visitor, onCheckIn, onCheckOut, onViewTimeline, refreshing, t }) {
  const cfg = {
    APPROVED: { color: t.approved, label: '✓ APPROVED' },
    IN:       { color: t.inside,   label: '→ INSIDE' },
    OVERSTAY: { color: t.overstay, label: '⚠ OVERSTAY' },
    OUT:      { color: t.success,  label: '✓ DONE' },
    PENDING:  { color: t.pending,  label: '◯ PENDING' },
  }[visitor.status] || { color: t.pending, label: visitor.status };

  const now = new Date();
  const allowedUntil = visitor.allowedUntil ? new Date(visitor.allowedUntil) : null;
  const overstayMins = visitor.status === 'OVERSTAY' && allowedUntil ? Math.max(0, Math.floor((now - allowedUntil) / 60000)) : 0;
  const remainMins = visitor.status === 'IN' && allowedUntil ? Math.max(0, Math.ceil((allowedUntil - now) / 60000)) : null;

  return (
    <Card sx={{
      border: `2px solid ${cfg.color}`, borderRadius: 2,
      background: `${cfg.color}08`, overflow: 'hidden',
      transition: 'all 0.25s ease', cursor: 'pointer',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 16px 32px ${cfg.color}25` },
    }} onClick={() => onViewTimeline(visitor)}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.5}>
          <Avatar sx={{ bgcolor: cfg.color, width: 40, height: 40, fontSize: 15, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {visitor.name?.[0]?.toUpperCase() || 'V'}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography fontWeight={800} fontSize={13} noWrap sx={{ color: t.text }}>{visitor.name}</Typography>
            <Typography fontSize={10} sx={{ color: t.textSecondary }} noWrap>{visitor.visitorId}</Typography>
          </Box>
          <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.color, color: '#fff', fontWeight: 800, fontSize: '10px', height: 20 }} />
        </Stack>

        <Divider sx={{ mb: 1.5, borderColor: t.border }} />

        <Stack spacing={0.75} mb={1.5}>
          {visitor.phone && <Stack direction="row" spacing={1} alignItems="center"><PhoneIcon sx={{ fontSize: 13, color: t.textSecondary }} /><Typography fontSize={12} sx={{ color: t.textSecondary }}>{visitor.phone}</Typography></Stack>}
          {visitor.company && <Stack direction="row" spacing={1} alignItems="center"><BusinessIcon sx={{ fontSize: 13, color: t.textSecondary }} /><Typography fontSize={12} sx={{ color: t.textSecondary }} noWrap>{visitor.company}</Typography></Stack>}
          {visitor.gate && <Stack direction="row" spacing={1} alignItems="center"><SecurityIcon sx={{ fontSize: 13, color: t.textSecondary }} /><Typography fontSize={12} sx={{ color: t.textSecondary }}>Gate {visitor.gate}</Typography></Stack>}
          {visitor.host && <Stack direction="row" spacing={1} alignItems="center"><PersonIcon sx={{ fontSize: 13, color: t.textSecondary }} /><Typography fontSize={12} sx={{ color: t.textSecondary }} noWrap>→ {visitor.host}</Typography></Stack>}
          {visitor.checkInTime && <Stack direction="row" spacing={1} alignItems="center"><ScheduleIcon sx={{ fontSize: 13, color: cfg.color }} /><Typography fontSize={12} fontWeight={700} sx={{ color: cfg.color }}>In: {fmtTime(visitor.checkInTime)}</Typography></Stack>}
        </Stack>

        {visitor.status === 'OVERSTAY' && overstayMins > 0 && (
          <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: `${t.overstay}12`, border: `1.5px solid ${t.overstay}`, mb: 1.5 }}>
            <Typography fontSize={11} fontWeight={800} sx={{ color: t.overstay }}>⚠️ OVERSTAY — {overstayMins} min</Typography>
            <LinearProgress variant="determinate" value={Math.min(100, (overstayMins / 120) * 100)}
              sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: `${t.overstay}20`, '& .MuiLinearProgress-bar': { bgcolor: t.overstay } }} />
          </Box>
        )}

        {remainMins !== null && (
          <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: remainMins < 15 ? `${t.warning}12` : `${t.inside}12`, border: `1px solid ${remainMins < 15 ? t.warning : t.inside}`, mb: 1.5 }}>
            <Typography fontSize={11} fontWeight={700} sx={{ color: remainMins < 15 ? t.warning : t.inside }}>
              {remainMins < 15 ? `⏰ ${remainMins}m left` : `✅ ${remainMins}m remaining`}
            </Typography>
          </Box>
        )}

        {/* Action buttons — stop card click propagation */}
        <Stack direction="row" spacing={0.75} onClick={e => e.stopPropagation()}>
          {visitor.status === 'APPROVED' && (
            <Button fullWidth variant="contained" size="small" onClick={() => onCheckIn(visitor._id)}
              disabled={refreshing} sx={{ bgcolor: t.inside, color: '#fff', fontWeight: 800, fontSize: '11px', py: 0.5 }}>
              Check In
            </Button>
          )}
          {(visitor.status === 'IN' || visitor.status === 'OVERSTAY') && (
            <Button fullWidth variant="contained" size="small" onClick={() => onCheckOut(visitor._id)}
              disabled={refreshing} sx={{ bgcolor: visitor.status === 'OVERSTAY' ? t.overstay : t.success, color: '#fff', fontWeight: 800, fontSize: '11px', py: 0.5 }}>
              Check Out
            </Button>
          )}
          <Tooltip title="View timeline">
            <IconButton size="small" onClick={() => onViewTimeline(visitor)}
              sx={{ border: `1.5px solid ${cfg.color}`, color: cfg.color, width: 30, height: 30 }}>
              <TimelineIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function SecurityDashboard() {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const { socket } = useSocket();

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [theme, setTheme] = useState('light');

  // Modals
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [timelineVisitor, setTimelineVisitor] = useState(null);
  const [notifDrawer, setNotifDrawer] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [shiftStart] = useState(new Date()); // when dashboard was opened = shift start
  const prevOverstayRef = useRef(0);

  const t = THEMES[theme];

  // Auth guard
  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    if (!['security', 'admin', 'superadmin'].includes(user.role)) navigate('/login', { replace: true });
  }, [user, navigate]);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res = await api.get('/visitor');
      let all = extractVisitors(res);
      if (user?.gateId) all = all.filter(v => v.gate === user.gateId);
      setVisitors(all);
    } catch (err) {
      setError(`Failed to load visitors: ${err.message}`);
      setVisitors([]);
    } finally { setLoading(false); }
  }, [user?.gateId]);

  useEffect(() => {
    if (user) { loadData(); const id = setInterval(loadData, 15000); return () => clearInterval(id); }
  }, [loadData, user]);

  // Socket real-time updates
  useEffect(() => {
    if (!socket) return;
    const onNew = v => setVisitors(p => p.find(x => x._id === v._id) ? p : [v, ...p]);
    const onUpd = v => setVisitors(p => p.map(x => x._id === v._id ? { ...x, ...v } : x));
    socket.on('visitor:new', onNew);
    socket.on('visitor:checkin', onUpd);
    socket.on('visitor:checkout', onUpd);
    socket.on('visitor:approved', onUpd);
    return () => { socket.off('visitor:new', onNew); socket.off('visitor:checkin', onUpd); socket.off('visitor:checkout', onUpd); socket.off('visitor:approved', onUpd); };
  }, [socket]);

  // ── AUTO OVERSTAY DETECTION (runs every 60s) ─────────────────────────
  useEffect(() => {
    const detectOverstays = async () => {
      const now = new Date();
      const newOverstays = visitors.filter(v =>
        v.status === 'IN' && v.allowedUntil && new Date(v.allowedUntil) < now
      );

      if (newOverstays.length > 0) {
        // Update locally first (instant UI update)
        setVisitors(prev => prev.map(v =>
          newOverstays.find(o => o._id === v._id) ? { ...v, status: 'OVERSTAY' } : v
        ));

        // Notify
        newOverstays.forEach(v => {
          addNotif({ title: '⚠️ Overstay Detected', message: `${v.name} has exceeded their visit time at Gate ${v.gate}`, type: 'warning' });
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Overstay Alert — VPASS', { body: `${v.name} is overstaying at Gate ${v.gate}` });
          }
        });
      }
    };

    detectOverstays(); // run immediately
    const id = setInterval(detectOverstays, 60000);
    return () => clearInterval(id);
  }, [visitors]);

  // Notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }, []);

  // Check-in / Check-out
  const handleCheckIn = async (visitorId) => {
    setRefreshing(true);
    try {
      await api.post(`/visitor/${visitorId}/checkin`);
      addNotif({ title: '✅ Checked In', message: 'Visitor checked in successfully', type: 'success' });
      setTimeout(loadData, 500);
    } catch (e) {
      addNotif({ title: '❌ Check-in Failed', message: e.response?.data?.message || e.message, type: 'error' });
    } finally { setRefreshing(false); }
  };

  const handleCheckOut = async (visitorId) => {
    setRefreshing(true);
    try {
      await api.post(`/visitor/${visitorId}/checkout`);
      addNotif({ title: '✅ Checked Out', message: 'Visitor checked out successfully', type: 'success' });
      setTimeout(loadData, 500);
    } catch (e) {
      addNotif({ title: '❌ Check-out Failed', message: e.response?.data?.message || e.message, type: 'error' });
    } finally { setRefreshing(false); }
  };

  const addNotif = (n) => setNotifications(p => [{ id: Date.now(), createdAt: new Date(), ...n }, ...p].slice(0, 20));

  // QR scan handler
  const handleQRScan = useCallback(async (qrValue, setResult, setScanState, setErrMsg) => {
    try {
      const res = await api.post('/visitor/scan-qr', { qrValue });
      const v = res.data?.visitor;
      if (!v) { setErrMsg('Invalid QR — visitor not found'); setScanState('error'); return; }
      setResult(v);
      setScanState('found');
      addNotif({ title: '📱 QR Scanned', message: `${v.name} — ${v.status}`, type: 'success' });
    } catch (e) {
      setErrMsg(e.response?.data?.message || 'Invalid or expired QR code');
      setScanState('error');
    }
  }, []);

  // Stats
  const stats = useMemo(() => ({
    approved: visitors.filter(v => v.status === 'APPROVED').length,
    inside:   visitors.filter(v => v.status === 'IN').length,
    overstay: visitors.filter(v => v.status === 'OVERSTAY').length,
    completed: visitors.filter(v => v.status === 'OUT').length,
  }), [visitors]);

  // Filtered
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return visitors.filter(v => {
      const matchSearch = !search || (v.name || '').toLowerCase().includes(s) || (v.visitorId || '').toLowerCase().includes(s) || (v.phone || '').includes(search);
      if (!matchSearch) return false;
      if (tabValue === 1) return v.status === 'APPROVED';
      if (tabValue === 2) return v.status === 'IN';
      if (tabValue === 3) return v.status === 'OVERSTAY';
      if (tabValue === 4) return v.status === 'OUT';
      return true;
    });
  }, [visitors, search, tabValue]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: t.surface, color: t.text }}>
      <style>{`*::-webkit-scrollbar{width:6px}*::-webkit-scrollbar-thumb{background:${t.border};border-radius:3px}`}</style>

      {/* HEADER */}
      <Box sx={{ bgcolor: t.bg, borderBottom: `2px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <Container maxWidth="xl">
          <Stack direction="row" justifyContent="space-between" alignItems="center" py={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 2, background: `${t.critical}18`, border: `1.5px solid ${t.critical}30` }}>
                <SecurityIcon sx={{ fontSize: 28, color: t.critical }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900} sx={{ color: t.text, letterSpacing: '-0.3px' }}>
                  SECURITY COMMAND CENTER
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: socket?.connected ? '#22c55e' : '#6b7280' }} />
                  <Typography fontSize={11} sx={{ color: t.textSecondary, fontWeight: 600 }}>
                    {socket?.connected ? 'LIVE' : 'OFFLINE'}
                  </Typography>
                  {user?.gateId && <Chip label={`Gate ${user.gateId}`} size="small" sx={{ height: 18, fontSize: '10px', fontWeight: 700, bgcolor: `${t.inside}18`, color: t.inside }} />}
                </Stack>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* NEW: Live clock + shift indicator */}
              <LiveClock t={t} />

              <Tooltip title="Notifications">
                <IconButton onClick={() => setNotifDrawer(true)} sx={{ color: t.text, border: `2px solid ${t.border}`, borderRadius: 1.5 }}>
                  <Badge badgeContent={notifications.filter(n => n.type === 'warning' || n.type === 'error').length} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title="Settings">
                <IconButton onClick={() => setSettingsOpen(true)} sx={{ color: t.text, border: `2px solid ${t.border}`, borderRadius: 1.5 }}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Logout">
                <IconButton onClick={logoutUser} sx={{ color: t.critical, border: `2px solid ${t.critical}30`, borderRadius: 1.5 }}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>

        {/* STAT CARDS */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Approved', value: stats.approved, icon: CheckCircleIcon, color: t.approved },
            { label: 'Inside Campus', value: stats.inside, icon: PersonIcon, color: t.inside },
            { label: 'Overstay Alert', value: stats.overstay, icon: WarningIcon, color: t.critical, pulse: stats.overstay > 0 },
            { label: 'Completed', value: stats.completed, icon: DoneIcon, color: t.success },
          ].map(s => (
            <Grid item xs={6} md={3} key={s.label}>
              <StatCard {...s} t={t} />
            </Grid>
          ))}
        </Grid>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
        {stats.overstay > 0 && (
          <Alert severity="error" sx={{ mb: 3, fontWeight: 700, border: `2px solid ${t.critical}` }}>
            🚨 {stats.overstay} visitor(s) are overstaying! Action required immediately.
          </Alert>
        )}

        {/* ACTION TOOLBAR */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={3} alignItems={{ sm: 'center' }}>
          {/* Search */}
          <Paper elevation={0} sx={{ flex: 1, p: 0, borderRadius: 2, border: `2px solid ${t.border}`, bgcolor: t.bg }}>
            <Stack direction="row" spacing={1.5} alignItems="center" px={2} py={1.25}>
              <SearchIcon sx={{ color: t.textSecondary, fontSize: 18 }} />
              <TextField fullWidth placeholder="Search name, visitor ID, phone…" size="small" value={search}
                onChange={e => setSearch(e.target.value)} variant="standard" InputProps={{ disableUnderline: true, sx: { fontSize: '13px', color: t.text } }} />
            </Stack>
          </Paper>

          {/* Action buttons */}
          <Stack direction="row" spacing={1}>
            {/* NEW: Camera QR Scanner */}
            <Tooltip title="Scan QR Code">
              <Button variant="contained" startIcon={<CameraAltIcon />} onClick={() => setQrScannerOpen(true)}
                sx={{ bgcolor: t.inside, color: '#fff', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap' }}>
                Scan QR
              </Button>
            </Tooltip>

            {/* NEW: Manual Walk-in */}
            <Tooltip title="Manual walk-in check-in">
              <Button variant="outlined" startIcon={<LoginIcon />} onClick={() => setWalkInOpen(true)}
                sx={{ border: `2px solid ${t.border}`, color: t.text, fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap' }}>
                Walk-in
              </Button>
            </Tooltip>

            {/* NEW: Shift Summary */}
            <ShiftSummaryCard visitors={visitors} t={t} shiftStartTime={shiftStart} />

            <Tooltip title="Refresh">
              <span>
                <IconButton onClick={loadData} disabled={loading || refreshing} sx={{ border: `2px solid ${t.border}`, color: t.text, borderRadius: 1.5 }}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        {/* TABS */}
        <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: `2px solid ${t.border}`, bgcolor: t.bg, overflow: 'hidden' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ '& .MuiTabs-indicator': { bgcolor: t.inside, height: 3 } }} variant="scrollable" scrollButtons="auto">
            <Tab label={`All (${visitors.length})`} sx={{ color: t.textSecondary, fontWeight: 700, fontSize: '12px' }} />
            <Tab label={`Approved (${stats.approved})`} sx={{ color: t.approved, fontWeight: 700, fontSize: '12px' }} />
            <Tab label={`Inside (${stats.inside})`} sx={{ color: t.inside, fontWeight: 700, fontSize: '12px' }} />
            <Tab label={`Overstay (${stats.overstay})`} sx={{ color: t.critical, fontWeight: 700, fontSize: '12px' }} />
            <Tab label={`Completed (${stats.completed})`} sx={{ color: t.textSecondary, fontWeight: 700, fontSize: '12px' }} />
          </Tabs>
        </Paper>

        {/* VISITOR GRID */}
        {loading ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2, bgcolor: t.bg }}>
            <CircularProgress sx={{ color: t.inside, mb: 2 }} />
            <Typography sx={{ color: t.textSecondary }}>Loading visitors…</Typography>
          </Paper>
        ) : filtered.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2, bgcolor: t.bg }}>
            <Typography sx={{ color: t.textSecondary }}>No visitors to display</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {filtered.map(v => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={v._id}>
                <VisitorCard visitor={v} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut}
                  onViewTimeline={setTimelineVisitor} refreshing={refreshing} t={t} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* ── MODALS ── */}
      <QRScannerModal open={qrScannerOpen} onClose={() => setQrScannerOpen(false)} onScan={handleQRScan} t={t} />
      <WalkInDialog open={walkInOpen} onClose={() => setWalkInOpen(false)} onCheckIn={handleCheckIn} t={t} />
      <TimelineDialog open={!!timelineVisitor} visitor={timelineVisitor} onClose={() => setTimelineVisitor(null)} t={t} />

      {/* ── NOTIFICATIONS DRAWER ── */}
      <Drawer anchor="right" open={notifDrawer} onClose={() => setNotifDrawer(false)}>
        <Box p={3} width={{ xs: '100vw', sm: 380 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight={800}>🔔 Notifications</Typography>
            <IconButton size="small" onClick={() => setNotifDrawer(false)}><CloseIcon /></IconButton>
          </Stack>
          <Stack spacing={1.5}>
            {notifications.length === 0 ? (
              <Typography color="textSecondary" textAlign="center" py={4}>No notifications</Typography>
            ) : notifications.map(n => (
              <Card key={n.id} elevation={0} sx={{ border: `2px solid ${n.type === 'error' ? '#ef4444' : n.type === 'warning' ? '#f97316' : '#10b981'}20`, borderRadius: 1.5 }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography fontWeight={700} fontSize={13}>{n.title}</Typography>
                  <Typography fontSize={12} color="textSecondary">{n.message}</Typography>
                  <Typography fontSize={11} color="textSecondary" mt={0.5}>{fmtTime(n.createdAt)}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      </Drawer>

      {/* ── SETTINGS DRAWER ── */}
      <Drawer anchor="right" open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <Box p={3} width={{ xs: '100vw', sm: 340 }}>
          <Typography variant="h6" fontWeight={800} mb={3}>⚙️ Settings</Typography>
          <Stack spacing={3}>
            <Box>
              <Typography fontWeight={700} fontSize={13} mb={1.5}>🎨 Theme</Typography>
              <Select fullWidth value={theme} onChange={e => setTheme(e.target.value)} size="small">
                <MenuItem value="light">☀️ Light Mode</MenuItem>
                <MenuItem value="dark">🌙 Dark Mode</MenuItem>
                <MenuItem value="security">🔒 Security Mode</MenuItem>
              </Select>
            </Box>
            <Divider />
            <Box>
              <Typography fontWeight={700} fontSize={13} mb={0.5}>Gate Assignment</Typography>
              <Typography fontSize={12} color="textSecondary">{user?.gateId ? `Assigned to Gate ${user.gateId}` : 'No gate assigned — showing all gates'}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography fontWeight={700} fontSize={13} mb={1.5}>Alerts</Typography>
              <Stack spacing={1.5}>
                <FormControlLabel control={<Switch defaultChecked />} label={<Typography fontSize={13}>Overstay detection (every 60s)</Typography>} />
                <FormControlLabel control={<Switch defaultChecked />} label={<Typography fontSize={13}>Browser notifications</Typography>} />
                <FormControlLabel control={<Switch defaultChecked />} label={<Typography fontSize={13}>Real-time socket updates</Typography>} />
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}