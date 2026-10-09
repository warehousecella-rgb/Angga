import React from 'react';
import { User, Settings, Database, Volume2, VolumeX, WifiOff } from 'lucide-react';
import { AppSettings, ScanStep } from '../types';
import { DSVLogo } from './DSVLogo';
import { cleanShiftName } from '../services/storage';

interface NavbarProps {
  picName: string;
  activeShift?: string;
  onChangePic: () => void;
  onOpenSettings: () => void;
  settings: AppSettings;
  onToggleSound: () => void;
  syncCount: { total: number; synced: number };
  step?: ScanStep;
  onToggleMobileMenuPosition?: (pos: 'side' | 'bottom') => void;
  isOnline?: boolean;
  reconnectCountdown?: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  picName,
  activeShift,
  onChangePic,
  onOpenSettings,
  settings,
  onToggleSound,
  syncCount,
  isOnline = true,
  reconnectCountdown = null,
}) => {
  // Operator PIC Action Button
  const renderPicButton = (compact = false) => {
    if (picName) {
      return (
        <button
          onClick={onChangePic}
          id="btn-operator-profile"
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors shadow-sm shrink-0"
          title="Klik untuk ganti PIC / Operator"
        >
          <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
            <User className="w-3 h-3" />
          </div>
          <div className="flex items-center gap-1.5 text-slate-100 font-semibold">
            <span
              className={`${
                compact ? 'max-w-[80px] sm:max-w-[130px]' : 'max-w-[130px] sm:max-w-[200px]'
              } truncate`}
            >
              {picName}
            </span>
            {activeShift && (
              <>
                <span className="text-slate-400 font-normal">-</span>
                <span className="text-indigo-300 font-medium whitespace-nowrap text-[11px] sm:text-xs">
                  {cleanShiftName(activeShift)}
                </span>
              </>
            )}
          </div>
          <span className="text-[10px] text-slate-400 underline ml-0.5">Ganti</span>
        </button>
      );
    }

    return (
      <button
        onClick={onChangePic}
        id="btn-set-operator"
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-colors shrink-0"
      >
        <User className="w-3.5 h-3.5" />
        <span>{compact ? 'Nama PIC' : 'Masukkan Nama PIC'}</span>
      </button>
    );
  };

  // Sound Toggle Button
  const renderSoundButton = () => (
    <button
      onClick={onToggleSound}
      id="btn-toggle-sound"
      className={`p-2 rounded-lg border text-xs transition-colors shrink-0 ${
        settings.soundEnabled
          ? 'bg-slate-800 text-indigo-400 border-slate-700 hover:bg-slate-750'
          : 'bg-slate-850 text-slate-500 border-slate-800 hover:text-slate-300'
      }`}
      title={settings.soundEnabled ? 'Suara Aktif' : 'Suara Dimatikan'}
    >
      {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
    </button>
  );

  // Settings Button
  const renderSettingsButton = (compact = false) => (
    <button
      onClick={onOpenSettings}
      id="btn-open-settings"
      className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm shrink-0"
      title="Buka Pengaturan"
    >
      <Settings className="w-3.5 h-3.5" />
      {!compact && <span className="hidden sm:inline">Pengaturan</span>}
    </button>
  );

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* DESKTOP & TABLET VIEW (sm and up) */}
        <div className="hidden sm:flex items-center justify-between gap-3">
          {/* Brand & Dynamic Live Status */}
          <div className="flex items-center gap-3.5">
            <DSVLogo variant="badge" showTagline={true} />
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight leading-tight">
                System Validasi HU
              </h1>
            </div>
          </div>

          {/* Desktop Action Controls */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {renderPicButton(false)}

            {/* Cloud Sync Status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                !isOnline
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : reconnectCountdown !== null && reconnectCountdown > 0
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 animate-pulse'
                  : settings.googleSheetWebhookUrl
                  ? 'bg-slate-800/80 border-slate-700 text-emerald-400'
                  : 'bg-slate-800/50 border-slate-800 text-slate-400'
              }`}
              title={
                !isOnline
                  ? 'Koneksi terputus (Offline). Data tersimpan lokal & auto sync saat koneksi kembali.'
                  : reconnectCountdown !== null && reconnectCountdown > 0
                  ? `Koneksi stabil kembali, sinkronisasi otomatis dalam ${reconnectCountdown} detik`
                  : settings.googleSheetWebhookUrl
                  ? `Google Sheets terhubung (${syncCount.synced}/${syncCount.total} sinkron)`
                  : 'Google Sheets belum dikonfigurasi'
              }
            >
              {!isOnline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[11px]">Offline</span>
                </>
              ) : reconnectCountdown !== null && reconnectCountdown > 0 ? (
                <>
                  <Database className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span className="text-[11px]">Stabilizing ({reconnectCountdown}s)</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span className="text-[11px]">
                    {settings.googleSheetWebhookUrl ? (
                      <span>Sheets Active ({syncCount.synced}/{syncCount.total})</span>
                    ) : (
                      <span>Sheets Off</span>
                    )}
                  </span>
                </>
              )}
            </div>

            {renderSoundButton()}
            {renderSettingsButton(false)}
          </div>
        </div>

        {/* MOBILE VIEW (smaller than sm) */}
        <div className="flex sm:hidden flex-col gap-2">
          {/* Top Bar: Brand Logo & Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <DSVLogo variant="badge" showTagline={false} className="py-1 px-2.5" />
              <div>
                <h1 className="font-bold text-sm text-white tracking-tight leading-tight">
                  System Validasi HU
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">DSV Logistics Hub</p>
              </div>
            </div>
          </div>

          {/* Mobile Action Controls */}
          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
            <div className="flex-1 min-w-0">
              {renderPicButton(false)}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Sheets indicator */}
              <div
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium shrink-0 ${
                  !isOnline
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    : reconnectCountdown !== null && reconnectCountdown > 0
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 animate-pulse'
                    : settings.googleSheetWebhookUrl
                    ? 'bg-slate-800/80 border-slate-700 text-emerald-400'
                    : 'bg-slate-800/50 border-slate-800 text-slate-400'
                }`}
                title={
                  !isOnline
                    ? 'Koneksi terputus (Offline)'
                    : reconnectCountdown !== null && reconnectCountdown > 0
                    ? `Sinkronisasi otomatis dalam ${reconnectCountdown} detik`
                    : settings.googleSheetWebhookUrl
                    ? `Google Sheets terhubung (${syncCount.synced}/${syncCount.total} sinkron)`
                    : 'Google Sheets belum dikonfigurasi'
                }
              >
                {!isOnline ? (
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                ) : reconnectCountdown !== null && reconnectCountdown > 0 ? (
                  <Database className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                ) : (
                  <Database className="w-3.5 h-3.5" />
                )}
                <span className="text-[10px] font-mono">
                  {reconnectCountdown !== null && reconnectCountdown > 0 ? (
                    `${reconnectCountdown}s`
                  ) : !isOnline ? (
                    'Off'
                  ) : (
                    `${syncCount.synced}/${syncCount.total}`
                  )}
                </span>
              </div>

              {renderSoundButton()}
              {renderSettingsButton(true)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


