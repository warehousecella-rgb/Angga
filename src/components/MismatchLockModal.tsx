import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lock, KeyRound, XCircle, FileText } from 'lucide-react';

interface MismatchLockModalProps {
  isOpen: boolean;
  hu1: string;
  hu2: string;
  correctPassword: string;
  onLogMismatchAndReset: () => void;
}

export const MismatchLockModal: React.FC<MismatchLockModalProps> = ({
  isOpen,
  hu1,
  hu2,
  correctPassword,
  onLogMismatchAndReset,
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg('');
      setAttempts(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Masukkan password supervisor terlebih dahulu');
      return;
    }

    if (password === correctPassword) {
      setErrorMsg('');
      setPassword('');
      setAttempts(0);
      onLogMismatchAndReset();
    } else {
      setAttempts((prev) => prev + 1);
      setErrorMsg('Password supervisor salah! Akses ditolak.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn">
      <div className="bg-slate-900 border-2 border-rose-500/80 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl shadow-rose-500/20 p-6 sm:p-7 relative text-slate-100 animate-pulse-ring">
        {/* Warning Badge */}
        <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/40">
          <AlertTriangle className="w-10 h-10 animate-bounce" />
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40 mb-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Alarm Mismatch Berbunyi</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Sistem Terkunci (Mismatch)!
          </h2>
          <p className="text-sm text-rose-300/90 mt-1 max-w-sm mx-auto">
            Scan HU 1 dan HU 2 <b>BERBEDA</b>. Masukkan password Supervisor untuk mencatat data mismatch ke log dan mereset sesi scan.
          </p>
        </div>

        {/* Differences detail */}
        <div className="bg-slate-950/90 rounded-xl p-4 border border-rose-900/50 mb-6 space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-semibold">Scan HU 1:</span>
              <span className="text-emerald-400 font-mono text-[10px]">Data Pertama</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-sm font-bold text-white border border-slate-800 break-all select-all">
              {hu1 || '<Kosong>'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-semibold text-rose-400">Scan HU 2 (Berbeda!):</span>
              <span className="text-rose-400 font-mono text-[10px]">Data Kedua</span>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-950/40 font-mono text-sm font-bold text-rose-300 border border-rose-800/60 break-all select-all">
              {hu2 || '<Kosong>'}
            </div>
          </div>
        </div>

        {/* Supervisor Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              Password Otorisasi Supervisor
            </label>
            <div className="relative">
              <input
                type="password"
                id="input-supervisor-password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Masukkan password supervisor..."
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              />
              <div className="absolute right-3 top-3 text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            {errorMsg && (
              <p className="text-xs text-rose-400 font-medium mt-1.5 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                {errorMsg} {attempts > 1 && `(Percobaan ke-${attempts})`}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="btn-confirm-log-mismatch"
              className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Verifikasi & Catat Log Mismatch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
