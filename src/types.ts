export interface ScanLogItem {
  id: string;
  timestamp: string;
  picName: string;
  shift?: string;
  hu1: string;
  hu2: string;
  status: 'MATCH' | 'MISMATCH';
  syncedToGoogleSheet: boolean;
  notes?: string;
}

export interface AppSettings {
  supervisorPassword: string;
  googleSheetWebhookUrl: string;
  autoSaveOnMatch: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  activeShift: string;
  mobileMenuPosition?: 'side' | 'bottom';
}

export type ScanStep = 'IDLE' | 'HU1_READY' | 'HU2_READY' | 'VALIDATING' | 'MATCH_PROMPT' | 'MISMATCH_LOCKED';
