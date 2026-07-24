'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export function BarcodeScanner({
  open,
  onDetected,
  onClose,
}: {
  open: boolean;
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setError(null);
    setStarting(true);

    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, _err, controls) => {
        controlsRef.current = controls;
        if (cancelled) return;
        setStarting(false);
        if (result) {
          controls.stop();
          onDetected(result.getText());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('カメラを起動できませんでした。カメラの利用を許可してください。');
          setStarting(false);
        }
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [open, onDetected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm font-medium">バーコードをかざしてください</span>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        {starting && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner className="size-8 text-white" />
          </div>
        )}
        {!error && !starting && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-64 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-white/80" />
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center text-white">
            <p className="text-sm">{error}</p>
            <Button variant="secondary" onClick={onClose}>
              閉じる
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
