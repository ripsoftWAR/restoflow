import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, subMonths, addMonths, format, isSameDay, isSameMonth,
  isAfter, isBefore, startOfDay, endOfDay,
  isWithinInterval,
} from 'date-fns';
import { id } from 'date-fns/locale';

/* ═══════════════════════════════════════════════════════════════
   DateRangePicker — Tokopedia-style date range selector
   
   • Preset pills: Hari ini, 7 Hari, 30 Hari, Bulan ini, 3 Bulan, 1 Tahun
   • "Pilih Tanggal" opens dual-month calendar popover
   • Supports custom date range
   ═══════════════════════════════════════════════════════════════ */

/* ── Types ─────────────────────────────────────── */
export type PresetKey = 'today' | '7d' | '30d' | 'thisMonth' | '3months' | '1year' | 'custom';

export interface DateRangeValue {
  preset: PresetKey;
  from?: Date;
  to?: Date;
}

interface Props {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

/* ── Preset definitions ────────────────────────── */
interface PresetDef {
  key: PresetKey;
  label: string;
  shortLabel: string; // for collapsed display on mobile
}

const PRESETS: PresetDef[] = [
  { key: 'today', label: 'Hari ini', shortLabel: 'Hari ini' },
  { key: '7d', label: '7 Hari', shortLabel: '7H' },
  { key: '30d', label: '30 Hari', shortLabel: '30H' },
  { key: 'thisMonth', label: 'Bulan ini', shortLabel: 'Bln ini' },
  { key: '3months', label: '3 Bulan', shortLabel: '3B' },
  { key: '1year', label: '1 Tahun', shortLabel: '1Th' },
];

/* ── Helpers ───────────────────────────────────── */
function getPresetRange(key: PresetKey): { from: Date; to: Date } {
  const now = new Date();
  switch (key) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case '7d':
      return { from: startOfDay(addDays(now, -6)), to: endOfDay(now) };
    case '30d':
      return { from: startOfDay(addDays(now, -29)), to: endOfDay(now) };
    case 'thisMonth':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case '3months':
      return { from: startOfDay(addDays(now, -89)), to: endOfDay(now) };
    case '1year':
      return { from: new Date(now.getFullYear(), 0, 1), to: endOfDay(now) };
    default:
      return { from: startOfDay(addDays(now, -29)), to: endOfDay(now) };
  }
}

function formatDisplayLabel(value: DateRangeValue): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];

  if (value.preset === 'custom' && value.from && value.to) {
    const from = `${value.from.getDate()} ${monthNames[value.from.getMonth()]}`;
    const to = `${value.to.getDate()} ${monthNames[value.to.getMonth()]} ${value.to.getFullYear()}`;
    return `${from} – ${to}`;
  }

  const range = getPresetRange(value.preset);
  const from = `${range.from.getDate()} ${monthNames[range.from.getMonth()]}`;
  const to = `${range.to.getDate()} ${monthNames[range.to.getMonth()]} ${range.to.getFullYear()}`;

  if (value.preset === 'today') return `Hari ini, ${to}`;
  if (value.preset === 'thisMonth') return `${monthNames[range.to.getMonth()]} ${range.to.getFullYear()}`;
  if (value.preset === '1year') return `Tahun ${range.to.getFullYear()}`;
  return `${from} – ${to}`;
}

/* ═══════════════════════════════════════════════════════════════
   CALENDAR GRID SUBCOMPONENT
   ═══════════════════════════════════════════════════════════════ */

