// ═══════════════════════════════════════════════════════════════
// QRCodeDisplay.jsx - FIXED
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Paper, Typography, Button, Stack, CircularProgress, Alert,
  Card, CardContent, Tooltip, IconButton,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function QRCodeDisplay({
  visitorId,
  gateId,
  visitorData = {},
  onQRGenerated = null,
  showDetails = true,
}) {
  const [qrValue, setQrValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(false);
  const [printProgress, setPrintProgress] = useState(false);
  const qrRef = useRef();

  useEffect(() => {
    const generateQR = async () => {
      setLoading(true);
      setError('');

      try {
        if (!visitorId) {
          throw new Error('Visitor ID is required');
        }

        const token = localStorage.getItem('token');
        let qrData = '';

        try {
          if (token && visitorData._id) {
            const response = await fetch(
              `${import.meta.env.VITE_API_URL}/api/visitor/${visitorData._id}/qr-value`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (response.ok) {
              const data = await response.json();
              qrData = data.qrValue || data.qr || generatePlainQR();
            } else {
              qrData = generatePlainQR();
            }
          } else {
            qrData = generatePlainQR();
          }
        } catch {
          qrData = generatePlainQR();
        }

        setQrValue(qrData);

        if (onQRGenerated) {
          onQRGenerated({
            visitorId,
            gateId,
            qrValue: qrData,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (qrError) {
        console.error('QR generation error:', qrError);
        setError(qrError.message || 'Failed to generate QR code. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const generatePlainQR = () => {
      const checkInCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      return `${visitorId}|${gateId || 'MAIN-GATE'}|${checkInCode}`;
    };

    generateQR();
  }, [visitorId, gateId, visitorData, onQRGenerated]);

  const downloadQR = async () => {
    if (!qrRef.current) return;

    setDownloadProgress(true);
    try {
      const canvas = await html2canvas(qrRef.current);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `visitor-qr-${visitorId}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (downloadError) {
      console.error('Download error:', downloadError);

      try {
        const canvas = qrRef.current.querySelector('canvas');
        if (canvas) {
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = `visitor-qr-${visitorId}-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch {
        setError('Failed to download QR code. Please try the print option.');
      }
    } finally {
      setDownloadProgress(false);
    }
  };

  const printQR = () => {
    if (!qrRef.current) return;

    setPrintProgress(true);
    try {
      const printWindow = window.open('', '', 'height=600,width=600');
      const qrCanvas = qrRef.current.querySelector('canvas') || qrRef.current;

      const qrHTML = `
        <html>
          <head>
            <title>Visitor QR Code - ${visitorId}</title>
            <style>
              * { margin: 0; padding: 0; }
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #f5f5f5;
                padding: 20px;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 500px;
              }
              .header {
                margin-bottom: 30px;
              }
              .header h1 {
                font-size: 24px;
                color: #1f2937;
                margin-bottom: 10px;
              }
              .header p {
                color: #6b7280;
                font-size: 14px;
              }
              .qr-section {
                margin: 30px 0;
                display: flex;
                justify-content: center;
              }
              .qr-section img,
              .qr-section canvas {
                max-width: 300px;
                height: auto;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                padding: 10px;
              }
              .visitor-info {
                background: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: left;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .info-label {
                font-weight: 600;
                color: #374151;
              }
              .info-value {
                color: #6b7280;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #9ca3af;
                font-size: 12px;
              }
              @media print {
                body { background: white; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎫 Visitor Entry Pass</h1>
                <p>Scan this QR code at the security gate</p>
              </div>

              <div class="qr-section">
                ${
                  qrCanvas instanceof HTMLCanvasElement
                    ? `<img src="${qrCanvas.toDataURL('image/png')}" alt="QR Code" />`
                    : '<div>QR Code</div>'
                }
              </div>

              ${
                visitorData.name
                  ? `
                <div class="visitor-info">
                  <div class="info-row">
                    <span class="info-label">Visitor Name:</span>
                    <span class="info-value">${visitorData.name}</span>
                  </div>
                  ${visitorData.visitorId ? `
                  <div class="info-row">
                    <span class="info-label">Visitor ID:</span>
                    <span class="info-value">${visitorData.visitorId}</span>
                  </div>
                  ` : ''}
                  ${visitorData.host || visitorData.whomToMeet ? `
                  <div class="info-row">
                    <span class="info-label">Meeting With:</span>
                    <span class="info-value">${visitorData.host || visitorData.whomToMeet}</span>
                  </div>
                  ` : ''}
                  ${visitorData.purpose ? `
                  <div class="info-row">
                    <span class="info-label">Purpose:</span>
                    <span class="info-value">${visitorData.purpose}</span>
                  </div>
                  ` : ''}
                  ${visitorData.allowedUntil ? `
                  <div class="info-row">
                    <span class="info-label">Valid Until:</span>
                    <span class="info-value">${new Date(visitorData.allowedUntil).toLocaleString()}</span>
                  </div>
                  ` : ''}
                </div>
              `
                  : ''
              }

              <div class="footer">
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <p>Please arrive 10 minutes early and carry a valid ID</p>
              </div>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(qrHTML);
      printWindow.document.close();
      printWindow.print();
    } catch (printError) {
      console.error('Print error:', printError);
      setError('Failed to print QR code. Please try downloading instead.');
    } finally {
      setPrintProgress(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">Generating QR code...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
        {error}
      </Alert>
    );
  }

  if (!qrValue) {
    return (
      <Alert severity="warning">
        Unable to generate QR code. Please try again.
        <Button size="small" onClick={() => window.location.reload()} sx={{ ml: 2 }}>
          Reload
        </Button>
      </Alert>
    );
  }

  return (
    <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CheckCircleIcon sx={{ color: 'success.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              📱 Your Entry QR Code
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Show this QR code at the security gate for quick entry
          </Typography>
        </Box>

        <Box
          ref={qrRef}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            p: 2,
            backgroundColor: '#f9fafb',
            borderRadius: 2,
            mb: 3,
            border: '2px dashed #e5e7eb',
          }}
        >
          <QRCodeSVG
            value={qrValue}
            size={256}
            level="H"
            includeMargin
            quietZone={4}
            renderAs="canvas"
          />
        </Box>

        <Box sx={{ p: 2, backgroundColor: '#f3f4f6', borderRadius: 1, mb: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            QR CODE DATA:
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              display: 'block',
              mt: 1,
              color: 'text.secondary',
            }}
          >
            {qrValue}
          </Typography>
        </Box>

        {showDetails && visitorData && Object.keys(visitorData).length > 0 && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#f0f9ff', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              📋 Visitor Details
            </Typography>
            <Stack spacing={1}>
              {visitorData.visitorId && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    ID:
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {visitorData.visitorId}
                  </Typography>
                </Box>
              )}
              {visitorData.name && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    Name:
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {visitorData.name}
                  </Typography>
                </Box>
              )}
              {(visitorData.host || visitorData.whomToMeet) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    Meeting:
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {visitorData.host || visitorData.whomToMeet}
                  </Typography>
                </Box>
              )}
              {visitorData.purpose && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    Purpose:
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {visitorData.purpose}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        <Stack direction="row" spacing={1}>
          <Tooltip title="Download QR code as image">
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={downloadQR}
              disabled={downloadProgress}
              fullWidth
            >
              {downloadProgress ? <CircularProgress size={20} /> : 'Download'}
            </Button>
          </Tooltip>
          <Tooltip title="Print QR code">
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={printQR}
              disabled={printProgress}
              fullWidth
            >
              {printProgress ? <CircularProgress size={20} /> : 'Print'}
            </Button>
          </Tooltip>
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 2, display: 'block', textAlign: 'center' }}
        >
          💡 Keep this QR code handy for quick check-in
        </Typography>
      </CardContent>
    </Card>
  );
}