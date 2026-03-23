/**
 * HOST ADMIN KANBAN DASHBOARD - FULLY ENHANCED
 * New features:
 * 1. Live toast notification when new visitor books (socket visitor:new)
 * 2. Visitor timeline modal on card click (PENDING→APPROVED→IN→OUT steps)
 * 3. Today / This Week / All date filter on kanban
 * 4. Show QR code modal on approved card click
 * 5. Overstay alert badge + browser push notification
 * 6. Custom message field on approval email
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Stack, Chip, Avatar, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  CircularProgress, Container, Grid, IconButton, Tooltip, Badge, Snackbar,
  ToggleButtonGroup, ToggleButton, Stepper, Step, StepLabel, StepContent,
  Divider,
} from '@mui/material';

import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimelineIcon from '@mui/icons-material/Timeline';
import CloseIcon from '@mui/icons-material/Close';
import MessageIcon from '@mui/icons-material/Message';

import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketProvider';
import { api } from '../utils/api';
import { hostAdminDataService } from '../utils/visitorDataService';

// ─── Helpers ──────────────────────────────────────────────────────────────
function fmtDT(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function applyDateFilter(items, range) {
  if (range === 'all') return items;
  const now = new Date();
  return items.filter(v => {
    const d = v.createdAt ? new Date(v.createdAt) : null;
    if (!d) return false;
    if (range === 'today') return d.toDateString() === now.toDateString();
    if (range === 'week') return d >= new Date(now - 7 * 864e5);
    return true;
  });
}

// ─── Browser notification helper ──────────────────────────────────────────
async function sendBrowserNotif(title, body, icon = '/favicon.ico') {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon });
  }
}

// ─── Toast Component ──────────────────────────────────────────────────────
function LiveToast({ toasts, onClose }) {
  return (
    <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {toasts.map(t => (
        <Paper key={t.id} elevation={6} sx={{
          p: 2, borderRadius: 2, minWidth: 300, maxWidth: 380,
          borderLeft: `4px solid ${t.color || '#14B8A6'}`,
          background: '#fff',
          animation: 'slideIn 0.3s ease',
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography fontSize={13} fontWeight={700} color="#0F172A">{t.title}</Typography>
              <Typography fontSize={12} color="#64748B" mt={0.25}>{t.body}</Typography>
            </Box>
            <IconButton size="small" onClick={() => onClose(t.id)} sx={{ ml: 1, mt: -0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Typography fontSize={11} color="#94A3B8" mt={0.5}>{t.time}</Typography>
        </Paper>
      ))}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </Box>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, pulse }) {
  return (
    <Paper sx={{
      p: 2.5, position: 'relative', overflow: 'hidden',
      background: `linear-gradient(135deg, ${color}08 0%, ${color}02 100%)`,
      border: `1px solid ${color}20`, borderRadius: 2.5,
      transition: 'all 0.3s ease',
      animation: pulse ? 'pulseBorder 1.5s ease-in-out infinite' : 'none',
      '&:hover': { boxShadow: `0 12px 32px ${color}20`, transform: 'translateY(-2px)', borderColor: `${color}40` },
      '@keyframes pulseBorder': { '0%,100%': { borderColor: `${color}20` }, '50%': { borderColor: color, boxShadow: `0 0 0 3px ${color}20` } },
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', mb: 1 }}>{label}</Typography>
          <Typography sx={{ fontSize: '30px', fontWeight: 800, color: '#0F172A' }}>{value}</Typography>
        </Box>
        {Icon && (
          <Box sx={{ p: 1.5, borderRadius: 2, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon sx={{ fontSize: 22, color }} />
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────
function KanbanColumn({ title, count, color, children, icon: Icon, overstayBadge }) {
  return (
    <Box sx={{
      flex: '0 0 320px', minWidth: '300px', maxWidth: '360px',
      display: 'flex', flexDirection: 'column', borderRadius: 2.5,
      background: '#FFFFFF', border: `1.5px solid #E2E8F0`, overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': { borderColor: color, boxShadow: `0 16px 48px ${color}12` },
    }}>
      <Box sx={{ p: 2, background: `${color}08`, borderBottom: '1.5px solid #E2E8F0', borderLeft: `4px solid ${color}` }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {Icon && <Icon sx={{ color, fontSize: 18 }} />}
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', flex: 1 }}>{title}</Typography>
          <Badge badgeContent={overstayBadge} color="error" invisible={!overstayBadge}>
            <Chip label={count} size="small" sx={{ bgcolor: color, color: '#fff', fontWeight: 700, fontSize: '11px', height: 22, minWidth: 32 }} />
          </Badge>
        </Stack>
      </Box>
      <Box sx={{ flex: 1, p: 1.5, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 560,
        '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 3 } }}>
        {count > 0 ? children : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 120 }}>
            <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>No visitors</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── Visitor Card ─────────────────────────────────────────────────────────
function VisitorCard({ visitor, onApprove, onReject, onViewTimeline, onViewQR }) {
  const cfg = {
    PENDING:  { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E' },
    APPROVED: { bg: '#F0FDFA', border: '#14B8A6', text: '#065F46' },
    IN:       { bg: '#EFF6FF', border: '#06B6D4', text: '#0C4A6E' },
    OVERSTAY: { bg: '#FEF2F2', border: '#EF4444', text: '#7F1D1D' },
    OUT:      { bg: '#F8FAFC', border: '#94A3B8', text: '#374151' },
    REJECTED: { bg: '#FEF2F2', border: '#EF4444', text: '#7F1D1D' },
  }[visitor.status] || { bg: '#F8FAFC', border: '#94A3B8', text: '#374151' };

  const isOverstay = visitor.status === 'OVERSTAY';

  // Overstay duration in minutes
  const overstayMins = useMemo(() => {
    if (!isOverstay || !visitor.allowedUntil) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(visitor.allowedUntil)) / 60000));
  }, [isOverstay, visitor.allowedUntil]);

  const handleCardClick = () => {
    if (visitor.status === 'APPROVED') onViewQR(visitor);
    else onViewTimeline(visitor);
  };

  return (
    <Card onClick={handleCardClick} sx={{
      border: `1.5px solid ${cfg.border}`, borderRadius: 2,
      background: cfg.bg, transition: 'all 0.2s ease', cursor: 'pointer',
      '&:hover': { boxShadow: `0 8px 20px ${cfg.border}25`, transform: 'translateY(-2px)' },
    }}>
      <CardContent sx={{ pb: '12px !important', pt: 1.5, px: 2 }}>
        {/* Header row */}
        <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.5}>
          <Avatar sx={{ bgcolor: cfg.border, width: 38, height: 38, fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {visitor.name?.[0]?.toUpperCase()}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {visitor.name}
            </Typography>
            <Typography sx={{ fontSize: '10px', color: '#64748B' }}>{visitor.visitorId || visitor._id?.slice(-8)}</Typography>
          </Box>
          {/* Timeline icon hint */}
          <Tooltip title={visitor.status === 'APPROVED' ? 'View QR code' : 'View timeline'}>
            <Box sx={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
              {visitor.status === 'APPROVED' ? <QrCodeIcon sx={{ fontSize: 15 }} /> : <TimelineIcon sx={{ fontSize: 15 }} />}
            </Box>
          </Tooltip>
        </Stack>

        {/* Info rows */}
        <Stack spacing={0.5} mb={1.5}>
          {visitor.phone && <Typography sx={{ fontSize: '11px', color: '#475569' }}>📞 {visitor.phone}</Typography>}
          {visitor.company && <Typography sx={{ fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🏢 {visitor.company}</Typography>}
          {visitor.purpose && <Typography sx={{ fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📋 {visitor.purpose}</Typography>}
          <Typography sx={{ fontSize: '10px', color: '#94A3B8' }}>🕐 Booked {timeAgo(visitor.createdAt)}</Typography>
        </Stack>

        {/* Chips row */}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} mb={visitor.status === 'PENDING' ? 1.5 : 0}>
          <Chip size="small" label={`${visitor.expectedDuration || 120}min`} icon={<AccessTimeIcon sx={{ fontSize: 11 }} />}
            variant="outlined" sx={{ fontSize: '10px', height: 20, borderColor: cfg.border, color: cfg.text, fontWeight: 600 }} />
          <Chip size="small" label={`Gate ${visitor.gate}`}
            sx={{ fontSize: '10px', height: 20, bgcolor: `${cfg.border}18`, color: cfg.text, fontWeight: 600 }} />
          {isOverstay && overstayMins > 0 && (
            <Chip size="small" label={`${overstayMins}m over`}
              sx={{ fontSize: '10px', height: 20, bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 700 }} />
          )}
        </Stack>

        {/* Action buttons — stop propagation so card click doesn't fire */}
        {visitor.status === 'PENDING' && (
          <Stack direction="row" spacing={0.75} onClick={e => e.stopPropagation()}>
            <Button fullWidth variant="contained" color="success" size="small" startIcon={<CheckIcon sx={{ fontSize: 13 }} />}
              onClick={() => onApprove(visitor)}
              sx={{ fontWeight: 700, fontSize: '11px', py: 0.5, textTransform: 'none' }}>
              Approve
            </Button>
            <Button fullWidth variant="outlined" color="error" size="small" startIcon={<CancelIcon sx={{ fontSize: 13 }} />}
              onClick={() => onReject(visitor)}
              sx={{ fontWeight: 700, fontSize: '11px', py: 0.5, textTransform: 'none' }}>
              Reject
            </Button>
          </Stack>
        )}

        {visitor.status === 'APPROVED' && (
          <Box onClick={e => e.stopPropagation()}>
            <Button fullWidth variant="outlined" size="small" startIcon={<QrCodeIcon sx={{ fontSize: 13 }} />}
              onClick={() => onViewQR(visitor)}
              sx={{ fontWeight: 700, fontSize: '11px', py: 0.5, textTransform: 'none', color: '#14B8A6', borderColor: '#14B8A6' }}>
              View QR Code
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Timeline Modal ────────────────────────────────────────────────────────
function TimelineModal({ visitor, open, onClose }) {
  if (!visitor) return null;

  const steps = [
    { label: 'Booking submitted', time: visitor.createdAt, done: true, color: '#3B82F6',
      desc: `${visitor.name} booked a visit to meet ${visitor.host} at Gate ${visitor.gate}` },
    { label: 'Approved by host', time: visitor.approvedAt, done: !!visitor.approvedAt, color: '#14B8A6',
      desc: visitor.approvedAt ? `Approved for ${visitor.expectedDuration || 120} minutes. QR code sent to ${visitor.email}` : 'Waiting for host approval' },
    { label: 'QR code sent', time: visitor.approvedAt, done: !!visitor.approvedAt && visitor.qrGenerated, color: '#14B8A6',
      desc: visitor.qrGenerated ? `QR code delivered to ${visitor.email}` : 'QR code pending' },
    { label: 'Checked in', time: visitor.checkInTime, done: !!visitor.checkInTime, color: '#06B6D4',
      desc: visitor.checkInTime ? `Entered at Gate ${visitor.gate} — ${fmtDT(visitor.checkInTime)}` : 'Not yet checked in' },
    { label: visitor.status === 'OVERSTAY' ? 'Overstaying' : 'Checked out', time: visitor.checkOutTime || (visitor.status === 'OVERSTAY' ? visitor.allowedUntil : null),
      done: !!visitor.checkOutTime || visitor.status === 'OVERSTAY', color: visitor.status === 'OVERSTAY' ? '#EF4444' : '#6B7280',
      desc: visitor.checkOutTime ? `Duration: ${visitor.actualDuration || '—'} minutes` : visitor.status === 'OVERSTAY' ? `Exceeded allowed time (${fmtDT(visitor.allowedUntil)})` : 'Still inside' },
  ];

  const activeStep = steps.filter(s => s.done).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '17px', borderBottom: '1.5px solid #E2E8F0', pb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TimelineIcon sx={{ color: '#14B8A6' }} />
            <Box>
              <Typography fontWeight={800} fontSize={16}>{visitor.name}</Typography>
              <Typography fontSize={12} color="text.secondary">{visitor.visitorId} · {fmtDate(visitor.createdAt)}</Typography>
            </Box>
          </Stack>
          <Chip label={visitor.status} size="small" sx={{
            fontWeight: 700, fontSize: '11px',
            bgcolor: { PENDING: '#FEF3C7', APPROVED: '#CCFBF1', IN: '#DBEAFE', OVERSTAY: '#FEE2E2', OUT: '#F1F5F9' }[visitor.status] || '#F1F5F9',
            color: { PENDING: '#92400E', APPROVED: '#065F46', IN: '#1E40AF', OVERSTAY: '#991B1B', OUT: '#374151' }[visitor.status] || '#374151',
          }} />
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {/* Visitor info */}
        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', mb: 3 }}>
          <Grid container spacing={1}>
            {[['Phone', visitor.phone], ['Email', visitor.email], ['Company', visitor.company], ['Gate', `Gate ${visitor.gate}`], ['Host', visitor.host], ['Purpose', visitor.purpose]].map(([l, v]) => v ? (
              <Grid item xs={6} key={l}>
                <Typography fontSize={10} color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.5px">{l}</Typography>
                <Typography fontSize={12} fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</Typography>
              </Grid>
            ) : null)}
          </Grid>
        </Box>

        {/* Timeline stepper */}
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, i) => (
            <Step key={i} completed={step.done}>
              <StepLabel
                StepIconProps={{ sx: { color: step.done ? step.color : '#CBD5E1' } }}
                sx={{ '& .MuiStepLabel-label': { fontWeight: step.done ? 700 : 400, fontSize: '13px' } }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <span>{step.label}</span>
                  {step.time && step.done && <Typography fontSize={11} color="text.secondary">{fmtDT(step.time)}</Typography>}
                </Stack>
              </StepLabel>
              <StepContent>
                <Typography fontSize={12} color="text.secondary" sx={{ pb: 1 }}>{step.desc}</Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {/* Allowed until / expiry */}
        {visitor.allowedUntil && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: new Date() > new Date(visitor.allowedUntil) ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${new Date() > new Date(visitor.allowedUntil) ? '#FECACA' : '#BBF7D0'}` }}>
            <Typography fontSize={12} fontWeight={600} color={new Date() > new Date(visitor.allowedUntil) ? '#991B1B' : '#14532D'}>
              {new Date() > new Date(visitor.allowedUntil) ? '⏰ Visit window expired' : '✅ Visit valid until'}: {fmtDT(visitor.allowedUntil)}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1.5px solid #E2E8F0' }}>
        <Button onClick={onClose} sx={{ fontWeight: 700 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── QR Code Modal ─────────────────────────────────────────────────────────
function QRModal({ visitor, open, onClose }) {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !visitor?._id) return;
    setLoading(true);
    api.post(`/visitor/${visitor._id}/generate-qr`)
      .then(r => setQrCode(r.data?.qrCode || ''))
      .catch(() => setQrCode(''))
      .finally(() => setLoading(false));
  }, [open, visitor?._id]);

  if (!visitor) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, borderBottom: '1.5px solid #E2E8F0', background: 'linear-gradient(135deg,#F0FDFA,#fff)' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <QrCodeIcon sx={{ color: '#14B8A6' }} />
          <Box>
            <Typography fontWeight={800} fontSize={15}>{visitor.name}</Typography>
            <Typography fontSize={12} color="text.secondary">Approved visitor QR code</Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, textAlign: 'center' }}>
        {loading ? (
          <Box py={4}><CircularProgress sx={{ color: '#14B8A6' }} /></Box>
        ) : qrCode ? (
          <Box>
            <Box sx={{ p: 2, bgcolor: '#fff', border: '2px solid #14B8A6', borderRadius: 2, display: 'inline-block', mb: 2 }}>
              <img src={qrCode} alt="QR Code" style={{ width: 200, height: 200, display: 'block' }} />
            </Box>
            <Typography fontSize={13} color="text.secondary" mb={1}>
              Valid until: <strong>{visitor.allowedUntil ? fmtDT(visitor.allowedUntil) : '—'}</strong>
            </Typography>
            <Typography fontSize={12} color="text.secondary">Gate: {visitor.gate}</Typography>
          </Box>
        ) : (
          <Typography color="text.secondary" py={3}>QR code not available. Re-approve to generate.</Typography>
        )}

        {/* Visitor summary */}
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', textAlign: 'left' }}>
          {[['Phone', visitor.phone], ['Email', visitor.email], ['Company', visitor.company], ['Duration', `${visitor.expectedDuration || 120} minutes`]].map(([l, v]) => v ? (
            <Stack key={l} direction="row" justifyContent="space-between" sx={{ py: 0.25 }}>
              <Typography fontSize={12} color="text.secondary">{l}</Typography>
              <Typography fontSize={12} fontWeight={600}>{v}</Typography>
            </Stack>
          ) : null)}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1.5px solid #E2E8F0' }}>
        {qrCode && (
          <Button size="small" onClick={() => { const a = document.createElement('a'); a.href = qrCode; a.download = `${visitor.name}_QR.png`; a.click(); }}>
            Download QR
          </Button>
        )}
        <Button onClick={onClose} variant="contained" sx={{ background: 'linear-gradient(135deg,#14B8A6,#0D9488)', fontWeight: 700 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function HostAdminDashboard() {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const { socket } = useSocket();

  const [visitors, setVisitors] = useState([]);
  const [hostInfo, setHostInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [error, setError] = useState('');

  // Dialogs
  const [approveDialog, setApproveDialog] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(null);
  const [timelineVisitor, setTimelineVisitor] = useState(null);
  const [qrVisitor, setQrVisitor] = useState(null);

  // Form state
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalDuration, setApprovalDuration] = useState(120);
  const [customMessage, setCustomMessage] = useState(''); // NEW: custom message on approval
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Track previous overstay count for browser notif
  const prevOverstayRef = useRef(0);

  // ── Add toast ──────────────────────────────────────────────────────
  const addToast = useCallback((title, body, color = '#14B8A6') => {
    const id = ++toastIdRef.current;
    setToasts(p => [...p, { id, title, body, color, time: new Date().toLocaleTimeString() }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 6000);
  }, []);

  const removeToast = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  // ── Auth guard ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    if (!['hostadmin', 'admin'].includes(user.role)) { navigate('/login', { replace: true }); }
  }, [user, navigate]);

  // ── Request browser notification permission on mount ────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ── Load data ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const [hostRes, allVisitors] = await Promise.allSettled([
        api.get('/hostadmin/me'),
        hostAdminDataService.getHostVisitors(user?._id),
      ]);
      if (hostRes.status === 'fulfilled') {
        setHostInfo(hostRes.value.data?.data || { name: user?.name, department: '—' });
      } else {
        setHostInfo({ name: user?.name, department: '—' });
      }
      const vis = hostRes.status === 'fulfilled' || allVisitors.status === 'fulfilled'
        ? (allVisitors.status === 'fulfilled' ? allVisitors.value : [])
        : [];
      setVisitors(Array.isArray(vis) ? vis : []);
    } catch (err) {
      setError('Failed to load visitor data. Please refresh.');
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id, user?.name]);

  useEffect(() => {
    if (user) {
      loadData();
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [loadData, user]);

  // ── Socket real-time events ─────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // NEW visitor booked (live toast + browser notif)
    const onNew = (v) => {
      // Only show if this visitor is for our host
      if (v.hostId && user?._id && String(v.hostId) !== String(user._id)) return;
      setVisitors(p => {
        const exists = p.find(x => x._id === v._id);
        return exists ? p : [v, ...p];
      });
      addToast('🔔 New Visitor Request', `${v.name} wants to visit you at Gate ${v.gate}`, '#F59E0B');
      sendBrowserNotif('New Visitor Request — VPASS', `${v.name} wants to visit you at Gate ${v.gate}`);
    };

    const onUpd = (v) => {
      setVisitors(p => p.map(x => x._id === v._id ? { ...x, ...v } : x));
      if (v.status === 'IN') addToast('✅ Visitor Checked In', `${v.name} entered at Gate ${v.gate}`, '#06B6D4');
      if (v.status === 'OUT') addToast('👋 Visitor Checked Out', `${v.name} has left`, '#6B7280');
    };

    socket.on('visitor:new', onNew);
    socket.on('visitor:updated', onUpd);
    socket.on('visitor:checkin', onUpd);
    socket.on('visitor:checkout', onUpd);

    return () => {
      socket.off('visitor:new', onNew);
      socket.off('visitor:updated', onUpd);
      socket.off('visitor:checkin', onUpd);
      socket.off('visitor:checkout', onUpd);
    };
  }, [socket, user?._id, addToast]);

  // ── Overstay detection + browser notif ─────────────────────────────
  useEffect(() => {
    const overstayCount = visitors.filter(v => v.status === 'OVERSTAY').length;
    if (overstayCount > prevOverstayRef.current) {
      const newOverstays = visitors.filter(v => v.status === 'OVERSTAY').slice(0, overstayCount - prevOverstayRef.current);
      newOverstays.forEach(v => {
        addToast('⚠️ Overstay Alert', `${v.name} has exceeded their visit time!`, '#EF4444');
        sendBrowserNotif('Overstay Alert — VPASS', `${v.name} is overstaying their visit!`);
      });
    }
    prevOverstayRef.current = overstayCount;
  }, [visitors, addToast]);

  // ── Actions ────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!approveDialog?._id) return;
    setApproveLoading(true);
    try {
      await api.post(`/visitor/${approveDialog._id}/approve`, {
        action: 'APPROVED',
        expectedDuration: approvalDuration,
        customMessage: customMessage.trim() || undefined, // NEW: send custom message
      });
      addToast('✅ Visitor Approved', `QR code email sent to ${approveDialog.email}`, '#14B8A6');
      setApproveDialog(null);
      setApprovalDuration(120);
      setCustomMessage('');
      await loadData();
    } catch (err) {
      setError(`Approval failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog?._id || !rejectionReason.trim()) return;
    setRejectLoading(true);
    try {
      await api.post(`/visitor/${rejectDialog._id}/approve`, {
        action: 'REJECTED',
        reason: rejectionReason,
      });
      addToast('Visitor Rejected', `Notification sent to ${rejectDialog.email}`, '#EF4444');
      setRejectDialog(null);
      setRejectionReason('');
      await loadData();
    } catch (err) {
      setError(`Rejection failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setRejectLoading(false);
    }
  };

  // ── Filtered & grouped data ─────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = visitors.filter(v =>
      !search ||
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.includes(search) ||
      v.phone?.includes(search) ||
      v.visitorId?.toLowerCase().includes(search.toLowerCase())
    );
    return applyDateFilter(result, dateFilter);
  }, [visitors, search, dateFilter]);

  const kanban = useMemo(() => ({
    pending:   filtered.filter(v => v.status === 'PENDING'),
    approved:  filtered.filter(v => v.status === 'APPROVED'),
    inside:    filtered.filter(v => v.status === 'IN'),
    overstay:  filtered.filter(v => v.status === 'OVERSTAY'),
    completed: filtered.filter(v => v.status === 'OUT'),
  }), [filtered]);

  const stats = useMemo(() => ({
    pending: kanban.pending.length,
    approved: kanban.approved.length,
    inside: kanban.inside.length,
    overstay: kanban.overstay.length,
    completed: kanban.completed.length,
  }), [kanban]);

  if (!user) return <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh"><CircularProgress /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(160deg, #F0FDFA 0%, #FFFFFF 60%, #EFF6FF 100%)', py: 3 }}>
      <Container maxWidth="xl">

        {/* HEADER */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4} spacing={2} flexWrap="wrap">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 56, height: 56, borderRadius: '14px', background: 'linear-gradient(135deg,#14B8A6,#06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(20,184,166,0.3)' }}>
              <PersonIcon sx={{ fontSize: 28, color: '#fff' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>
                {hostInfo?.name || user?.name}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {user?.role?.toUpperCase()} • {hostInfo?.department || hostInfo?.company || '—'}
                </Typography>
                {socket?.connected && (
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22c55e' }} />
                )}
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* Overstay alert badge on notification icon */}
            <Tooltip title={stats.overstay > 0 ? `${stats.overstay} overstay alert(s)` : 'Notifications'}>
              <Badge badgeContent={stats.overstay} color="error" overlap="circular">
                <IconButton sx={{ border: '1.5px solid #E2E8F0', borderRadius: '10px', color: stats.overstay > 0 ? '#EF4444' : '#64748B' }}>
                  <NotificationsIcon />
                </IconButton>
              </Badge>
            </Tooltip>

            <Tooltip title="Refresh">
              <span>
                <IconButton onClick={loadData} disabled={loading} sx={{ border: '1.5px solid #E2E8F0', borderRadius: '10px' }}>
                  <RefreshIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>

            <Button variant="outlined" startIcon={<LogoutIcon />} onClick={() => { logoutUser(); navigate('/login', { replace: true }); }}
              sx={{ border: '1.5px solid #E2E8F0', color: '#64748B', fontWeight: 700, fontSize: '12px', '&:hover': { background: '#FEE2E2', borderColor: '#EF4444', color: '#EF4444' } }}>
              Logout
            </Button>
          </Stack>
        </Stack>

        {/* ALERTS */}
        {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
        {stats.overstay > 0 && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, border: '2px solid #EF4444', fontWeight: 600 }}>
            🚨 {stats.overstay} visitor(s) are overstaying their visit time! Check the Overstay column.
          </Alert>
        )}

        {/* STAT CARDS */}
        <Grid container spacing={2} mb={4}>
          {[
            { label: 'Pending', value: stats.pending, icon: WarningIcon, color: '#F59E0B' },
            { label: 'Approved', value: stats.approved, icon: CheckCircleIcon, color: '#14B8A6' },
            { label: 'Inside', value: stats.inside, icon: PersonIcon, color: '#06B6D4' },
            { label: 'Overstay', value: stats.overstay, icon: WarningIcon, color: '#EF4444', pulse: stats.overstay > 0 },
            { label: 'Completed', value: stats.completed, icon: CheckIcon, color: '#6B7280' },
          ].map(s => (
            <Grid item xs={6} sm={4} md={2.4} key={s.label}>
              <StatCard {...s} />
            </Grid>
          ))}
        </Grid>

        {/* SEARCH + DATE FILTER */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems={{ sm: 'center' }}>
          <Paper sx={{ flex: 1, borderRadius: 2, border: '1.5px solid #E2E8F0', '&:focus-within': { borderColor: '#14B8A6', boxShadow: '0 0 0 3px rgba(20,184,166,0.1)' } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" px={2} py={1.25}>
              <SearchIcon sx={{ color: '#94A3B8', fontSize: 18 }} />
              <TextField fullWidth placeholder="Search name, email, phone, visitor ID…" size="small" value={search} onChange={e => setSearch(e.target.value)} variant="standard" InputProps={{ disableUnderline: true, sx: { fontSize: '13px' } }} />
            </Stack>
          </Paper>

          {/* NEW: Date filter toggle */}
          <ToggleButtonGroup value={dateFilter} exclusive onChange={(_, v) => v && setDateFilter(v)} size="small"
            sx={{ bgcolor: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
            {[{ v: 'today', l: 'Today' }, { v: 'week', l: 'This Week' }, { v: 'all', l: 'All' }].map(o => (
              <ToggleButton key={o.v} value={o.v} sx={{ fontWeight: 700, fontSize: '11px', px: 2, textTransform: 'none', border: 'none', '&.Mui-selected': { bgcolor: '#14B8A6', color: '#fff', '&:hover': { bgcolor: '#0D9488' } } }}>
                {o.l}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        {/* KANBAN BOARD */}
        {loading ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2.5 }}>
            <CircularProgress sx={{ color: '#14B8A6', mb: 2 }} />
            <Typography sx={{ color: '#64748B' }}>Loading your visitors…</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, px: 0.5,
            '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 3 } }}>

            <KanbanColumn title="Pending Approval" count={kanban.pending.length} color="#F59E0B" icon={WarningIcon}>
              {kanban.pending.map(v => (
                <VisitorCard key={v._id} visitor={v} onApprove={setApproveDialog} onReject={setRejectDialog} onViewTimeline={setTimelineVisitor} onViewQR={setQrVisitor} />
              ))}
            </KanbanColumn>

            <KanbanColumn title="Approved — QR Sent" count={kanban.approved.length} color="#14B8A6" icon={CheckCircleIcon}>
              {kanban.approved.map(v => (
                <VisitorCard key={v._id} visitor={v} onApprove={setApproveDialog} onReject={setRejectDialog} onViewTimeline={setTimelineVisitor} onViewQR={setQrVisitor} />
              ))}
            </KanbanColumn>

            <KanbanColumn title="Inside Campus" count={kanban.inside.length} color="#06B6D4" icon={PersonIcon}>
              {kanban.inside.map(v => (
                <VisitorCard key={v._id} visitor={v} onApprove={setApproveDialog} onReject={setRejectDialog} onViewTimeline={setTimelineVisitor} onViewQR={setQrVisitor} />
              ))}
            </KanbanColumn>

            {/* NEW: overstayBadge on column header */}
            <KanbanColumn title="Overstay Alert" count={kanban.overstay.length} color="#EF4444" icon={WarningIcon} overstayBadge={kanban.overstay.length > 0 ? '!' : null}>
              {kanban.overstay.map(v => (
                <VisitorCard key={v._id} visitor={v} onApprove={setApproveDialog} onReject={setRejectDialog} onViewTimeline={setTimelineVisitor} onViewQR={setQrVisitor} />
              ))}
            </KanbanColumn>

            <KanbanColumn title="Completed" count={kanban.completed.length} color="#6B7280" icon={CheckIcon}>
              {kanban.completed.map(v => (
                <VisitorCard key={v._id} visitor={v} onApprove={setApproveDialog} onReject={setRejectDialog} onViewTimeline={setTimelineVisitor} onViewQR={setQrVisitor} />
              ))}
            </KanbanColumn>
          </Box>
        )}
      </Container>

      {/* ── APPROVE DIALOG ── */}
      <Dialog open={!!approveDialog} onClose={() => setApproveDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, background: 'linear-gradient(135deg,#F0FDFA,#fff)', borderBottom: '1.5px solid #CCFBF1' }}>
          Approve Visitor Request
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {approveDialog && (
            <Stack spacing={2.5}>
              <Box sx={{ p: 2, borderRadius: 2, background: '#F0FDFA', border: '1.5px solid #99F6E0', borderLeft: '4px solid #14B8A6' }}>
                <Typography fontWeight={700} fontSize={15}>{approveDialog.name}</Typography>
                <Typography fontSize={12} color="text.secondary">{approveDialog.email} · Gate {approveDialog.gate}</Typography>
                {approveDialog.purpose && <Typography fontSize={12} mt={0.5} color="text.secondary">Purpose: {approveDialog.purpose}</Typography>}
              </Box>

              <TextField label="Expected Duration (minutes)" type="number" fullWidth value={approvalDuration}
                onChange={e => setApprovalDuration(Number(e.target.value))}
                inputProps={{ min: 15, step: 15 }}
                helperText="Visitor will be flagged as overstay after this duration" />

              {/* NEW: Custom message field */}
              <TextField label="Custom message to visitor (optional)" multiline rows={3} fullWidth value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="e.g. Please come to Block B, Room 204. Call on arrival."
                helperText="This message will be included in the approval email"
                InputProps={{ startAdornment: <MessageIcon sx={{ color: '#94A3B8', mr: 1, mt: 0.5, fontSize: 18, alignSelf: 'flex-start' }} /> }}
              />

              <Alert severity="info" sx={{ borderRadius: 1.5, background: '#F0FDFA', border: '1.5px solid #CCFBF1' }}>
                <Typography fontSize={12}>✉️ QR code + approval email will be sent to <strong>{approveDialog.email}</strong></Typography>
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1.5px solid #E2E8F0' }}>
          <Button onClick={() => { setApproveDialog(null); setCustomMessage(''); }} sx={{ fontWeight: 700, color: '#64748B' }}>Cancel</Button>
          <Button variant="contained" onClick={handleApprove} disabled={approveLoading}
            sx={{ background: 'linear-gradient(135deg,#14B8A6,#0D9488)', fontWeight: 700 }}>
            {approveLoading ? <><CircularProgress size={15} sx={{ mr: 1, color: '#fff' }} />Processing…</> : 'Approve & Send QR'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── REJECT DIALOG ── */}
      <Dialog open={!!rejectDialog} onClose={() => setRejectDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, background: 'linear-gradient(135deg,#FEF2F2,#fff)', borderBottom: '1.5px solid #FECACA' }}>
          Reject Visitor Request
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {rejectDialog && (
            <Stack spacing={2.5}>
              <Box sx={{ p: 2, borderRadius: 2, background: '#FEF2F2', border: '1.5px solid #FECACA', borderLeft: '4px solid #EF4444' }}>
                <Typography fontWeight={700} fontSize={15}>{rejectDialog.name}</Typography>
                <Typography fontSize={12} color="text.secondary">{rejectDialog.email}</Typography>
              </Box>
              <TextField label="Rejection Reason *" multiline rows={4} fullWidth value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Provide a clear reason for rejection…" />
              <Alert severity="warning" sx={{ borderRadius: 1.5, background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
                <Typography fontSize={12}>Rejection notification will be sent to <strong>{rejectDialog.email}</strong></Typography>
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1.5px solid #E2E8F0' }}>
          <Button onClick={() => setRejectDialog(null)} sx={{ fontWeight: 700, color: '#64748B' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={!rejectionReason.trim() || rejectLoading}
            sx={{ fontWeight: 700 }}>
            {rejectLoading ? 'Processing…' : 'Reject & Notify'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── TIMELINE MODAL ── */}
      <TimelineModal visitor={timelineVisitor} open={!!timelineVisitor} onClose={() => setTimelineVisitor(null)} />

      {/* ── QR CODE MODAL ── */}
      <QRModal visitor={qrVisitor} open={!!qrVisitor} onClose={() => setQrVisitor(null)} />

      {/* ── LIVE TOASTS ── */}
      <LiveToast toasts={toasts} onClose={removeToast} />
    </Box>
  );
}