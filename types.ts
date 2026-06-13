
export enum SafetyStatus {
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  SAFE = 'SAFE',
  SUSPICIOUS = 'SUSPICIOUS',
  PHISHING = 'PHISHING',
  MALICIOUS = 'MALICIOUS',
  NEUTRALIZING = 'NEUTRALIZING',
  REPORTING = 'REPORTING',
  ERROR = 'ERROR'
}

export interface ScanResult {
  url: string;
  status: SafetyStatus;
  riskScore: number;
  reasoning: string;
  recommendation?: string;
  threatType?: string;
  forensics?: {
    ipAddress: string;
    latitude: number;
    longitude: number;
    requestedPermissions: string[];
    hostingProvider?: string;
  };
}

export interface SystemFile {
  name: string;
  size: string;
  status: 'INFECTED' | 'CLEAN' | 'QUARANTINED';
  type: string;
}

declare global {
  interface Window {
    jsQR: any;
  }
}
