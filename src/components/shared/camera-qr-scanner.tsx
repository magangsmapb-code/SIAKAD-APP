"use client";

import * as React from "react";
import { Camera, RefreshCw, Zap, ZapOff, CheckCircle2, AlertCircle, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CameraQrScannerProps {
  onScanSuccess: (scannedText: string) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  autoCloseOnSuccess?: boolean;
}

export function CameraQrScanner({
  onScanSuccess,
  onClose,
  title = "Pemindai Kamera QR & Barcode",
  description = "Arahkan kamera ke QR Code atau Barcode presensi yang ditampilkan guru.",
  autoCloseOnSuccess = true,
}: CameraQrScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isScanning, setIsScanning] = React.useState<boolean>(false);
  const [facingMode, setFacingMode] = React.useState<"environment" | "user">("environment");
  const [hasTorch, setHasTorch] = React.useState<boolean>(false);
  const [torchOn, setTorchOn] = React.useState<boolean>(false);
  const [lastScanned, setLastScanned] = React.useState<string | null>(null);
  const scanLoopRef = React.useRef<number | null>(null);

  // Play synthetic audio beep using Web Audio API
  const playBeep = React.useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  const streamRef = React.useRef<MediaStream | null>(null);

  // Initialize and clean up Camera Stream
  const initCamera = React.useCallback(async () => {
    setErrorMsg(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Perangkat atau peramban tidak mendukung akses kamera web.");
      }

      // Stop previous stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }

      // Check torch support
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
      setHasTorch(Boolean(capabilities?.torch));
    } catch (err: any) {
      setIsScanning(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Izin kamera ditolak. Harap izinkan akses kamera di pengaturan browser Anda.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMsg("Tidak ada modul kamera yang terdeteksi pada perangkat ini.");
      } else {
        setErrorMsg(err.message || "Gagal membuka kamera.");
      }
    }
  }, [facingMode]);

  // Clean-up camera on unmount or facingMode change
  React.useEffect(() => {
    initCamera();

    return () => {
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [initCamera]);

  // Handle Torch Toggle
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as any],
        });
        setTorchOn(nextState);
      } catch {
        // Torch constraint error
      }
    }
  };

  // Flip Camera
  const switchCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Scanner detection loop
  React.useEffect(() => {
    let active = true;

    const runScanner = async () => {
      if (!active || !videoRef.current || videoRef.current.readyState < 2) {
        scanLoopRef.current = requestAnimationFrame(runScanner);
        return;
      }

      // Check if native BarcodeDetector API is available
      if ("BarcodeDetector" in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ["qr_code", "code_128", "code_39", "ean_13"],
          });
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const codeValue = barcodes[0].rawValue;
            if (codeValue && codeValue !== lastScanned) {
              setLastScanned(codeValue);
              playBeep();
              onScanSuccess(codeValue);
              if (autoCloseOnSuccess && onClose) {
                onClose();
              }
              return;
            }
          }
        } catch {
          // Fallback or next frame
        }
      }

      // Throttle next scan to ~100ms
      setTimeout(() => {
        if (active) {
          scanLoopRef.current = requestAnimationFrame(runScanner);
        }
      }, 100);
    };

    scanLoopRef.current = requestAnimationFrame(runScanner);

    return () => {
      active = false;
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    };
  }, [playBeep, onScanSuccess, autoCloseOnSuccess, onClose, lastScanned]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-950 text-white shadow-2xl border border-slate-800">
      {/* Header bar */}
      <div className="flex items-center justify-between p-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold leading-none">{title}</p>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{description}</p>
          </div>
        </div>

        {onClose && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Video Viewfinder Frame */}
      <div className="relative aspect-[4/3] w-full max-h-[360px] bg-black flex items-center justify-center overflow-hidden">
        {errorMsg ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="rounded-full bg-red-500/10 p-3 text-red-400 border border-red-500/20">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-xs text-red-300 max-w-xs">{errorMsg}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={initCamera}
              className="text-xs border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Coba Buka Ulang Kamera
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {/* Target Reticle Overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-48 w-48 sm:h-56 sm:w-56 rounded-2xl border-2 border-blue-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                {/* Laser scan bar */}
                <div className="animate-scan-laser" />

                {/* Reticle Corner Accents */}
                <div className="absolute -top-1 -left-1 h-5 w-5 border-t-4 border-l-4 border-blue-400 rounded-tl-md" />
                <div className="absolute -top-1 -right-1 h-5 w-5 border-t-4 border-r-4 border-blue-400 rounded-tr-md" />
                <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-blue-400 rounded-bl-md" />
                <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-blue-400 rounded-br-md" />
              </div>
            </div>

            {/* Floating Live Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-medium backdrop-blur-md border border-white/10 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Kamera Aktif</span>
            </div>
          </>
        )}
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between p-3 bg-slate-900/90 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={switchCamera}
            className="text-xs h-8 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {facingMode === "environment" ? "Kamera Depan" : "Kamera Belakang"}
          </Button>

          {hasTorch && (
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleTorch}
              className={`text-xs h-8 ${torchOn ? "text-amber-400 bg-amber-400/10" : "text-slate-300 hover:bg-slate-800"}`}
            >
              {torchOn ? <Zap className="mr-1.5 h-3.5 w-3.5" /> : <ZapOff className="mr-1.5 h-3.5 w-3.5" />}
              {torchOn ? "Flash Nyala" : "Flash"}
            </Button>
          )}
        </div>

        {/* Demo Simulator Helper (For desktop environments without QR printed) */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const demoToken = String(Math.floor(100000 + Math.random() * 900000));
            playBeep();
            setLastScanned(demoToken);
            onScanSuccess(demoToken);
            if (autoCloseOnSuccess && onClose) onClose();
          }}
          className="text-xs h-8 border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:text-blue-100"
        >
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-blue-400" />
          Simulasi Scan QR
        </Button>
      </div>
    </div>
  );
}
