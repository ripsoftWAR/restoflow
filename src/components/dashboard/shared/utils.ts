/**
 * Format angka ke format Rupiah singkat (compact)
 * Contoh: 1200000 -> "1,2jt", 5000 -> "5rb", 100 -> "100"
 */
export function formatIDRCompact(num: number): string {
  if (num === 0) return '0';
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return val % 1 === 0 ? `${val.toLocaleString('id-ID')}jt` : `${val.toFixed(1).replace('.', ',')}jt`;
  }
  if (num >= 1_000) {
    return `${Math.round(num / 1_000)}rb`;
  }
  return Math.round(num).toLocaleString('id-ID');
}