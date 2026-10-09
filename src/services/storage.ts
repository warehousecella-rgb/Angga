import { ScanLogItem, AppSettings } from '../types';

const STORAGE_KEYS = {
  LOGS: 'hu_scan_validation_logs_v1',
  SETTINGS: 'hu_scan_validation_settings_v1',
  OPERATOR: 'hu_scan_active_operator_v1',
};

export const DEFAULT_GOOGLE_SHEET_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbyV-w06HB0qdZLxFvekZcH25rKFM7kcyxHcxL3J2VvlZG4RmhHtcPj8MjPuNyoSGmzHmQ/exec';

export const defaultSettings: AppSettings = {
  supervisorPassword: 'admin', // Default supervisor PIN/Password
  googleSheetWebhookUrl:
    ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_SHEET_WEBHOOK_URL) ||
    DEFAULT_GOOGLE_SHEET_WEBHOOK_URL,
  autoSaveOnMatch: true,
  soundEnabled: true,
  hapticEnabled: true,
  activeShift: 'Shift 1',
  mobileMenuPosition: 'side',
};

export const getSavedSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    // Kembalikan ke suara awal jika sebelumnya tersimpan suara terlampir warning-wife
    if (
      parsed.customMismatchAudioName === 'warning-wife.mp3'||
      parsed.customMismatchAudioName === 'Warning! Warning!'
    ) {
      delete parsed.customMismatchAudio;
      delete parsed.customMismatchAudioName;
    }
    // Jika googleSheetWebhookUrl kosong atau belum terisi, otomatis gunakan link default agar tidak lepas saat pembaharuan
    if (!parsed.googleSheetWebhookUrl || !parsed.googleSheetWebhookUrl.trim()) {
      parsed.googleSheetWebhookUrl = DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;
    }
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
};

export const getSavedLogs = (): ScanLogItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) return [];
    const parsed: ScanLogItem[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((l) => !l.syncedToGoogleSheet) : [];
  } catch {
    return [];
  }
};

export const saveLogs = (logs: ScanLogItem[]): void => {
  try {
    // Hanya simpan log yang belum tersinkron agar tidak membebani memori dan storage
    const pendingOnly = logs.filter((l) => !l.syncedToGoogleSheet);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(pendingOnly));
  } catch (err) {
    console.error('Failed to save logs to localStorage:', err);
  }
};

export const cleanShiftName = (shiftStr?: string): string => {
  if (!shiftStr) return 'Shift 1';
  // Hapus keterangan tambahan dalam kurung seperti (Pagi), (Sore), (Malam)
  const cleaned = shiftStr.replace(/\s*\([^)]*\)/g, '').trim();
  return cleaned || 'Shift 1';
};

export const parseOperatorAndShift = (
  rawName: string,
  explicitShift?: string
): { name: string; shift: string } => {
  if (explicitShift && explicitShift.trim()) {
    const cleanedName = rawName ? rawName.replace(/\s*\([^)]*\)$/, '').trim() : '-';
    return { name: cleanedName || rawName || '-', shift: cleanShiftName(explicitShift) };
  }

  if (!rawName) return { name: '-', shift: '-' };

  // Match: "Angga Susanto (Shift 1 (Pagi))" or "Angga (Shift 1)"
  const bracketMatch = rawName.match(/^(.*?)\s*\((Shift[^)]*|Non-Shift[^)]*|Regular[^)]*)\)$/i);
  if (bracketMatch) {
    return {
      name: bracketMatch[1].trim(),
      shift: cleanShiftName(bracketMatch[2]),
    };
  }

  // Match: "Angga - Shift 1"
  const dashMatch = rawName.match(/^(.*?)\s*[-–—]\s*(Shift.*|Non-Shift.*)$/i);
  if (dashMatch) {
    return {
      name: dashMatch[1].trim(),
      shift: cleanShiftName(dashMatch[2]),
    };
  }

  return {
    name: rawName.trim(),
    shift: 'Shift 1',
  };
};

export const getSavedOperator = (): { name: string; shift: string } => {
  try {
    const raw = sessionStorage.getItem('hu_scan_session_operator_v2');
    if (raw) {
      const data = JSON.parse(raw);
      return { name: data.name || '', shift: cleanShiftName(data.shift) };
    }
    const legacy = sessionStorage.getItem('hu_scan_session_operator');
    if (legacy) {
      return parseOperatorAndShift(legacy);
    }
  } catch {}
  return { name: '', shift: 'Shift 1' };
};

export const saveOperator = (name: string, shift: string = 'Shift 1'): void => {
  try {
    const cleanShift = cleanShiftName(shift);
    sessionStorage.setItem('hu_scan_session_operator_v2', JSON.stringify({ name, shift: cleanShift }));
    sessionStorage.setItem('hu_scan_session_operator', `${name} - ${cleanShift}`);
  } catch (err) {
    console.error('Failed to save operator name to session:', err);
  }
};

// Send log to Google Sheets Apps Script Webhook
export const syncLogToGoogleSheet = async (
  item: ScanLogItem,
  webhookUrl?: string
): Promise<{ success: boolean; error?: string }> => {
  const targetUrl = (webhookUrl && webhookUrl.trim()) ? webhookUrl.trim() : DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return { success: false, error: 'Google Sheet Webhook URL belum diatur di Pengaturan' };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, error: 'Offline - Koneksi internet terputus' };
  }

  try {
    const { name, shift } = parseOperatorAndShift(item.picName, item.shift);
    const cleanShift = cleanShiftName(shift);

    // Google Apps Script Webhook payload
    // Kolom H (kolom ke-8) di Spreadsheet dialokasikan untuk data Shift
    const payload = {
      id: item.id,
      timestamp: item.timestamp,
      picName: name,
      operatorName: name,
      hu1: item.hu1,
      hu2: item.hu2,
      status: item.status,
      notes: item.notes || '-',
      remark: item.notes || '-',
      shift: cleanShift,
    };

    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors', // Standard for Google Apps Script Webhooks to avoid CORS blocks in browsers
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // In no-cors mode, type is 'opaque', but if no network error was thrown, it succeeded
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Koneksi ke Google Sheets gagal';
    return { success: false, error: msg };
  }
};

// Export logs to CSV file for direct Google Drive / Excel upload (Kolom H adalah Shift)
export const exportLogsToCSV = (logs: ScanLogItem[]) => {
  if (!logs.length) return;
  const headers = ['ID', 'Waktu', 'Nama Operator', 'Scan HU 1', 'Scan HU 2', 'Status Validasi', 'Catatan / Remark', 'Shift'];
  const rows = logs.map((l) => {
    const { name, shift } = parseOperatorAndShift(l.picName, l.shift);
    const cleanShift = cleanShiftName(shift);
    return [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${name.replace(/"/g, '""')}"`,
      `"${l.hu1.replace(/"/g, '""')}"`,
      `"${l.hu2.replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${cleanShift.replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Log_Scan_HU_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
