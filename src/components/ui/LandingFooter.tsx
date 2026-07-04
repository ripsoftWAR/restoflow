import { BrandMark } from './BrandMark';

/* ═══════════════════════════════════════════
   LANDING FOOTER — Minimal & Jujur
   ═══════════════════════════════════════════ */
export function LandingFooter() {
  return (
    <footer className="bg-pp-bg border-t border-pp-border/50">
      <div className="max-w-7xl mx-auto px-5 py-12 text-center space-y-5">
        {/* ── Brand ─────────────────────── */}
        <div className="flex justify-center">
          <BrandMark size="sm" showTagline={false} />
        </div>

        {/* ── Core message ──────────────── */}
        <div className="max-w-md mx-auto space-y-3">
          <p className="text-[14px] text-pp-text-muted leading-relaxed">
            Aplikasi POS <span className="font-semibold text-pp-text">gratis</span> dengan AI bawaan —
            bantu pantau penjualan, kelola stok, & dapatkan insight bisnis.
          </p>

          <p className="text-[14px] text-pp-text-secondary leading-relaxed">
            Punya pertanyaan?{' '}
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-pp-primary hover:text-pp-primary-hover underline underline-offset-2 transition-colors"
            >
              Hubungi admin via WhatsApp
            </a>
          </p>
        </div>

        {/* ── Copyright ─────────────────── */}
        <p className="text-[11px] text-pp-text-placeholder pt-3">
          © {new Date().getFullYear()} PilotPOS.
        </p>
      </div>
    </footer>
  );
}
