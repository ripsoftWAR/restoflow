import { motion } from 'framer-motion';

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  restaurant: string;
  rating?: number;
  delay?: number;
  avatarColor?: string;
}

/**
 * TestimonialCard — Premium testimonial with avatar,
 * restaurant name, role, star rating, and card layout
 */
export function TestimonialCard({
  quote,
  name,
  role,
  restaurant,
  rating = 5,
  delay = 0,
  avatarColor = '#2563EB',
}: TestimonialCardProps) {
  // Generate initials
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4 }}
      className="group relative bg-white border border-[#F1F5F9] rounded-[20px] p-6 transition-all duration-300 hover:border-[#E2E8F0] hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)]"
    >
      {/* Stars */}
      <div className="flex items-center gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={i < rating ? '#F59E0B' : '#E2E8F0'}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-[14px] text-[#475569] leading-relaxed mb-5 line-clamp-5">
        "{quote}"
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-[#F1F5F9]">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#0F172A] leading-none">
            {name}
          </p>
          <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-tight">
            {role}, <span className="font-medium text-[#64748B]">{restaurant}</span>
          </p>
        </div>

        {/* Quote mark decoration */}
        <div className="ml-auto text-[#F1F5F9] group-hover:text-[#DBEAFE] transition-colors">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.413-.637-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.166 21 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.413-.637-2.917-1.179z" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
