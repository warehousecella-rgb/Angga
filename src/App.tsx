import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Camera,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ScanLogItem, AppSettings, ScanStep } from './types';
import {
  getSavedSettings,
  saveSettings,
  getSavedLogs,
  saveLogs,
  saveOperator,
  syncLogToGoogleSheet,
  cleanShiftName,
} from './services/storage';
import { sounds } from './services/audio';

import { Navbar } from './components/Navbar';
import { CameraScannerModal } from './components/CameraScannerModal';
import { MatchModal } from './components/MatchModal';
import { MismatchLockModal } from './components/MismatchLockModal';
import { SettingsModal } from './components/SettingsModal';
import { OperatorModal } from './components/OperatorModal';
import { LogTable } from './components/LogTable';

export const App: React.FC = () => {
  // Application State
  const [picName, setPicName] = useState<string>('');
  const [activeShift, setActiveShift] = useState<string>('Shift 1');
  const [settings, setSettings] = useState<AppSettings>(getSavedSettings());
  const [logs, setLogs] = useState<ScanLogItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Scan Values & Flow
  const [hu1Value, setHu1Value] = useState<string>('');
  const [hu2Value, setHu2Value] = useState<string>('');
  const [step, setStep] = useState<ScanStep>('HU1_READY');

  // Modals
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [cameraScanTarget, setCameraScanTarget] = useState<'HU1' | 'HU2' | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState<boolean>(false);
  const [isMismatchModalOpen, setIsMismatchModalOpen] = useState<boolean>(false);

  // Input references for auto-focus
  const hu1InputRef = useRef<HTMLInputElement>(null);
  const hu2InputRef = useRef<HTMLInputElement>(null);

  // Initial Load: Setiap kali link/aplikasi dibuka wajib input nama operator
  useEffect(() => {
    const savedLogs = getSavedLogs();
    const savedSet = getSavedSettings();

    setSettings(savedSet);
    sounds.setCustomMismatchAudio(savedSet.customMismatchAudio || null);
    setLogs(savedLogs);
    setPicName('');

    // Wajib tampilkan popup input nama operator setiap kali link dibuka
    setIsOperatorModalOpen(true);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    saveSettings(settings);
    sounds.setCustomMismatchAudio(settings.customMismatchAudio || null);
    if (!settings.soundEnabled) {
      sounds.stopContinuousMismatchAlert();
    }
  }, [settings]);

  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  // Clean up continuous alarm when mismatch modal closes
  useEffect(() => {
    if (!isMismatchModalOpen) {
      sounds.stopContinuousMismatchAlert();
    }
  }, [isMismatchModalOpen]);

  // Focus Helper
  const focusHU1 = () => {
    setTimeout(() => {
      if (hu1InputRef.current) {
        hu1InputRef.current.focus();
        hu1InputRef.current.select();
      }
    }, 100);
  };

  const focusHU2 = () => {
    setTimeout(() => {
      if (hu2InputRef.current) {
        hu2InputRef.current.focus();
        hu2InputRef.current.select();
      }
    }, 100);
  };

  // Triggered when HU 1 is entered or scanned
  const handleHU1Submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = hu1Value.trim();

    if (!picName) {
      setIsOperatorModalOpen(true);
      return;
    }

    if (!trimmed) {
      hu1InputRef.current?.focus();
      return;
    }

    if (settings.soundEnabled) {
      sounds.playScanBeep();
    }

    setStep('HU2_READY');
    focusHU2();
  };

  // Triggered when HU 2 is entered or scanned
  const handleHU2Submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val1 = hu1Value.trim();
    const val2 = hu2Value.trim();

    if (!picName) {
      setIsOperatorModalOpen(true);
      return;
    }

    if (!val1) {
      focusHU1();
      return;
    }

    if (!val2) {
      focusHU2();
      return;
    }

    // Perform validation comparison
    if (val1 === val2) {
      // MATCH
      setStep('MATCH_PROMPT');

      if (settings.soundEnabled) {
        sounds.playMatchSuccess();
      }

      setIsMatchModalOpen(true);
    } else {
      // MISMATCH
      setStep('MISMATCH_LOCKED');

      if (settings.soundEnabled) {
        sounds.startContinuousMismatchAlert();
      }

      setIsMismatchModalOpen(true);
    }
  };

  // Save Matched Result and Reset Cursor to HU 1
  const handleConfirmMatchSave = async () => {
    const currentShiftClean = cleanShiftName(activeShift) || 'Shift 1';
    const newItem: ScanLogItem = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleString('id-ID', { hour12: false }),
      picName: picName || 'Operator',
      shift: currentShiftClean,
      hu1: hu1Value.trim(),
      hu2: hu2Value.trim(),
      status: 'MATCH',
      syncedToGoogleSheet: false,
      notes: 'Validasi Berhasil (Match)',
    };

    // Update local state
    const updatedLogs = [newItem, ...logs];
    setLogs(updatedLogs);
    setIsMatchModalOpen(false);

    // Reset inputs
    setHu1Value('');
    setHu2Value('');
    setStep('HU1_READY');

    // Auto move cursor back to HU 1
    focusHU1();

    // Async sync to Google Sheets if configured
    if (settings.googleSheetWebhookUrl) {
      try {
        const res = await syncLogToGoogleSheet(newItem, settings.googleSheetWebhookUrl);
        if (res.success) {
          setLogs((prev) =>
            prev.map((l) => (l.id === newItem.id ? { ...l, syncedToGoogleSheet: true } : l))
          );
        }
      } catch (err) {
        console.error('Auto sync error:', err);
      }
    }
  };

  // Supervisor Override: Record Mismatch Log and Reset to HU 1
  const handleLogMismatchAndReset = async () => {
    sounds.stopContinuousMismatchAlert();
    if (settings.soundEnabled) {
      sounds.playUnlockTone();
    }
    const currentShiftClean = cleanShiftName(activeShift) || 'Shift 1';
    const newItem: ScanLogItem = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleString('id-ID', { hour12: false }),
      picName: picName || 'Operator',
      shift: currentShiftClean,
      hu1: hu1Value.trim(),
      hu2: hu2Value.trim(),
      status: 'MISMATCH',
      syncedToGoogleSheet: false,
      notes: 'Supervisor Override Mismatch',
    };

    const updatedLogs = [newItem, ...logs];
    setLogs(updatedLogs);
    setIsMismatchModalOpen(false);

    // Reset inputs
    setHu1Value('');
    setHu2Value('');
    setStep('HU1_READY');
    focusHU1();

    if (settings.googleSheetWebhookUrl) {
      try {
        const res = await syncLogToGoogleSheet(newItem, settings.googleSheetWebhookUrl);
        if (res.success) {
          setLogs((prev) =>
            prev.map((l) => (l.id === newItem.id ? { ...l, syncedToGoogleSheet: true } : l))
          );
        }
      } catch (err) {
        console.error('Mismatch sync error:', err);
      }
    }
  };

  // Sync all unsynced logs to Google Sheets
  const handleResyncAll = async () => {
    if (!settings.googleSheetWebhookUrl) {
      setIsSettingsModalOpen(true);
      return;
    }

    setIsSyncing(true);
    const unsynced = logs.filter((l) => !l.syncedToGoogleSheet);

    for (const item of unsynced) {
      const res = await syncLogToGoogleSheet(item, settings.googleSheetWebhookUrl);
      if (res.success) {
        setLogs((prev) =>
          prev.map((l) => (l.id === item.id ? { ...l, syncedToGoogleSheet: true } : l))
        );
      }
    }
    setIsSyncing(false);
  };

  // Camera scan callback
  const handleCameraScanSuccess = (val: string) => {
    if (cameraScanTarget === 'HU1') {
      setHu1Value(val);
      if (settings.soundEnabled) sounds.playScanBeep();
      setStep('HU2_READY');
      focusHU2();
    } else if (cameraScanTarget === 'HU2') {
      setHu2Value(val);
      if (settings.soundEnabled) sounds.playScanBeep();

      // Trigger verification
      if (hu1Value.trim() === val.trim()) {
        setStep('MATCH_PROMPT');
        if (settings.soundEnabled) sounds.playMatchSuccess();
        setIsMatchModalOpen(true);
      } else {
        setStep('MISMATCH_LOCKED');
        if (settings.soundEnabled) sounds.startContinuousMismatchAlert();
        setIsMismatchModalOpen(true);
      }
    }
    setCameraScanTarget(null);
  };

  const syncedCount = logs.filter((l) => l.syncedToGoogleSheet).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        picName={picName}
        activeShift={activeShift}
        onChangePic={() => setIsOperatorModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        settings={settings}
        onToggleSound={() =>
          setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
        }
        syncCount={{ total: logs.length, synced: syncedCount }}
        step={step}
        onToggleMobileMenuPosition={(pos) =>
          setSettings((prev) => ({ ...prev, mobileMenuPosition: pos }))
        }
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Verification Hero Panel */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Background */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Dual Scan Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 relative">
            {/* HU 1 Input Card */}
            <div
              className={`rounded-xl p-3.5 sm:p-4 border-2 transition-all relative flex flex-col justify-between ${
                step === 'HU1_READY'
                  ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-800 bg-slate-950/60 opacity-90'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[11px] font-black flex items-center justify-center">
                    1
                  </span>
                  <label htmlFor="input-hu1" className="text-xs sm:text-sm font-bold text-white">
                    Scan Barcode HU 1
                  </label>
                  <button
                    type="submit"
                    form="form-hu1"
                    onClick={handleHU1Submit}
                    id="btn-submit-hu1"
                    className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 transition cursor-pointer shadow-sm ml-1"
                  >
                    <span>Lanjut</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                {hu1Value && (
                  <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Terpindai
                  </span>
                )}
              </div>

              <form id="form-hu1" onSubmit={handleHU1Submit} className="space-y-2.5">
                <div className="relative">
                  <input
                    ref={hu1InputRef}
                    id="input-hu1"
                    type="text"
                    value={hu1Value}
                    onChange={(e) => setHu1Value(e.target.value)}
                    placeholder="Scan atau ketik kode HU 1..."
                    className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-400 rounded-lg px-3.5 py-2.5 text-sm sm:text-base font-mono font-bold text-white placeholder-slate-500 focus:outline-none transition shadow-inner pr-11"
                    autoComplete="off"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCameraScanTarget('HU1');
                    }}
                    className="absolute right-1.5 top-1.5 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 border border-slate-700 transition"
                    title="Buka Scanner Kamera"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* HU 2 Input Card */}
            <div
              className={`rounded-xl p-3.5 sm:p-4 border-2 transition-all relative flex flex-col justify-between ${
                step === 'HU2_READY'
                  ? 'border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-500/10'
                  : step === 'MISMATCH_LOCKED'
                  ? 'border-rose-500 bg-rose-950/20'
                  : 'border-slate-800 bg-slate-950/60 opacity-90'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
                      step === 'HU2_READY'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    2
                  </span>
                  <label htmlFor="input-hu2" className="text-xs sm:text-sm font-bold text-white">
                    Scan Barcode HU 2
                  </label>
                  <button
                    type="submit"
                    form="form-hu2"
                    onClick={handleHU2Submit}
                    id="btn-submit-hu2"
                    disabled={!hu1Value || !hu2Value}
                    className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-sm ml-1"
                  >
                    <span>Validasi</span>
                    <Sparkles className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {hu2Value && (
                    <span
                      className={`text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                        hu1Value === hu2Value
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      }`}
                    >
                      {hu1Value === hu2Value ? 'Matching' : 'Mismatch!'}
                    </span>
                  )}
                  {(hu1Value || hu2Value) && (
                    <button
                      type="button"
                      onClick={() => {
                        setHu1Value('');
                        setHu2Value('');
                        setStep('HU1_READY');
                        focusHU1();
                      }}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition text-xs px-1.5 py-0.5 rounded hover:bg-slate-800"
                      title="Reset pemindaian"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden xs:inline">Reset</span>
                    </button>
                  )}
                </div>
              </div>

              <form id="form-hu2" onSubmit={handleHU2Submit} className="space-y-2.5">
                <div className="relative">
                  <input
                    ref={hu2InputRef}
                    id="input-hu2"
                    type="text"
                    value={hu2Value}
                    onChange={(e) => setHu2Value(e.target.value)}
                    placeholder={
                      hu1Value
                        ? 'Scan kode HU 2 untuk validasi...'
                        : 'Scan HU 1 terlebih dahulu...'
                    }
                    disabled={!hu1Value}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-3.5 py-2.5 text-sm sm:text-base font-mono font-bold text-white placeholder-slate-500 focus:outline-none transition shadow-inner pr-11"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCameraScanTarget('HU2');
                    }}
                    disabled={!hu1Value}
                    className="absolute right-1.5 top-1.5 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-amber-400 hover:text-amber-300 border border-slate-700 transition"
                    title="Buka Scanner Kamera"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Real-time Log Table */}
        <LogTable
          logs={logs}
          onClearLogs={() => setLogs([])}
          onResyncAll={handleResyncAll}
          isSyncing={isSyncing}
        />
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-900 text-center text-xs text-slate-500 font-medium">
        Application Web Powered by Angga Susanto
      </footer>

      {/* Operator Name Initial / Change Modal */}
      <OperatorModal
        isOpen={isOperatorModalOpen}
        currentName={picName}
        currentShift={activeShift}
        canClose={Boolean(picName)}
        onClose={() => setIsOperatorModalOpen(false)}
        onSave={(name, shift) => {
          setPicName(name);
          setActiveShift(shift);
          saveOperator(name, shift);
          setIsOperatorModalOpen(false);
          focusHU1();
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings);
        }}
      />

      {/* Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={Boolean(cameraScanTarget)}
        targetLabel={cameraScanTarget === 'HU1' ? 'HU 1' : 'HU 2'}
        onClose={() => setCameraScanTarget(null)}
        onScanSuccess={handleCameraScanSuccess}
      />

      {/* Matching Success Dialog (OK to Save) */}
      <MatchModal
        isOpen={isMatchModalOpen}
        hu1={hu1Value}
        hu2={hu2Value}
        onConfirmSave={handleConfirmMatchSave}
      />

      {/* Mismatch Locked Dialog (Requires Supervisor Password) */}
      <MismatchLockModal
        isOpen={isMismatchModalOpen}
        hu1={hu1Value}
        hu2={hu2Value}
        correctPassword={settings.supervisorPassword}
        onLogMismatchAndReset={handleLogMismatchAndReset}
      />
    </div>
  );
};

export default App;
