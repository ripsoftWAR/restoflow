import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Download,
  X,
  Smartphone,
  Share2,
  Monitor,
  Tablet,
  ExternalLink,
  Check,
  ChevronDown,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
};

const isAndroid = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia('(display-mode: standalone)');
  if (mq.matches) return true;
  if ('standalone' in navigator && (navigator as any).standalone === true) return true;
  return false;
};

// ─── Types ──────────────────────────────────────────────────────────────────
interface InstallPWAProps {
  variant?: 'sidebar' | 'topbar' | 'mobile-header';
  compact?: boolean;
}

type InstallMode = 'native' | 'ios-guide' | 'apk' | 'none';

// ─── Component ──────────────────────────────────────────────────────────────
export default function InstallPWA({ variant = 'sidebar', compact = false }: InstallPWAProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installMode, setInstallMode] = useState<InstallMode>('none');
  const [nativeOK, setNativeOK] = useState(false);
  const [apkAvailable, setApkAvailable] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Detect install state ──────────────────────────────────────────────────
  useEffect(() => {
    if (isStandalone() || window.__pwaInstalled) {
      setIsInstalled(true);
      return;
    }

    // Check if native prompt is available (from global listener in main.tsx)
    if (window.__deferredPWAInstall) {
      setNativeOK(true);
    }

    // Listen for late-arriving prompt
    const handler = () => setNativeOK(true);
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setNativeOK(false);
    });

    // Determine fallback mode
    if (isIOS()) {
      setInstallMode('ios-guide');
    } else if (isAndroid()) {
      setInstallMode('apk');
    } else {
      // Desktop browser
      setInstallMode('native'); // akan fallback ke APK kalau ga support
    }

    // Check if APK is available on server
    fetch('/api/app/version')
      .then(r => r.json())
      .then(data => {
        if (data.file_name && data.file_size > 0) {
          setApkAvailable(true);
        }
      })
      .catch(() => setApkAvailable(false));

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // ── Update install mode when native becomes available ─────────────────────
  useEffect(() => {
    if (nativeOK) {
      setInstallMode('native');
    }
  }, [nativeOK]);

  // ── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNativeInstall = useCallback(async () => {
    const prompt = window.__deferredPWAInstall;
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        window.__pwaInstalled = true;
        window.__deferredPWAInstall = null;
        setNativeOK(false);
      }
      setIsOpen(false);
    }
  }, []);

  const handleIOSGuide = useCallback(() => {
    setShowIOSGuide(true);
    setIsOpen(false);
  }, []);

  const handleDownloadAPK = useCallback(() => {
    window.open('/apk/restoflow-kasir-v1.0.0.apk', '_blank');
    setIsOpen(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // ── Don't render if already installed or dismissed ───────────────────────
  if (isInstalled || dismissed) return null;

  // ── Determine what to show ────────────────────────────────────────────────
  const canNative = nativeOK && !isIOS();
  const canIOS = isIOS();
  const canAPK = apkAvailable;

  // ═══════════════════════════════════════════════════════════════════════════
  // iOS Guide Modal
  // ═══════════════════════════════════════════════════════════════════════════
  if (showIOSGuide) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/40 z-[100] animate-in fade-in duration-200"
          onClick={() => setShowIOSGuide(false)}
        />
        <div className="fixed bottom-0 inset-x-0 z-[101] bg-white rounded-t-[20px] px-6 pt-6 pb-8 animate-in slide-in-from-bottom duration-300 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] safe-area-bottom">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[16px] font-semibold text-[#171717] tracking-[-0.01em]">
              Pasang RestoFlow di iOS
            </h3>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center hover:bg-[#E5E5E5] transition-colors"
            >
              <X size={16} className="text-[#737373]" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-[#5B5BED] w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Smartphone size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#171717]">
                  Tambahkan ke Layar Utama
                </p>
                <p className="text-[13px] text-[#737373] mt-1">
                  RestoFlow akan terpasang seperti aplikasi native — lebih cepat, full screen, dan bisa diakses offline.
                </p>
              </div>
            </div>

            <div className="bg-[#FAFAFA] rounded-xl p-4 border border-[#F5F5F5] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#5B5BED] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">1</div>
                <p className="text-[13px] text-[#525252]">
                  Tap tombol <span className="font-semibold"><Share2 size={14} className="inline align-middle text-[#5B5BED]" /> Share</span> di browser Safari
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#5B5BED] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">2</div>
                <p className="text-[13px] text-[#525252]">
                  Scroll dan pilih <span className="font-semibold text-[#171717]">"Add to Home Screen"</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#5B5BED] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">3</div>
                <p className="text-[13px] text-[#525252]">
                  Tap <span className="font-semibold text-[#171717]">"Add"</span> — selesai!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 rounded-xl bg-[#F5F5F5] text-[13px] font-medium text-[#737373] hover:bg-[#E5E5E5] transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Compact mode — icon only, opens dropdown
  // ═══════════════════════════════════════════════════════════════════════════
  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Pasang aplikasi"
          title="Pasang RestoFlow"
          className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#F3F3FF] text-[#5B5BED] hover:bg-[#E8E7FF] transition-colors"
        >
          <Download size={18} strokeWidth={2} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-[#F5F5F5] shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
            <InstallDropdownContent
              canNative={canNative}
              canIOS={canIOS}
              canAPK={canAPK}
              onNativeInstall={handleNativeInstall}
              onIOSGuide={handleIOSGuide}
              onDownloadAPK={handleDownloadAPK}
              onDismiss={handleDismiss}
            />
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Sidebar variant
  // ═══════════════════════════════════════════════════════════════════════════
  if (variant === 'sidebar') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-[#5B5BED] hover:bg-[#F3F3FF] transition-all duration-150"
        >
          <Download size={18} strokeWidth={2} />
          <span className="flex-1 text-left">Pasang App</span>
          <ChevronDown size={12} className={`text-[#5B5BED] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute left-2 bottom-full mb-1 w-60 bg-white rounded-xl border border-[#F5F5F5] shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 origin-bottom-left">
            <InstallDropdownContent
              canNative={canNative}
              canIOS={canIOS}
              canAPK={canAPK}
              onNativeInstall={handleNativeInstall}
              onIOSGuide={handleIOSGuide}
              onDownloadAPK={handleDownloadAPK}
              onDismiss={handleDismiss}
            />
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Topbar variant
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#F3F3FF] hover:bg-[#E8E7FF] text-[#5B5BED] text-[12px] font-medium px-4 py-2 rounded-xl transition-colors"
      >
        <Download size={14} strokeWidth={2} />
        Pasang App
        <ChevronDown size={10} className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl border border-[#F5F5F5] shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
          <InstallDropdownContent
            canNative={canNative}
            canIOS={canIOS}
            canAPK={canAPK}
            onNativeInstall={handleNativeInstall}
            onIOSGuide={handleIOSGuide}
            onDownloadAPK={handleDownloadAPK}
            onDismiss={handleDismiss}
          />
        </div>
      )}
    </div>
  );
}

// ─── Dropdown Content (shared across all variants) ──────────────────────────
function InstallDropdownContent({
  canNative,
  canIOS,
  canAPK,
  onNativeInstall,
  onIOSGuide,
  onDownloadAPK,
  onDismiss,
}: {
  canNative: boolean;
  canIOS: boolean;
  canAPK: boolean;
  onNativeInstall: () => void;
  onIOSGuide: () => void;
  onDownloadAPK: () => void;
  onDismiss: () => void;
}) {
  const hasAnyOption = canNative || canIOS || canAPK;

  return (
    <>
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#F5F5F5]">
        <p className="text-[11px] font-semibold text-[#A3A3A3] uppercase tracking-[0.06em]">
          Pasang RestoFlow
        </p>
      </div>

      {/* Native PWA install */}
      {canNative && (
        <button
          onClick={onNativeInstall}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-[#171717] hover:bg-[#F5F5F5] transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F3F3FF] flex items-center justify-center flex-shrink-0">
            <Monitor size={16} className="text-[#5B5BED]" />
          </div>
          <div>
            <p className="font-medium text-[#171717]">Pasang PWA</p>
            <p className="text-[11px] text-[#A3A3A3] mt-0.5">Instal langsung dari browser</p>
          </div>
        </button>
      )}

      {/* iOS guide */}
      {canIOS && (
        <button
          onClick={onIOSGuide}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-[#171717] hover:bg-[#F5F5F5] transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F3F3FF] flex items-center justify-center flex-shrink-0">
            <Smartphone size={16} className="text-[#5B5BED]" />
          </div>
          <div>
            <p className="font-medium text-[#171717]">Pasang di iOS</p>
            <p className="text-[11px] text-[#A3A3A3] mt-0.5">Tambahkan ke Home Screen</p>
          </div>
        </button>
      )}

      {/* Fallback: "install manually" for desktop browsers without beforeinstallprompt */}
      {!canNative && !canIOS && (
        <div className="px-3 py-2.5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] flex items-center justify-center flex-shrink-0">
              <Monitor size={16} className="text-[#EA580C]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#171717]">Pasang via Browser</p>
              <p className="text-[11px] text-[#A3A3A3] mt-0.5 leading-relaxed">
                Klik ikon <code className="bg-[#F5F5F5] px-1 rounded text-[#737373] text-[10px]">⚙️ / ⋮</code> di address bar &rarr; pilih <span className="font-semibold text-[#171717]">"Install RestoFlow"</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Download APK */}
      {canAPK && (
        <>
          <div className="border-t border-[#F5F5F5] my-1" />
          <button
            onClick={onDownloadAPK}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-[#171717] hover:bg-[#F5F5F5] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
              <Tablet size={16} className="text-[#16A34A]" />
            </div>
            <div>
              <p className="font-medium text-[#171717]">Download APK Android</p>
              <p className="text-[11px] text-[#A3A3A3] mt-0.5">
                {isAndroid() ? 'Langsung install di Android' : 'Untuk perangkat Android'}
              </p>
            </div>
            <ExternalLink size={12} className="text-[#A3A3A3] ml-auto flex-shrink-0" />
          </button>
        </>
      )}

      {/* Dismiss */}
      <div className="border-t border-[#F5F5F5] mt-1 pt-1 px-1.5">
        <button
          onClick={onDismiss}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-[#A3A3A3] hover:text-[#737373] hover:bg-[#F5F5F5] transition-colors"
        >
          <X size={12} />
          Sembunyikan
        </button>
      </div>
    </>
  );
}
