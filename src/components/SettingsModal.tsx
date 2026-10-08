import React, { useState } from 'react';
import { X, Save, Key, Database, Volume2, HelpCircle, Check, Copy, Smartphone, Columns, Rows } from 'lucide-react';
import { AppSettings } from '../types';
import { sounds } from '../services/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [copiedCode, setCopiedCode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const appsScriptTemplate = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Pastikan Header ada di baris 1 jika sheet baru kosong
    // Susunan Kolom:
    // Kolom A = ID
    // Kolom B = Timestamp / Waktu
    // Kolom C = Nama Operator
    // Kolom D = Scan HU 1
    // Kolom E = Scan HU 2
    // Kolom F = Status
    // Kolom G = Remark / Catatan
    // Kolom H = Shift (Keterangan Shift Kerja)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["ID", "Timestamp", "Nama Operator", "Scan HU 1", "Scan HU 2", "Status", "Remark / Catatan", "Shift"]);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#e2e8f0");
    }
    
    // Periksa header untuk pemetaan kolom otomatis (minimal 8 kolom A s/d H)
    var lastCol = Math.max(sheet.getLastColumn(), 8);
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    // Jika Kolom H di baris 1 masih kosong, otomatis beri judul 'Shift'
    if (!headers[7] || headers[7].toString().trim() === "") {
      sheet.getRange(1, 8).setValue("Shift");
      headers[7] = "Shift";
    }
    
    var row = [];
    for (var i = 0; i < headers.length; i++) {
      var h = (headers[i] || "").toString().toLowerCase().trim();
      var colNumber = i + 1; // 1 = A, 2 = B, 3 = C, ..., 7 = G, 8 = H
      
      // Kolom H (kolom ke-8) atau kolom dengan kata kunci 'shift'
      if (colNumber === 8 || h.indexOf("shift") !== -1) {
        row.push(data.shift || "-");
      } else if (h.indexOf("id") !== -1 && h.indexOf("validasi") === -1) {
        row.push(data.id || "-");
      } else if (h.indexOf("time") !== -1 || h.indexOf("waktu") !== -1 || h.indexOf("tanggal") !== -1) {
        row.push(data.timestamp || "-");
      } else if (h.indexOf("operator") !== -1 || h.indexOf("pic") !== -1 || h.indexOf("nama") !== -1) {
        row.push(data.picName || data.operatorName || "-");
      } else if (h.indexOf("hu 1") !== -1 || h.indexOf("hu1") !== -1) {
        row.push(data.hu1 || "-");
      } else if (h.indexOf("hu 2") !== -1 || h.indexOf("hu2") !== -1) {
        row.push(data.hu2 || "-");
      } else if (h.indexOf("status") !== -1) {
        row.push(data.status || "-");
      } else if (h.indexOf("remark") !== -1 || h.indexOf("catatan") !== -1 || h.indexOf("note") !== -1) {
        row.push(data.notes || data.remark || "-");
      } else if (colNumber === 1) {
        row.push(data.id || "-");
      } else if (colNumber === 2) {
        row.push(data.timestamp || "-");
      } else if (colNumber === 3) {
        row.push(data.picName || data.operatorName || "-");
      } else if (colNumber === 4) {
        row.push(data.hu1 || "-");
      } else if (colNumber === 5) {
        row.push(data.hu2 || "-");
      } else if (colNumber === 6) {
        row.push(data.status || "-");
      } else if (colNumber === 7) {
        row.push(data.notes || data.remark || "-");
      } else {
        row.push("-");
      }
    }
    
    // Pastikan baris minimal sampai Kolom H (8 kolom)
    while (row.length < 8) {
      if (row.length === 7) {
        row.push(data.shift || "-");
      } else {
        row.push("-");
      }
    }
    
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyScript = () => {
    navigator.clipboard.writeText(appsScriptTemplate);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Pengaturan Sistem & Database
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          {/* Supervisor Password */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <Key className="w-4 h-4" />
              <span>Keamanan Supervisor</span>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Password Supervisor (Untuk Membuka Kunci Saat Terjadi Mismatch)
              </label>
              <input
                type="text"
                value={formData.supervisorPassword}
                onChange={(e) => setFormData({ ...formData, supervisorPassword: e.target.value })}
                placeholder="Default: admin"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Password ini wajib dimasukkan operator jika HU 1 dan HU 2 tidak cocok.
              </p>
            </div>
          </div>

          {/* Sound & Feedback Testing */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
              <Volume2 className="w-4 h-4" />
              <span>Audio & Notifikasi Suara Device</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="font-medium text-white">Aktifkan Efek Suara</span>
                <p className="text-xs text-slate-400">Bunyi saat scan berhasil, matching, dan alarm peringatan mismatch.</p>
              </div>
              <input
                type="checkbox"
                checked={formData.soundEnabled}
                onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Test Audio Buttons */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => sounds.playScanBeep()}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition"
              >
                Tes Beep Scan
              </button>
              <button
                type="button"
                onClick={() => sounds.playMatchSuccess()}
                className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 rounded-lg text-xs font-medium transition"
              >
                Tes Suara MATCH
              </button>
              <button
                type="button"
                onClick={() => sounds.playMismatchAlert()}
                className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-medium transition"
              >
                Tes Alarm MISMATCH
              </button>
            </div>
          </div>

          {/* Mobile Menu Layout Options */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
              <Smartphone className="w-4 h-4" />
              <span>Tata Letak Menu Mobile (Smartphone)</span>
            </div>
            <p className="text-xs text-slate-400">
              Pilih posisi tombol menu (PIC Operator, Suara, Pengaturan) pada tampilan layar HP/mobile:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, mobileMenuPosition: 'side' })}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition ${
                  (formData.mobileMenuPosition || 'side') === 'side'
                    ? 'bg-indigo-950/30 border-indigo-500/80 ring-1 ring-indigo-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-xs">
                    <Columns className="w-3.5 h-3.5 text-indigo-400" />
                    Di Samping Status HU 1
                  </span>
                  {(formData.mobileMenuPosition || 'side') === 'side' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  )}
                </div>
                <span className="text-[11px] text-slate-400 leading-snug">
                  Menu sejajar horizontal di samping kanan teks "Menunggu Scan HU 1" (hemat ruang vertikal).
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, mobileMenuPosition: 'bottom' })}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition ${
                  formData.mobileMenuPosition === 'bottom'
                    ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-xs">
                    <Rows className="w-3.5 h-3.5 text-emerald-400" />
                    Di Bawah Status HU 1
                  </span>
                  {formData.mobileMenuPosition === 'bottom' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <span className="text-[11px] text-slate-400 leading-snug">
                  Status "Menunggu Scan HU 1" tampil penuh di atas, dan tombol menu tertata rapi di baris bawahnya.
                </span>
              </button>
            </div>
          </div>

          {/* Google Sheets Integration */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                <Database className="w-4 h-4" />
                <span>Status & Integrasi Google Sheets</span>
              </div>
              <div>
                {formData.googleSheetWebhookUrl ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Status: Terhubung & Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    Status: Belum Terhubung
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Google Apps Script Webhook URL
              </label>
              <input
                type="url"
                value={formData.googleSheetWebhookUrl}
                onChange={(e) => setFormData({ ...formData, googleSheetWebhookUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {formData.googleSheetWebhookUrl
                  ? 'Setiap pemindaian sukses atau mismatch akan otomatis terkirim langsung ke Spreadsheet.'
                  : 'Masukkan Webhook URL Google Apps Script untuk mengaktifkan pencatatan otomatis ke Spreadsheet Google Drive.'}
              </p>
            </div>

            {/* Guide to setup Google Sheets */}
            <details className="mt-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <summary className="p-3 font-semibold text-slate-300 cursor-pointer hover:text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  Cara Menghubungkan ke Google Sheet (3 Langkah Mudah)
                </span>
                <span className="text-[11px] text-indigo-400">Buka Panduan</span>
              </summary>
              <div className="p-3 border-t border-slate-800 space-y-2.5 text-slate-300">
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                  <li>Buat Spreadsheet baru di <b>Google Drive / Google Sheets</b>.</li>
                  <li>Klik menu <b>Ekstensi</b> &gt; <b>Apps Script</b>.</li>
                  <li>Hapus kode bawaan dan tempel kode script di bawah ini.</li>
                  <li>Klik tombol <b>Deploy</b> (Terapkan) &gt; <b>Deployment Baru</b> &gt; Pilih Jenis: <b>Aplikasi Web</b>.</li>
                  <li>Akses: Pilih <b>Siapa saja (Anyone)</b> lalu klik Deploy dan salin URL Web App ke kolom di atas.</li>
                </ol>

                <div className="relative mt-2">
                  <pre className="bg-slate-950 p-3 rounded-lg text-[10px] text-slate-300 font-mono overflow-x-auto border border-slate-800 max-h-36">
                    {appsScriptTemplate}
                  </pre>
                  <button
                    type="button"
                    onClick={copyScript}
                    className="absolute top-2 right-2 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-medium flex items-center gap-1 shadow"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Disalin!' : 'Salin Script'}</span>
                  </button>
                </div>
              </div>
            </details>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            id="btn-save-settings"
            className="px-5 py-2 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
