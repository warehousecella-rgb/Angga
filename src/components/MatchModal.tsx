import React from 'react';
import { CheckCircle2, Save, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MatchModalProps {
  isOpen: boolean;
  hu1: string;
  hu2: string;
  onConfirmSave: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  isOpen,
  hu1,
  hu2,
  onConfirmSave,
}) => {
  React.useEffect(() => {
    if (isOpen) {
      // Trigger subtle celebration burst
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#6366f1', '#38bdf8'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-emerald-500/60 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/10 p-6 text-center transform transition-all scale-100">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          Status: MATCHING / SESUAI
        </span>

        <h3 className="text-xl font-bold text-white mt-3 mb-1">
          Validasi Scan Berhasil!
        </h3>
        <p className="text-sm text-slate-400 mb-5">
          Scan HU ke-1 dan HU ke-2 terbukti sama dan identik.
        </p>

        {/* Value comparison preview */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 mb-6 text-left space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">HU 1:</span>
            <span className="font-mono font-bold text-emerald-400 truncate max-w-[200px]">{hu1}</span>
          </div>
          <div className="h-px bg-slate-800" />
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">HU 2:</span>
            <span className="font-mono font-bold text-emerald-400 truncate max-w-[200px]">{hu2}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onConfirmSave}
          autoFocus
          id="btn-confirm-matching-save"
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
        >
          <Save className="w-5 h-5" />
          <span>OK, Simpan ke Database</span>
          <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
        </button>
        <p className="text-[11px] text-slate-500 mt-2">
          Tekan <b>Enter</b> atau klik OK untuk simpan dan mulai scan berikutnya.
        </p>
      </div>
    </div>
  );
};