function CalendarGrid({
  month,
  selectedFrom,
  selectedTo,
  hoverDate,
  onDateClick,
  onDateHover,
}: {
  month: Date;
  selectedFrom: Date | null;
  selectedTo: Date | null;
  hoverDate: Date | null;
  onDateClick: (date: Date) => void;
  onDateHover: (date: Date | null) => void;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Senin
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const today = startOfDay(new Date());
  const weeks: Date[][] = [];

  let cursor = calStart;
  while (cursor <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  const dayNames = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'];

  /* ── Flatten all cells into a single array for ONE grid ── */
  const allCells = useMemo(() => {
    const flat = weeks.flat();
    return {
      header: dayNames.map((dn, i) => ({ type: 'header' as const, label: dn, key: `h-${i}` })),
      dates: flat.map((date, idx) => ({ type: 'date' as const, date, key: `d-${idx}` })),
    };
  }, [weeks]);

  /* ── Check if a date is in the preview range ─── */
  function isInPreview(date: Date): boolean {
    if (!selectedFrom || selectedTo) return false;
    if (!hoverDate) return false;
    return isWithinInterval(date, {
      start: selectedFrom <= hoverDate ? selectedFrom : hoverDate,
      end: selectedFrom <= hoverDate ? hoverDate : selectedFrom,
    });
  }

  function isInSelectedRange(date: Date): boolean {
    if (!selectedFrom || !selectedTo) return false;
    return isWithinInterval(date, {
      start: selectedFrom,
      end: selectedTo,
    });
  }

  function isRangeStart(date: Date): boolean {
    return selectedFrom ? isSameDay(date, selectedFrom) : false;
  }

  function isRangeEnd(date: Date): boolean {
    return selectedTo ? isSameDay(date, selectedTo) : false;
  }

  return (
    <div className="flex-1 min-w-[224px]">
      {/* Month header */}
      <p className="text-[13px] font-semibold text-pp-text text-center mb-3">
        {format(month, 'MMMM yyyy', { locale: id })}
      </p>

      {/* ═══════════════════════════════════════
          SINGLE UNIFIED GRID — header + body
          7 kolom identik, fix-width per sel
          supaya header & body align sempurna.
          ═══════════════════════════════════════ */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 0,
        }}
      >
        {/* ── Row 1: Day name headers ── */}
        {allCells.header.map(cell => (
          <div
            key={cell.key}
            className="flex items-center justify-center text-[10px] font-semibold text-pp-text-placeholder py-1.5 select-none"
          >
            {cell.label}
          </div>
        ))}

        {/* ── Rows 2-7: Date cells ── */}
        {allCells.dates.map(cell => {
            const date = cell.date;
            const isCurrentMonth = isSameMonth(date, month);
            const isToday = isSameDay(date, today);
            const isStart = isRangeStart(date);
            const isEnd = isRangeEnd(date);
            const inRange = isInSelectedRange(date);
            const inPreview = isInPreview(date);

            return (
              <button
                key={cell.key}
                type="button"
                disabled={!isCurrentMonth}
                onClick={() => isCurrentMonth && onDateClick(date)}
                onMouseEnter={() => isCurrentMonth && onDateHover(date)}
                onMouseLeave={() => onDateHover(null)}
                className={`
                  relative text-[12px] w-full aspect-square flex items-center justify-center
                  transition-colors cursor-pointer select-none
                  ${!isCurrentMonth ? 'text-transparent pointer-events-none' : ''}
                  ${isStart || isEnd
                    ? 'bg-pp-primary text-white font-bold z-10 rounded-full'
                    : inRange
                    ? 'bg-pp-primary/10 text-pp-primary font-medium rounded-none'
                    : inPreview
                    ? 'bg-pp-primary/5 text-pp-primary/70 rounded-none'
                    : 'text-pp-text hover:bg-pp-surface-alt rounded-full'
                  }
                  ${isToday && !isStart && !isEnd ? 'ring-1 ring-pp-primary/40 rounded-full' : ''}
                `}
              >
                {date.getDate()}
              </button>
            );
          })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const DateRangePicker = memo(function DateRangePicker({ value, onChange }: Props) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [selectingFrom, setSelectingFrom] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [popupAlignRight, setPopupAlignRight] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Click outside ──────────────────────────── */
  useEffect(() => {
    if (!showCalendar) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
        setSelectingFrom(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCalendar]);

  /* ── Collision detection: flip popup if it would overflow right viewport ── */
  useEffect(() => {
    if (!showCalendar || !containerRef.current) {
      setPopupAlignRight(false);
      return;
    }
    /* Small delay so DOM paints first, then measure */
    const raf = requestAnimationFrame(() => {
      const triggerRect = containerRef.current?.getBoundingClientRect();
      if (!triggerRect) return;
      /* Approximate popup min-width: dual calendar ~560px + padding */
      const estimatedPopupWidth = 570;
      const rightOverflow = triggerRect.left + estimatedPopupWidth - window.innerWidth + 12;
      /* Jika right-anchored, berapa overflow ke kiri? */
      const leftOverflow = estimatedPopupWidth - triggerRect.right + 12;
      /* Pilih anchor dengan overflow paling kecil */
      setPopupAlignRight(rightOverflow > 0 && leftOverflow < rightOverflow);
    });
    return () => cancelAnimationFrame(raf);
  }, [showCalendar]);

  /* ── Handlers ────────────────────────────────── */
  const handlePreset = useCallback((key: PresetKey) => {
    if (key === 'custom') {
      // Open calendar for custom selection
      setShowCalendar(true);
      setSelectingFrom(null);
      return;
    }
    setShowCalendar(false);
    setSelectingFrom(null);
    onChange({ preset: key });
  }, [onChange]);

  const handleDateClick = useCallback((date: Date) => {
    if (!selectingFrom) {
      // First click: set start date
      setSelectingFrom(startOfDay(date));
      return;
    }

    // Second click: set end date
    const from = selectingFrom;
    const to = endOfDay(date);

    if (isAfter(from, to)) {
      // If user clicked earlier date, swap
      onChange({ preset: 'custom', from: to, to: from });
    } else {
      onChange({ preset: 'custom', from, to });
    }

    setShowCalendar(false);
    setSelectingFrom(null);
  }, [selectingFrom, onChange]);

  const displayLabel = useMemo(() => formatDisplayLabel(value), [value]);

  /* ── Calendar navigation ────────────────────── */
  const prevMonth = () => setCalendarMonth(m => subMonths(m, 1));
  const nextMonth = () => setCalendarMonth(m => addMonths(m, 1));

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div className="relative" ref={containerRef}>
      {/* ── Trigger Button ─────────────────────── */}
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="flex items-center gap-2 bg-pp-surface border border-pp-border px-[14px] py-[9px] rounded-pp-xs text-[13px] font-medium text-pp-text hover:border-pp-border-strong transition-colors cursor-pointer whitespace-nowrap"
      >
        <Calendar size={15} strokeWidth={1.8} />
        {displayLabel}
        <ChevronDown
          size={13}
          strokeWidth={2}
          className={`transition-transform duration-200 ${showCalendar ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ── Dropdown Popover + Backdrop ────────── */}
      <AnimatePresence>
        {showCalendar && (
          <>
            {/* Backdrop overlay — blocks interaction behind popover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="fixed inset-0 z-[99] bg-black/15"
              onClick={() => {
                setShowCalendar(false);
                setSelectingFrom(null);
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={`absolute top-full mt-2 z-[100] bg-pp-surface border border-pp-border rounded-pp-lg shadow-pp-xl p-5 ${popupAlignRight ? 'right-0' : 'left-0'}`}
              style={{ minWidth: '520px' }}
            >
              {/* Preset pills row */}
              <div className="flex items-center gap-1.5 mb-4 pb-3 border-b border-pp-border flex-wrap">
                {PRESETS.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handlePreset(p.key)}
                    className={`text-[12px] px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      value.preset === p.key && value.preset !== 'custom'
                        ? 'bg-pp-primary text-white'
                        : 'text-pp-text-secondary hover:bg-pp-surface-alt'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                {/* Custom indicator */}
                <button
                  type="button"
                  className={`text-[12px] px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    value.preset === 'custom'
                      ? 'bg-pp-primary text-white'
                      : 'text-pp-text-secondary hover:bg-pp-surface-alt'
                  }`}
                  onClick={() => handlePreset('custom')}
                >
                  📅 Pilih Tanggal
                </button>
              </div>

              {/* Dual-month calendar — symmetrical spacing */}
              <div className="flex items-start justify-center gap-6">
                {/* Navigation */}
                <button
                  type="button"
                  onClick={prevMonth}
                  className="mt-1.5 p-1 rounded-full hover:bg-pp-surface-alt transition-colors cursor-pointer flex-shrink-0 self-start"
                >
                  <ChevronLeft size={16} strokeWidth={2} className="text-pp-text-secondary" />
                </button>

                <CalendarGrid
                  month={calendarMonth}
                  selectedFrom={
                    value.preset === 'custom' && value.from ? value.from : selectingFrom
                  }
                  selectedTo={
                    value.preset === 'custom' && value.to ? value.to : null
                  }
                  hoverDate={hoverDate}
                  onDateClick={handleDateClick}
                  onDateHover={setHoverDate}
                />

                <CalendarGrid
                  month={addMonths(calendarMonth, 1)}
                  selectedFrom={
                    value.preset === 'custom' && value.from ? value.from : selectingFrom
                  }
                  selectedTo={
                    value.preset === 'custom' && value.to ? value.to : null
                  }
                  hoverDate={hoverDate}
                  onDateClick={handleDateClick}
                  onDateHover={setHoverDate}
                />

                <button
                  type="button"
                  onClick={nextMonth}
                  className="mt-1.5 p-1 rounded-full hover:bg-pp-surface-alt transition-colors cursor-pointer flex-shrink-0 self-start"
                >
                  <ChevronRight size={16} strokeWidth={2} className="text-pp-text-secondary" />
                </button>
              </div>

              {/* Footer */}
              {selectingFrom && (
                <p className="mt-3 pt-3 border-t border-pp-border text-[12px] text-pp-text-muted text-center">
                  Klik tanggal kedua untuk menyelesaikan pemilihan
                </p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

export default DateRangePicker;
export { getPresetRange, formatDisplayLabel };
