import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLabel: string;
  onScanSuccess: (decodedText: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  targetLabel,
  onScanSuccess,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure DOM is mounted
    const timer = setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          'reader',
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            onScanSuccess(decodedText.trim());
            scanner.clear().catch(console.error);
            onClose();
          },
          () => {
            // Ignore scan attempt errors
          }
        );

        scannerRef.current = scanner;
      } catch (err) {
        console.error('Camera Scanner error:', err);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [isOpen, onScanSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Camera className="w-5 h-5 text-indigo-400" />
            <span>Kamera Pemindai ({targetLabel})</span>
          </div>
          <button
            onClick={() => {
              if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
              }
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center">
          <p className="text-xs text-slate-400 mb-3 text-center">
            Arahkan kamera ke Barcode / QR Code untuk {targetLabel}
          </p>
          <div id="reader" className="w-full overflow-hidden rounded-xl bg-black border border-slate-800"></div>
        </div>

        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};
