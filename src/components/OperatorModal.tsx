import React, { useState } from 'react';
import { Check, ShieldAlert } from 'lucide-react';
import { DSVLogo } from './DSVLogo';
import { parseOperatorAndShift } from '../services/storage';

interface OperatorModalProps {
  isOpen: boolean;
  currentName: string;
  currentShift?: string;
  onSave: (name: string, shift: string) => void;
  onClose?: () => void;
  canClose: boolean;
}

export const OperatorModal: React.FC<OperatorModalProps> = ({
  isOpen,
  currentName,
  currentShift,
  onSave,
  onClose,
  canClose,
}) => {
  const [name, setName] = useState(currentName || '');
  const [shift, setShift] = useState(currentShift || 'Shift 1');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      const parsed = parseOperatorAndShift(currentName, currentShift);
      setName(parsed.name === '-' ? '' : parsed.name);
      if (parsed.shift && parsed.shift !== '-') {
        setShift(parsed.shift);
      }
      setError('');
    }
  }, [isOpen, currentName, currentShift]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama operator / PIC wajib diisi sebelum mulai scan');
      return;
    }
    onSave(name.trim(), shift.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 relative">
        <div className="flex items-center gap-3 mb-4">
          <DSVLogo variant="badge" showTagline={true} />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          Identitas PIC / Operator
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Masukkan identitas operator agar seluruh riwayat pemindaian barcode tercatat akurat di database.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Nama Lengkap PIC
            </label>
            <input
              type="text"
              id="input-pic-name"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Contoh: Angga susanto "
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition"
            />
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Pilihan Shift Kerja
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
            >
              <option value="Shift 1">Shift 1</option>
              <option value="Shift 2">Shift 2</option>
              <option value="Shift 3">Shift 3</option>
              <option value="Non-Shift">Non-Shift / Regular</option>
            </select>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              id="btn-save-operator"
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Lanjutkan</span>
            </button>
          </div>
        </form>

        {!canClose && (
          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-amber-400/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Sistem mewajibkan identitas operator sebelum pemindaian.</span>
          </div>
        )}
      </div>
    </div>
  );
};
