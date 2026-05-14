import { Link } from "react-router-dom";
import { CaretRight } from "@phosphor-icons/react";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

function useCounter(target: number, duration = 1.8) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration * 60);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(id); }
      else { setCount(Math.floor(start)); }
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [inView, target, duration]);
  return { count, ref };
}

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCounter(value);
  return (
    <div className="text-center md:text-left">
      <span ref={ref} className="text-3xl md:text-4xl font-display font-black text-pb-ink tabular-nums">
        {count.toLocaleString()}{suffix}
      </span>
      <p className="text-[11px] font-mono text-pb-muted uppercase tracking-[0.08em] mt-1">{label}</p>
    </div>
  );
}

const HeroSection = () => (
  <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-pb-paper">
    {/* Decorative court lines — desktop only */}
    <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[480px] h-[480px] pointer-events-none opacity-[0.05]">
      <svg viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-pb-ink">
        <rect x="20" y="20" width="440" height="440" rx="8" stroke="currentColor" strokeWidth="3" />
        <line x1="240" y1="20" x2="240" y2="460" stroke="currentColor" strokeWidth="2" />
        <line x1="20" y1="240" x2="460" y2="240" stroke="currentColor" strokeWidth="2" />
        <line x1="20" y1="160" x2="460" y2="160" stroke="currentColor" strokeWidth="2" strokeDasharray="8 6" />
        <line x1="20" y1="320" x2="460" y2="320" stroke="currentColor" strokeWidth="2" strokeDasharray="8 6" />
        <rect x="80" y="80" width="320" height="320" rx="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="240" cy="240" r="60" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>

    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10 w-full">
      <div className="max-w-2xl text-center md:text-left">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-pb-ink text-5xl sm:text-6xl md:text-7xl font-display font-black leading-[0.9] tracking-tighter mb-6 uppercase"
        >
          Find. Play.<br/>
          <span className="text-pb-court underline decoration-4 underline-offset-8">Win.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="text-pb-muted text-lg md:text-xl font-medium leading-relaxed mb-10"
        >
          America's premium pickleball platform. Find tournaments, track matches, and compete in real time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-6"
        >
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-2 h-14 px-8 rounded-[6px] bg-pb-ink text-white font-display font-bold text-[15px] uppercase tracking-wide hover:bg-pb-ink/90 transition-colors"
          >
            Browse Tournaments
            <CaretRight size={18} />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center gap-3 text-[13px]"
        >
          <Link
            to="/create-tournament"
            className="inline-flex items-center h-9 px-4 rounded-full border border-pb-hairline font-mono text-pb-ink hover:border-pb-rule hover:bg-pb-surface transition-colors"
          >
            Host a Tournament (Free)
          </Link>
          <span className="text-pb-faint">·</span>
          <Link
            to="/tournaments"
            className="font-mono text-pb-muted hover:text-pb-ink underline underline-offset-2 transition-colors"
          >
            Search with filters →
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        className="mt-16 pt-10 border-t border-pb-hairline"
      >
        <div className="flex flex-wrap justify-center md:justify-start gap-10 md:gap-16">
          <StatCounter value={500} suffix="+" label="Tournaments" />
          <StatCounter value={10000} suffix="+" label="Players" />
          <StatCounter value={28} suffix="" label="States" />
        </div>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
