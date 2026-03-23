import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Button, Paper, Typography, CircularProgress, Alert, Stack,
  Card, CardContent, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function FaceCapture({
  onCapture,
  onError = null,
  label = 'Capture Your Photo',
  autoStart = false,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [tempImage, setTempImage] = useState(null);

  const startCamera = async () => {
    if (cameraActive) return;

    setLoading(true);
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      await new Promise((resolve, reject) => {
        const onLoadedMetadata = () => {
          videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
          resolve();
        };
        const onVideoError = () => {
          videoRef.current?.removeEventListener('error', onVideoError);
          reject(new Error('Failed to load video metadata'));
        };

        videoRef.current?.addEventListener('loadedmetadata', onLoadedMetadata);
        videoRef.current?.addEventListener('error', onVideoError);

        const timeout = setTimeout(
          () => reject(new Error('Timeout loading video')),
          5000
        );

        return () => clearTimeout(timeout);
      });

      await videoRef.current.play();
      setCameraActive(true);
      setReady(true);
    } catch (cameraError) {
      console.error('Camera error:', cameraError);

      let errorMessage = 'Failed to access camera. ';

      if (cameraError.name === 'NotFoundError' || cameraError.message.includes('NotFoundError')) {
        errorMessage += 'No camera device found on this device.';
      } else if (cameraError.name === 'NotAllowedError' || cameraError.message.includes('NotAllowedError')) {
        errorMessage +=
          'Camera permission was denied. Please enable camera access in your browser settings.';
      } else if (cameraError.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else if (cameraError.message.includes('Timeout')) {
        errorMessage += 'Camera took too long to initialize. Please try again.';
      } else {
        errorMessage += cameraError.message;
      }

      setError(errorMessage);
      if (onError) onError(cameraError);
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setReady(false);
    setError('');
  };

  const capturePhoto = () => {
    if (!videoRef.current || !ready) {
      setError('Camera is not ready. Please try again.');
      return;
    }

    try {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      if (canvas.width === 0 || canvas.height === 0) {
        setError('Video stream is not ready. Please try again.');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Canvas context failed. Please try again.');
        return;
      }

      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      setTempImage(imageData);
      setConfirmDialogOpen(true);
    } catch (captureError) {
      console.error('Capture error:', captureError);
      setError('Failed to capture photo. Please try again.');
      if (onError) onError(captureError);
    }
  };

  const confirmCapture = () => {
    if (tempImage) {
      setCapturedImage(tempImage);
      setConfirmDialogOpen(false);
      stopCamera();

      if (onCapture) {
        onCapture(tempImage);
      }
    }
  };

  const retakePhoto = () => {
    setTempImage(null);
    setConfirmDialogOpen(false);
    setError('');
  };

  const reset = () => {
    setCapturedImage(null);
    setTempImage(null);
    setError('');
    setReady(false);
    stopCamera();
  };

  useEffect(() => {
    if (autoStart && !cameraActive) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [autoStart, cameraActive]);

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CameraAltIcon />
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {capturedImage ? 'Photo captured successfully' : 'Position your face in the frame and click Capture'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!capturedImage ? (
        <Box>
          {cameraActive && ready ? (
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 2,
                  backgroundColor: '#000',
                  aspectRatio: '4/3',
                  mb: 2,
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Box
                    sx={{
                      width: '280px',
                      height: '350px',
                      border: '3px solid rgba(76, 175, 80, 0.6)',
                      borderRadius: '50%',
                      boxShadow: '0 0 20px rgba(76, 175, 80, 0.3) inset',
                    }}
                  />
                </Box>
              </Box>

              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CameraAltIcon />}
                  onClick={capturePhoto}
                  disabled={!ready}
                  size="large"
                >
                  📸 Capture Photo
                </Button>
                <Button
                  variant="outlined"
                  onClick={stopCamera}
                >
                  Close Camera
                </Button>
              </Stack>
            </Box>
          ) : (
            <Card sx={{ mb: 2, backgroundColor: '#f9fafb' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={40} />
                    <Typography color="text.secondary">
                      Initializing camera...
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CameraAltIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                    <Typography color="text.secondary">
                      Click below to start your camera
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {!cameraActive && !loading && (
            <Button
              variant="contained"
              onClick={startCamera}
              fullWidth
              size="large"
              startIcon={<CameraAltIcon />}
            >
              📷 Start Camera
            </Button>
          )}
        </Box>
      ) : (
        <Box>
          <Card sx={{ mb: 2, backgroundColor: '#f0f9ff', border: '2px solid #0ea5e9' }}>
            <CardContent>
              <Box
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 2,
                  backgroundColor: '#000',
                  aspectRatio: '4/3',
                  mb: 2,
                }}
              >
                <img
                  src={capturedImage}
                  alt="Captured"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircleIcon sx={{ color: 'success.main' }} />
                <Typography color="success.main" sx={{ fontWeight: 600 }}>
                  Photo captured successfully
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary">
                This photo will be used for visitor identification. Make sure your face is clearly visible.
              </Typography>
            </CardContent>
          </Card>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="success"
              onClick={() => onCapture && onCapture(capturedImage)}
              fullWidth
            >
              ✅ Use This Photo
            </Button>
            <Button
              variant="outlined"
              onClick={reset}
              fullWidth
              startIcon={<RefreshIcon />}
            >
              Retake
            </Button>
          </Stack>
        </Box>
      )}

      <Dialog
        open={confirmDialogOpen}
        onClose={retakePhoto}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Confirm Photo
            <IconButton onClick={retakePhoto} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 2,
              backgroundColor: '#000',
              aspectRatio: '4/3',
              mb: 2,
              mt: 2,
            }}
          >
            <img
              src={tempImage || ''}
              alt="Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />
          </Box>
          <Typography color="text.secondary">
            Does this photo look good? You can retake it if needed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={retakePhoto}>Retake</Button>
          <Button variant="contained" onClick={confirmCapture}>
            Confirm & Use
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}