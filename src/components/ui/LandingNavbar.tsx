import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { Button } from './Button';

/* ─── Props ──────────────────────────────── */
interface Props {
  onMasuk: () => void;
  onDaftar: () => void;
}

/* ═══════════════════════════════════════════
   LANDING NAVBAR — Premium SaaS Style
   ═══════════════════════════════════════════ */
export function LandingNavbar({ onMasuk, onDaftar }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ── Scroll detection ────────────────── */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── Lock body scroll when drawer open ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  /* ── Close drawer on route change / resize ── */
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* ═══════════════════════════════════
          HEADER BAR
          ═══════════════════════════════════ */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-400 ease-out
          ${scrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]/40 shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
            : 'bg-transparent border-b border-transparent'
          }
        `}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto px-5 h-[68px]">
          {/* ── Left: Brand — always visible ── */}
          <a
            href="#"
            className={`
              flex-shrink-0 transition-all duration-400 ease-out
              ${scrolled ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-0'}
            `}
            aria-label="PilotPOS — Beranda"
          >
            <BrandMark size="sm" showTagline={true} />
          </a>

          {/* ── Center: spacer ── */}
          <div className="hidden lg:block flex-1" />

          {/* ── Right: Desktop CTAs — hidden until scroll ── */}
          <div
            className={`
              hidden lg:flex items-center gap-2.5
              transition-all duration-400 ease-out
              ${scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
            `}
          >
            <Button variant="ghost" size="md" onClick={onMasuk}>
              Masuk
            </Button>
            <Button variant="primary" size="md" onClick={onDaftar}>
              Coba Gratis
            </Button>
          </div>

          {/* ── Mobile: hamburger — always visible ── */}
          <button
            onClick={() => setMobileOpen(true)}
            className={`
              lg:hidden p-2 -mr-2 rounded-xl
              text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]
              transition-all duration-400 ease-out
              ${scrolled ? 'opacity-100' : 'opacity-60'}
            `}
            aria-label="Buka menu navigasi"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════
          MOBILE DRAWER — Slide from right
          ═══════════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* ── Backdrop ───────────────── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />

            {/* ── Drawer panel ───────────── */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="
                fixed top-0 right-0 bottom-0 z-[70] w-[300px]
                bg-white shadow-2xl
                lg:hidden flex flex-col
              "
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 h-[68px] border-b border-[#F1F5F9]">
                <BrandMark size="sm" showTagline={false} />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="
                    p-2 -mr-2 rounded-xl
                    text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]
                    transition-colors duration-200
                  "
                  aria-label="Tutup menu navigasi"
                >
                  <X size={22} strokeWidth={1.5} />
                </button>
              </div>

              {/* Drawer CTAs */}
              <div className="flex-1 px-4 py-6 space-y-2.5 overflow-y-auto">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => { setMobileOpen(false); onMasuk(); }}
                  className="w-full justify-center"
                >
                  Masuk
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => { setMobileOpen(false); onDaftar(); }}
                  className="w-full justify-center"
                >
                  Coba Gratis
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
