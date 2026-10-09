import React, { useState } from 'react';
import {
  Download,
  Trash2,
  Search,
  RefreshCw,
  Clock,
  Check,
  WifiOff,
} from 'lucide-react';
import { ScanLogItem } from '../types';
import { exportLogsToCSV, parseOperatorAndShift } from '../services/storage';

interface LogTableProps {
  logs: ScanLogItem[];
  onClearLogs: () => void;
  onResyncAll: () => void;
  isSyncing: boolean;
  isOnline?: boolean;
  reconnectCountdown?: number | null;
}

export const LogTable: React.FC<LogTableProps> = ({
  logs,
  onClearLogs,
  onResyncAll,
  isSyncing,
  isOnline = true,
  reconnectCountdown = null,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MATCH' | 'MISMATCH'>('ALL');

  // Hanya data yang masih proses pending yang ditampilkan dalam list tabel
  const pendingLogs = logs.filter((log) => !log.syncedToGoogleSheet);
  const pendingCount = pendingLogs.length;

  const filteredLogs = pendingLogs.filter((log) => {
    const { name: opName, shift: opShift } = parseOperatorAndShift(log.picName, log.shift);
    const matchesSearch =
      log.hu1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.hu2.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.picName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opShift.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Antrean Log Pemindaian (Pending)
          </h2>
          {(!isOnline || (reconnectCountdown !== null && reconnectCountdown > 0)) && (
            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
              {!isOnline && (
                <span className="inline-flex items-center gap-1 font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                  <WifiOff className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Offline (Tersimpan Lokal)</span>
                </span>
              )}
              {reconnectCountdown !== null && reconnectCountdown > 0 && (
                <span className="inline-flex items-center gap-1 font-medium text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-300 shrink-0" />
                  <span>Koneksi kembali stabil, sinkron otomatis dalam {reconnectCountdown} dtk...</span>
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor HU, PIC, atau ID..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('MATCH')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'MATCH' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Match
            </button>
            <button
              onClick={() => setStatusFilter('MISMATCH')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'MISMATCH' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mismatch
            </button>
          </div>

          {/* Export CSV for Drive / Excel */}
          <button
            onClick={() => exportLogsToCSV(pendingLogs)}
            disabled={pendingLogs.length === 0}
            id="btn-export-csv"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            title="Download file CSV antrean log pending"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Resync with Google Sheets */}
          <button
            onClick={onResyncAll}
            disabled={isSyncing || pendingCount === 0}
            id="btn-resync-sheets"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isSyncing
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 cursor-wait'
                : reconnectCountdown !== null && reconnectCountdown > 0
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 animate-pulse'
                : !isOnline
                ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                : pendingCount > 0
                ? 'bg-indigo-600/25 hover:bg-indigo-600/35 text-indigo-200 border border-indigo-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            }`}
            title={
              isSyncing
                ? 'Sedang menyinkronkan data ke Google Sheets...'
                : reconnectCountdown !== null && reconnectCountdown > 0
                ? `Koneksi stabil kembali. Sinkronisasi otomatis dalam jeda ${reconnectCountdown} detik (atau klik sekarang).`
                : !isOnline
                ? 'Koneksi terputus (Offline). Data tersimpan lokal & akan otomatis disinkronkan 3 detik setelah koneksi stabil.'
                : pendingCount > 0
                ? `${pendingCount} data pending. Klik untuk sinkronisasi manual atau tunggu otomatis.`
                : 'Semua data telah tersinkron ke Spreadsheet.'
            }
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span className="hidden sm:inline">Menyinkronkan...</span>
                <span className="sm:hidden">Sync...</span>
              </>
            ) : reconnectCountdown !== null && reconnectCountdown > 0 ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span className="hidden sm:inline">Auto Sync ({reconnectCountdown}s)</span>
                <span className="sm:hidden">{reconnectCountdown}s</span>
              </>
            ) : !isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Offline ({pendingCount})</span>
                <span className="sm:hidden">Offline</span>
              </>
            ) : pendingCount > 0 ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">Auto Sync ({pendingCount})</span>
                <span className="sm:hidden">Sync ({pendingCount})</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Tersinkron Otomatis</span>
                <span className="sm:hidden">Tersinkron</span>
              </>
            )}
          </button>

          {/* Clear Logs */}
          <button
            onClick={() => {
              if (pendingLogs.length && confirm('Hapus daftar antrean log yang belum tersinkron?')) {
                onClearLogs();
              }
            }}
            disabled={pendingLogs.length === 0}
            className="p-1.5 rounded-xl bg-slate-850 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 border border-slate-850 hover:border-rose-900/50 text-xs transition disabled:opacity-30 cursor-pointer"
            title="Hapus antrean log pending"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Waktu & ID</th>
              <th className="py-2.5 px-3">Operator</th>
              <th className="py-2.5 px-3">Scan HU 1</th>
              <th className="py-2.5 px-3">Scan HU 2</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-center">G-Sheet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                  {pendingCount === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-slate-300 text-xs">
                        Tidak ada antrean log pending. Semua data telah tersinkron ke Spreadsheet.
                      </span>
                    </div>
                  ) : (
                    'Tidak ada data antrean log pending yang sesuai dengan filter pencarian.'
                  )}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const { name: operatorName, shift: operatorShift } = parseOperatorAndShift(
                  log.picName,
                  log.shift
                );
                return (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-sans text-slate-300 font-medium">{log.timestamp.slice(11)}</div>
                      <div className="text-[9px] text-slate-500">{log.timestamp.slice(0, 10)} · {log.id}</div>
                    </td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-200" title={`Shift: ${operatorShift}`}>
                      {operatorName}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold max-w-[140px] truncate" title={log.hu1}>
                      {log.hu1}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-bold max-w-[140px] truncate ${
                        log.status === 'MATCH' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                      title={log.hu2}
                    >
                      {log.hu2}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {log.status === 'MATCH' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          MATCH
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          MISMATCH
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {isSyncing ? (
                        <span
                          className="inline-flex items-center gap-1 text-indigo-300 font-sans text-[10px] bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-500/30"
                          title="Sedang proses sinkronisasi ke Spreadsheet..."
                        >
                          <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin shrink-0" />
                          <span>Sinkron...</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-amber-400/90 font-sans text-[10px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20"
                          title="Menunggu proses sinkronisasi otomatis ke Google Spreadsheet"
                        >
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
