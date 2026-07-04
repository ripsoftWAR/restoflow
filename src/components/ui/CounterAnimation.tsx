import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface CounterAnimationProps {
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
  duration?: number;
  /** Jika true, tampilkan staticValue langsung tanpa animasi angka */
  isStatic?: boolean;
  staticValue?: string;
}

/**
 * CounterAnimation — Animated number counter that counts up
 * when scrolled into view. Used for stats/trust section.
 */
export function CounterAnimation({
  target,
  prefix = '',
  suffix = '',
  label,
  duration = 1.5,
  isStatic = false,
  staticValue = '',
}: CounterAnimationProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, target, duration]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-[32px] sm:text-[40px] font-bold tracking-[-0.03em] text-[#0F172A] tabular-nums">
        {isStatic ? staticValue : `${prefix}${count.toLocaleString()}${suffix}`}
      </p>
      <p className="text-[13px] text-[#94A3B8] mt-1 font-medium">{label}</p>
    </div>
  );
}
