import React from 'react';
import {
  Skeleton,
  Card,
  CardContent,
  Stack,
  Box,
  Grid,
} from '@mui/material';

/**
 * SkeletonCard Component
 * ✅ Production-ready loading skeleton
 * ✅ Multiple variants (card, table, list)
 * ✅ MUI Skeleton for better animation
 * ✅ Responsive design
 * 
 * @param {String} variant - 'card' | 'list' | 'table' | 'grid'
 * @param {Number} count - Number of skeleton items to show
 * @param {Boolean} animated - Enable animation
 */
export default function SkeletonCard({
  variant = 'card',
  count = 1,
  animated = true,
}) {
  // ✅ Card variant - single card with title, text, and action button
  const renderCardSkeleton = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Skeleton variant="text" width="80%" height={32} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="90%" height={16} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={40} />
      </CardContent>
    </Card>
  );

  // ✅ List variant - list of items
  const renderListSkeleton = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          {Array.from({ length: count }).map((_, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                pb: 2,
                borderBottom: index < count - 1 ? '1px solid #e5e7eb' : 'none',
              }}
            >
              {/* Avatar */}
              <Skeleton variant="circular" width={48} height={48} />
              {/* Text */}
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="80%" height={16} />
              </Box>
              {/* Action */}
              <Skeleton variant="rectangular" width={80} height={36} />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );

  // ✅ Table variant - table rows
  const renderTableSkeleton = () => (
    <Box sx={{ overflowX: 'auto' }}>
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ minWidth: 650 }}>
            {/* Header */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 2,
                p: 2,
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
              }}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="text" height={20} />
              ))}
            </Box>

            {/* Rows */}
            {Array.from({ length: count }).map((_, rowIndex) => (
              <Box
                key={rowIndex}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: 2,
                  p: 2,
                  borderBottom:
                    rowIndex < count - 1 ? '1px solid #e5e7eb' : 'none',
                }}
              >
                {Array.from({ length: 5 }).map((_, colIndex) => (
                  <Skeleton key={colIndex} variant="text" height={20} />
                ))}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  // ✅ Grid variant - card grid
  const renderGridSkeleton = () => (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent>
              {/* Image */}
              <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2 }} />
              {/* Title */}
              <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
              {/* Description */}
              <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="90%" height={16} sx={{ mb: 2 }} />
              {/* Button */}
              <Skeleton variant="rectangular" width="100%" height={40} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // ✅ Compact card variant - minimal skeleton
  const renderCompactSkeleton = () => (
    <Stack spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            p: 2,
            backgroundColor: '#f9fafb',
            borderRadius: 1,
            border: '1px solid #e5e7eb',
          }}
        >
          <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="70%" height={16} />
        </Box>
      ))}
    </Stack>
  );

  // ✅ Dashboard card variant - stats card
  const renderDashboardSkeleton = () => (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="60%" height={16} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="80%" height={32} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={50} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // ✅ Render based on variant
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return renderCardSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'table':
        return renderTableSkeleton();
      case 'grid':
        return renderGridSkeleton();
      case 'compact':
        return renderCompactSkeleton();
      case 'dashboard':
        return renderDashboardSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

  return (
    <Box sx={{ animation: animated ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none' }}>
      {renderSkeleton()}
    </Box>
  );
}
