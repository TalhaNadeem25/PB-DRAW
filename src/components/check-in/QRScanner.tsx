import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Camera, CameraSlash, ArrowsHorizontal, Keyboard, CheckCircle, XCircle, Scan } from '@phosphor-icons/react';

interface QRScannerProps {
  onScanSuccess: (ticketCode: string) => void;
  onScanError?: (error: string) => void;
  isScanning?: boolean;
}

export default function QRScanner({ onScanSuccess, onScanError, isScanning = false }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraId, setCameraId] = useState<string>('');
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-scanner-container';

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const cameraDevices = devices.map((device) => ({
            id: device.id,
            label: device.label || `Camera ${device.id}`,
          }));
          setCameras(cameraDevices);
          // Default to back camera if available, otherwise first camera
          const backCamera = cameraDevices.find((cam) =>
            cam.label.toLowerCase().includes('back') || cam.label.toLowerCase().includes('rear')
          );
          setCameraId(backCamera?.id || cameraDevices[0].id);
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err);
        setScanMessage({ type: 'error', text: 'Could not access camera. Please check permissions.' });
      });

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!cameraId) {
      setScanMessage({ type: 'error', text: 'No camera available' });
      return;
    }

    try {
      html5QrCodeRef.current = new Html5Qrcode(scannerDivId);

      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Success callback
          try {
            // Try to parse JSON (format: { ticketCode, paymentId, type })
            const data = JSON.parse(decodedText);
            if (data.ticketCode && data.type === 'tournament-ticket') {
              handleSuccessfulScan(data.ticketCode);
            } else {
              setScanMessage({ type: 'error', text: 'Invalid ticket QR code format' });
            }
          } catch {
            // If not JSON, treat as plain ticket code
            handleSuccessfulScan(decodedText);
          }
        },
        (errorMessage) => {
          // Error callback (scanning errors, not critical)
          // Don't display these as they happen frequently during scanning
        }
      );

      setScanning(true);
      setScanMessage(null);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setScanMessage({ type: 'error', text: err.message || 'Failed to start camera' });
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const handleSuccessfulScan = (ticketCode: string) => {
    // Visual and haptic feedback
    setScanMessage({ type: 'success', text: `Scanned: ${ticketCode}` });

    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    // Play success sound (optional)
    const audio = new Audio('/sounds/scan-success.mp3');
    audio.play().catch(() => {
      // Ignore audio errors
    });

    // Call parent callback
    onScanSuccess(ticketCode);

    // Clear message after 3 seconds
    setTimeout(() => {
      setScanMessage(null);
    }, 3000);
  };

  const switchCamera = async () => {
    if (cameras.length < 2) return;

    const currentIndex = cameras.findIndex((cam) => cam.id === cameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    // Stop current scanning
    await stopScanning();

    // Switch camera
    setCameraId(nextCamera.id);

    // Restart with new camera
    setTimeout(() => {
      startScanning();
    }, 100);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleSuccessfulScan(manualCode.trim());
      setManualCode('');
      setManualEntry(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="w-5 h-5 text-green-600" />
          QR Code Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scanner Container */}
        <div className="relative">
          <div
            id={scannerDivId}
            className={`
              rounded-lg overflow-hidden border-4
              ${scanning ? 'border-green-500' : 'border-gray-300'}
              ${!scanning && 'bg-gray-100 min-h-[300px] flex items-center justify-center'}
            `}
          >
            {!scanning && (
              <div className="text-center text-gray-500 p-8">
                <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-sm">Camera not active</p>
                <p className="text-xs mt-2">Click "Start Scanner" to begin</p>
              </div>
            )}
          </div>

          {/* Scan overlay animation */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-2 border-green-500 rounded-lg animate-pulse" />
            </div>
          )}
        </div>

        {/* Scan Message */}
        {scanMessage && (
          <Alert variant={scanMessage.type === 'success' ? 'default' : 'destructive'}>
            <div className="flex items-center gap-2">
              {scanMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <AlertDescription>{scanMessage.text}</AlertDescription>
            </div>
          </Alert>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {!scanning ? (
            <Button
              onClick={startScanning}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isScanning}
            >
              <Camera className="w-4 h-4 mr-2" />
              Start Scanner
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="outline"
              className="flex-1"
            >
              <CameraSlash className="w-4 h-4 mr-2" />
              Stop Scanner
            </Button>
          )}

          {scanning && cameras.length > 1 && (
            <Button
              onClick={switchCamera}
              variant="outline"
              size="icon"
            >
              <ArrowsHorizontal className="w-4 h-4" />
            </Button>
          )}

          <Button
            onClick={() => setManualEntry(!manualEntry)}
            variant="outline"
            size="icon"
          >
            <Keyboard className="w-4 h-4" />
          </Button>
        </div>

        {/* Manual Entry */}
        {manualEntry && (
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter ticket code manually"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 font-mono"
                autoFocus
              />
              <Button type="submit" disabled={!manualCode.trim() || isScanning}>
                Submit
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Use this if the QR code is damaged or unreadable
            </p>
          </form>
        )}

        {/* Camera Info */}
        {cameras.length > 0 && (
          <div className="text-xs text-gray-500 text-center">
            Using: {cameras.find((cam) => cam.id === cameraId)?.label || 'Unknown camera'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
