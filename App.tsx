
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Shield, Lock, Info, Terminal, Search, Loader2, Image as ImageIcon, Sparkles, Upload, Zap, Bug, Activity, Globe, MapPin, History, ShieldAlert, Mail, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsQR from 'jsqr';
import CameraScanner from './components/CameraScanner';
import SecurityReport from './components/SecurityReport';
import AntivirusEngine from './components/AntivirusEngine';
import Login from './components/Login';
import { analyzeUrlSafety } from './services/geminiService';
import { SafetyStatus, ScanResult } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem('shieldqr_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [status, setStatus] = useState<SafetyStatus>(SafetyStatus.SCANNING);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [lastMaliciousResult, setLastMaliciousResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoginSuccess = (userData: { name: string; email: string }) => {
    localStorage.setItem('shieldqr_session', JSON.stringify(userData));
    setUser(userData);
  };

  // Auth state is managed locally now
  const handleLogout = () => {
    localStorage.removeItem('shieldqr_session');
    setUser(null);
    resetScanner();
  };

  // Auto-trigger antivirus if malicious or phishing status is detected
  useEffect(() => {
    if (status === SafetyStatus.MALICIOUS || status === SafetyStatus.PHISHING) {
      const timer = setTimeout(() => {
        setStatus(SafetyStatus.NEUTRALIZING);
      }, 3000); // Increased delay to allow user to see forensics dashboard
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleScan = useCallback(async (url: string) => {
    if (!url || status !== SafetyStatus.SCANNING || !isScannerReady) return;
    
    // Prevent accidental triggers from noise or empty scans
    if (url.trim().length < 3) return;

    console.log("QR Code Detected:", url);
    setStatus(SafetyStatus.ANALYZING);
    const result = await analyzeUrlSafety(url);
    setScanResult(result);
    if (result.status === SafetyStatus.MALICIOUS || result.status === SafetyStatus.PHISHING) {
      setLastMaliciousResult(result);
    }
    setStatus(result.status);
  }, [status]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File Upload Triggered");
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            handleScan(code.data);
          } else {
            alert("Artifact Error: No valid QR signature found.");
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const simulateMaliciousScan = async () => {
    console.log("Simulating Malicious Scan...");
    setStatus(SafetyStatus.ANALYZING);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockMaliciousResult: ScanResult = {
      url: "https://secure-login-v3.forex-update-mumbai.biz/verify?id=9283",
      status: SafetyStatus.PHISHING,
      riskScore: 99,
      reasoning: "CRITICAL: Credentials harvesting phishing node. Detected domain impersonation and urgent scam keywords. Known to inject 'Trojan.JS.Redirector' into system temp files on visit.",
      recommendation: "DO NOT enter any credentials. Close the tab immediately and report this URL to your IT security department.",
      threatType: "Advanced Malware & Phishing",
      forensics: {
        ipAddress: "103.224.182.210",
        latitude: 19.0760,
        longitude: 72.8777,
        requestedPermissions: ["Camera", "Geolocation", "Microphone", "Storage Write Access"],
        hostingProvider: "Shadow-Hosting-Global-Biz"
      }
    };
    
    setScanResult(mockMaliciousResult);
    setLastMaliciousResult(mockMaliciousResult);
    setStatus(SafetyStatus.PHISHING);
  };

  const resetScanner = () => {
    setScanResult(null);
    setIsScannerReady(false);
    setStatus(SafetyStatus.SCANNING);
  };

  const triggerEmailReport = async () => {
    if (!scanResult) return;
    const recipient = "sp.cbr-mah@gov.in";
    const subject = "URGENT: Malicious QR Code Reported - Cyber Fraud Investigation";
    
    const forensicsData = scanResult.forensics ? `
--- DEEP FORENSIC ARTIFACTS ---
Server IP Address: ${scanResult.forensics.ipAddress}
Geo-Location: Lat ${scanResult.forensics.latitude}, Long ${scanResult.forensics.longitude}
Hijacked System Permissions: ${scanResult.forensics.requestedPermissions.join(", ")}
Hosting Provider: ${scanResult.forensics.hostingProvider || "Unknown / Obfuscated"}
` : "";

    const body = `To
The Cyber Crime Cell,

Respected Sir/Madam,

I am writing to formally report a case involving a malicious and fraudulent QR code that poses a serious cybersecurity and financial risk to the public.

Recently, I encountered a QR code that was presented as legitimate; however, upon scanning it, the QR code redirected to a suspicious source and attempted to install malicious software / virus on the device. The QR code appears to have been intentionally created and distributed to deceive users, potentially leading to data theft, financial fraud, or unauthorized access to personal information.

--- SCAN DATA (FOR INVESTIGATION) ---
Scanned URL: ${scanResult.url}
Identified Threat: ${scanResult.threatType || 'Malicious Redirection'}
Risk Index: ${scanResult.riskScore}/100
Gemini AI Analysis: ${scanResult.reasoning}
${forensicsData}
------------------------------------

Such malicious QR codes are extremely dangerous, as they exploit public trust and can easily affect unsuspecting users. I believe this activity falls under cyber fraud and malware distribution, which requires immediate investigation to prevent further harm.

I kindly request the Cyber Crime Department to investigate this incident and take appropriate legal action against the individuals or groups responsible for creating and spreading this malicious QR code. I am willing to provide any additional details or evidence required to support the investigation.

Thank you for your time and efforts in ensuring cyber safety.

Yours sincerely,
Rushikesh Nanaware`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    try {
      if (isMobile) {
        window.location.href = mailtoUrl;
      } else {
        const newWindow = window.open(gmailUrl, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Popup blocked, fallback to mailto
          window.location.href = mailtoUrl;
        }
      }
    } catch (e) {
      // Fallback to clipboard if everything fails
      try {
        await navigator.clipboard.writeText(body);
        alert("Forensic report copied to clipboard. Please paste it into your email app.");
      } catch (clipboardError) {
        alert("Could not open email app. Please report manually to sp.cbr-mah@gov.in");
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#070707] text-zinc-100 selection:bg-green-500/30 flex flex-col font-sans">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <nav className="p-6 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#070707]/80 backdrop-blur-2xl z-50">
        <div className="flex items-center gap-3">
          <div className={`${status === SafetyStatus.MALICIOUS || status === SafetyStatus.PHISHING || status === SafetyStatus.NEUTRALIZING ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]'} p-2 rounded-xl transition-colors`}>
            <Shield className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter uppercase italic">
              Shield<span className={status === SafetyStatus.MALICIOUS || status === SafetyStatus.PHISHING || status === SafetyStatus.NEUTRALIZING ? 'text-red-500' : 'text-green-500'}>QR</span>
            </h1>
            <div className="flex items-center gap-1.5 text-[8px] font-bold text-zinc-500 tracking-[0.2em]">
              <Activity className="w-2 h-2 text-red-500" /> SYSTEM OPS MONITORING
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-zinc-900/50 rounded-2xl border border-white/5">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <User size={12} className="text-green-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{user.email?.split('@')[0]}</span>
            <div className="w-px h-3 bg-white/10"></div>
            <button 
              onClick={handleLogout}
              className="text-zinc-500 hover:text-red-400 transition-colors"
              title="Terminate Session"
            >
              <LogOut size={14} />
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 rounded-full border border-white/10 text-[10px] font-bold text-zinc-400">
            <Lock className="w-3 h-3 text-green-500" /> END-TO-END SECURITY
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-5xl mx-auto px-6 py-8 md:py-16 w-full relative">
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {status === SafetyStatus.SCANNING && (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-10"
              >
                <div className="text-center mb-12 space-y-6">
                  <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter">
                    Deep Neural <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                      Virus Protection.
                    </span>
                  </h2>
                  <p className="text-zinc-500 max-w-xl mx-auto text-sm md:text-lg leading-relaxed">
                    Advanced forensic scanning for QR artifacts. Detects malware, phishing, and dormant system threats before execution.
                  </p>
                </div>

                {isScannerReady ? (
                  <CameraScanner active={true} onScan={handleScan} />
                ) : (
                  <div className="max-w-md mx-auto aspect-square bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center space-y-6 group hover:border-green-500/30 transition-all cursor-pointer" onClick={() => setIsScannerReady(true)}>
                    <div className="p-6 bg-zinc-800 rounded-full group-hover:bg-green-500/10 transition-all">
                      <Zap className="w-12 h-12 text-zinc-600 group-hover:text-green-500 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">Scanner Offline</h3>
                      <p className="text-sm text-zinc-500">Initialize neural link to begin forensic scan.</p>
                    </div>
                    <button className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                      Initialize Neural Link
                    </button>
                  </div>
                )}

                {/* Persisted Forensics for the Last Neutralized Threat */}
                {lastMaliciousResult?.forensics && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md mx-auto bg-red-500/5 border border-red-500/20 rounded-[2rem] p-6 backdrop-blur-md shadow-2xl"
                  >
                     <div className="flex items-center justify-between mb-4 border-b border-red-500/10 pb-3">
                        <div className="flex items-center gap-2 text-red-500">
                          <History size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Recent Threat Neutralized</span>
                        </div>
                        <div className="px-2 py-0.5 bg-red-500 text-[8px] font-black rounded text-white animate-pulse">CLEANED</div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 text-left">
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Web IP Address</p>
                          <div className="flex items-center gap-2 text-zinc-200">
                            <Globe size={14} className="text-red-400" />
                            <p className="text-xs font-mono">{lastMaliciousResult.forensics.ipAddress}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Web Geolocation</p>
                          <div className="flex items-center gap-2 text-zinc-200">
                            <MapPin size={14} className="text-red-400" />
                            <p className="text-xs font-mono">
                              {lastMaliciousResult.forensics.latitude.toFixed(2)}°N, {lastMaliciousResult.forensics.longitude.toFixed(2)}°E
                            </p>
                          </div>
                        </div>
                     </div>
                     
                     <div className="mt-4 pt-3 border-t border-red-500/10">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Compromised Permissions Target</p>
                        <div className="flex flex-wrap gap-1.5">
                          {lastMaliciousResult.forensics.requestedPermissions.map((p, i) => (
                            <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 bg-zinc-800 border border-white/5 rounded text-zinc-400">{p}</span>
                          ))}
                        </div>
                     </div>
                  </motion.div>
                )}
                
                <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-1 text-center md:text-left">
                      <h3 className="text-lg font-bold">Threat Neutralization Lab</h3>
                      <p className="text-sm text-zinc-500">Scan suspect downloads or simulate attacks.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center gap-4">
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                      <button onClick={() => fileInputRef.current?.click()} className="group flex items-center gap-2 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-2xl transition-all font-bold active:scale-[0.98]">
                        <ImageIcon className="w-5 h-5 text-green-500" /> Gallery Forensics
                      </button>
                      <button onClick={simulateMaliciousScan} className="group flex items-center gap-2 px-8 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl transition-all font-bold text-red-400 active:scale-[0.98]">
                        <Bug className="w-5 h-5" /> Test Attack
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {status === SafetyStatus.ANALYZING && (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 space-y-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 blur-[100px] rounded-full animate-pulse"></div>
                  <Loader2 className="w-24 h-24 text-green-500 animate-spin" />
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-center">Neural Inspection In Progress...</h2>
              </motion.div>
            )}

            {status === SafetyStatus.NEUTRALIZING && (
              <motion.div
                key="neutralizing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
              >
                <AntivirusEngine onComplete={() => {
                  setStatus(SafetyStatus.REPORTING);
                }} />
              </motion.div>
            )}

            {status === SafetyStatus.REPORTING && (
              <motion.div
                key="reporting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto text-center space-y-8 py-12"
              >
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full animate-pulse"></div>
                  <div className="relative bg-zinc-900 border-2 border-red-500/50 p-8 rounded-[3rem] shadow-2xl">
                    <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-6" />
                    <h2 className="text-4xl font-black tracking-tighter mb-4">Threat Neutralized.</h2>
                    <p className="text-zinc-400 text-lg max-w-md mx-auto leading-relaxed">
                      The malicious payload has been isolated. To prevent further attacks, we must report this forensic data to the Cyber Crime Cell.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={triggerEmailReport}
                    className="group flex items-center gap-3 px-10 py-5 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-all font-black text-lg shadow-[0_0_30px_rgba(239,68,68,0.3)] active:scale-95"
                  >
                    <Mail className="w-6 h-6" /> Finalize & Send Report
                  </button>
                  <button 
                    onClick={resetScanner}
                    className="px-10 py-5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-2xl transition-all font-bold text-zinc-400 active:scale-95"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="pt-8 border-t border-white/5">
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <Lock size={12} /> Encrypted Forensic Handover Protocol
                  </p>
                </div>
              </motion.div>
            )}

            {(status === SafetyStatus.SAFE || status === SafetyStatus.MALICIOUS || status === SafetyStatus.PHISHING || status === SafetyStatus.SUSPICIOUS || status === SafetyStatus.ERROR) && scanResult && (
              <motion.div
                key="report"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SecurityReport 
                  result={scanResult} 
                  onReset={resetScanner} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 text-center bg-black/40 backdrop-blur-md">
        <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em] font-black">
          ShieldQR Neural Security Core • Authorized Forensic Unit
        </p>
      </footer>
    </div>
  );
};

export default App;
