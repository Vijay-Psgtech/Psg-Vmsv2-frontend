


// ═══════════════════════════════════════════════════════════════
// GateHeatmap.jsx - FIXED
// ═══════════════════════════════════════════════════════════════

import React, { useMemo, useState } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Stack, Chip,
  CircularProgress, Tooltip, LinearProgress, Alert,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function GateHeatmap({
  visitors = [],
  onGateClick = null,
  compact = false,
}) {
  const [selectedGate, setSelectedGate] = useState(null);

  const gateStats = useMemo(() => {
    if (!visitors || visitors.length === 0) {
      return {};
    }

    const stats = {};

    visitors.forEach((visitor) => {
      const gateName = visitor.gate?.name || visitor.gate || 'Unknown Gate';
      const gateId = visitor.gate?._id || visitor.gate || gateName;

      if (!stats[gateId]) {
        stats[gateId] = {
          name: gateName,
          total: 0,
          pending: 0,
          inside: 0,
          overstay: 0,
          completed: 0,
          visitors: [],
        };
      }

      stats[gateId].total += 1;
      stats[gateId].visitors.push(visitor);

      if (['PENDING', 'APPROVED'].includes(visitor.status)) {
        stats[gateId].pending += 1;
      } else if (visitor.status === 'IN') {
        stats[gateId].inside += 1;
      } else if (visitor.status === 'OVERSTAY') {
        stats[gateId].overstay += 1;
      } else if (['OUT', 'EXPIRED', 'REJECTED'].includes(visitor.status)) {
        stats[gateId].completed += 1;
      }
    });

    return stats;
  }, [visitors]);

  const getSeverity = (overstayCount) => {
    if (overstayCount >= 5) {
      return { level: 'critical', color: '#ef4444', bgColor: '#fee2e2', label: '🔴 CRITICAL' };
    }
    if (overstayCount >= 3) {
      return { level: 'high', color: '#f59e0b', bgColor: '#fef3c7', label: '🟠 HIGH' };
    }
    if (overstayCount >= 1) {
      return { level: 'medium', color: '#f97316', bgColor: '#ffedd5', label: '🟡 MEDIUM' };
    }
    return { level: 'low', color: '#10b981', bgColor: '#dcfce7', label: '🟢 NORMAL' };
  };

  const getTrafficPercentage = (inside, capacity = 50) => {
    return Math.min((inside / capacity) * 100, 100);
  };

  if (Object.keys(gateStats).length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No visitor data available for gates
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          🎯 Gate Status Heatmap
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Real-time visitor statistics and overstay monitoring by gate
        </Typography>
      </Box>

      {Object.values(gateStats).some((stat) => stat.overstay > 0) && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          ⚠️ There are visitors overstaying at some gates. Please take immediate action.
        </Alert>
      )}

      <Grid container spacing={2}>
        {Object.entries(gateStats).map(([gateId, stats]) => {
          const severity = getSeverity(stats.overstay);
          const trafficPercent = getTrafficPercentage(stats.inside);
          const isSelected = selectedGate === gateId;

          return (
            <Grid key={gateId} xs={12} sm={6} md={compact ? 12 : 6} lg={3}>
              <Card
                onClick={() => {
                  setSelectedGate(isSelected ? null : gateId);
                  if (onGateClick) onGateClick(gateId, stats);
                }}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: isSelected ? severity.bgColor : '#fff',
                  border: `2px solid ${isSelected ? severity.color : '#e5e7eb'}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: 3,
                    backgroundColor: severity.bgColor,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        color: severity.color,
                      }}
                    >
                      {stats.name}
                    </Typography>
                    <Chip
                      label={severity.label}
                      size="small"
                      sx={{
                        backgroundColor: severity.color,
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  {stats.overstay > 0 && (
                    <Box
                      sx={{
                        p: 1.5,
                        backgroundColor: '#fee2e2',
                        borderRadius: 1,
                        mb: 2,
                        border: '1px solid #fca5a5',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <WarningIcon sx={{ fontSize: 20, color: '#dc2626' }} />
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700, color: '#dc2626' }}
                        >
                          ⏰ Overstaying
                        </Typography>
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: '#dc2626', mb: 1 }}
                      >
                        {stats.overstay}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(stats.overstay * 20, 100)}
                        sx={{
                          backgroundColor: '#fecaca',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#ef4444',
                          },
                        }}
                      />
                    </Box>
                  )}

                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid xs={6}>
                      <Tooltip title="Waiting for check-in">
                        <Box
                          sx={{
                            p: 1.5,
                            backgroundColor: '#fef3c7',
                            borderRadius: 1,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Pending
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, color: '#92400e' }}
                          >
                            {stats.pending}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>

                    <Grid xs={6}>
                      <Tooltip title="Currently inside building">
                        <Box
                          sx={{
                            p: 1.5,
                            backgroundColor: '#dbeafe',
                            borderRadius: 1,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Inside
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, color: '#1e40af' }}
                          >
                            {stats.inside}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>

                    <Grid xs={6}>
                      <Tooltip title="Checked out visitors">
                        <Box
                          sx={{
                            p: 1.5,
                            backgroundColor: '#e5e7eb',
                            borderRadius: 1,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Completed
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, color: '#374151' }}
                          >
                            {stats.completed}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>

                    <Grid xs={6}>
                      <Tooltip title="Total visitors today">
                        <Box
                          sx={{
                            p: 1.5,
                            backgroundColor: '#f3f4f6',
                            borderRadius: 1,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Total
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, color: '#6b7280' }}
                          >
                            {stats.total}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                  </Grid>

                  {stats.inside > 0 && (
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, color: 'text.secondary' }}
                        >
                          Capacity
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, color: 'text.secondary' }}
                        >
                          {Math.round(trafficPercent)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={trafficPercent}
                        sx={{
                          backgroundColor: '#e5e7eb',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: trafficPercent > 75 ? '#ef4444' : '#3b82f6',
                          },
                        }}
                      />
                    </Box>
                  )}

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1.5, display: 'block' }}
                  >
                    📊 Real-time data
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {selectedGate && gateStats[selectedGate] && (
        <Paper sx={{ mt: 3, p: 3, backgroundColor: '#f9fafb', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              📍 {gateStats[selectedGate].name} - Detailed View
            </Typography>
            <Typography
              variant="caption"
              sx={{ cursor: 'pointer', color: 'primary.main' }}
              onClick={() => setSelectedGate(null)}
            >
              ✕ Close
            </Typography>
          </Box>

          {gateStats[selectedGate].overstay > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              ⚠️ {gateStats[selectedGate].overstay} visitor(s) are overstaying at this gate.
              Immediate action required.
            </Alert>
          )}

          <Grid container spacing={2}>
            {[
              {
                label: 'Waiting Check-in',
                value: gateStats[selectedGate].pending,
                icon: AccessTimeIcon,
                color: '#f59e0b',
              },
              {
                label: 'Currently Inside',
                value: gateStats[selectedGate].inside,
                icon: CheckCircleIcon,
                color: '#3b82f6',
              },
              {
                label: 'Overstaying',
                value: gateStats[selectedGate].overstay,
                icon: WarningIcon,
                color: '#ef4444',
              },
              {
                label: 'Completed',
                value: gateStats[selectedGate].completed,
                icon: CheckCircleIcon,
                color: '#10b981',
              },
            ].map((stat) => (
              <Grid key={stat.label} xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #e5e7eb' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <stat.icon sx={{ color: stat.color, fontSize: 20 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: stat.color }}>
                    {stat.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {!visitors || visitors.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No visitor data available
          </Typography>
        </Paper>
      )}
    </Box>
  );
}