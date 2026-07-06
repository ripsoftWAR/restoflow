import React from 'react';

/* ═══════════════════════════════════════════════════════════════
   PAGELAYOUT — ONE SOURCE OF TRUTH untuk grid 2-kolom
   Semua halaman (Dashboard, Penjualan, Inventori, Resep)
   pakai komponen ini supaya lebar panel kanan & gap SELALU
   identik — tidak ada lagi penyimpangan per halaman.

   Grid:     [1fr   340px]   gap-5
   Responsif: max-[1180px] → single column
   ═══════════════════════════════════════════════════════════════ */

interface PageLayoutProps {
  children: React.ReactNode;
  rightPanel: React.ReactNode;
}

export default function PageLayout({ children, rightPanel }: PageLayoutProps) {
  return (
    <div className="grid grid-cols-[1fr_340px] gap-5 max-[1180px]:grid-cols-1">
      {/* ─── LEFT: Konten utama ─── */}
      <div className="min-w-0">
        {children}
      </div>

      {/* ─── RIGHT: Panel (sidebar / detail) ─── */}
      <div className="max-[1180px]:col-span-1 overflow-visible flex flex-col gap-5">
        {rightPanel}
      </div>
    </div>
  );
}
