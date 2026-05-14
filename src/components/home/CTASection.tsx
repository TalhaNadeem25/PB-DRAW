import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { statsAPI } from "@/services/api";
import { ArrowRight, Trophy, Star } from "@phosphor-icons/react";
import { motion } from "framer-motion";

const CTASection = () => {
  const { data } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => statsAPI.getPublic(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const organizersCount = data?.data?.organizersCount ?? 0;

  return (
    <section className="py-24 bg-pb-court overflow-hidden relative">
      {/* Subtle court pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-[6px] border border-white/20 bg-white/10 mb-8"
          >
            <Trophy size={28} className="text-white" />
          </motion.div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 mb-8">
            <span className="text-[12px] font-mono text-white/80 uppercase tracking-[0.06em]">Start for free today</span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white mb-6 leading-[0.92] tracking-tighter uppercase">
            Ready to Host Your<br/>
            <span className="opacity-70">Epic Tournament?</span>
          </h2>

          <p className="text-[16px] text-white/70 font-mono mb-10 max-w-xl mx-auto">
            {organizersCount > 0
              ? `Join ${organizersCount}+ organizers who trust PB Draw to run professional-grade tournaments.`
              : "Join organizers who trust PB Draw to run professional-grade tournaments."}
          </p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 h-13 px-8 py-3.5 rounded-[6px] bg-white text-pb-court font-display font-black text-[15px] uppercase tracking-wide hover:bg-white/90 transition-colors"
            >
              Get Started Free
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/tournaments"
              className="inline-flex items-center justify-center h-13 px-8 py-3.5 rounded-[6px] border border-white/30 text-white font-mono text-[13px] hover:bg-white/10 transition-colors"
            >
              Browse Tournaments
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <div className="mt-12 pt-8 border-t border-white/15">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-[12px] font-mono text-white/50">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} size={13} className="fill-white/70 text-white/70" />
                  ))}
                </div>
                <span>4.9/5 rating</span>
              </div>
              <span className="hidden md:block opacity-30">·</span>
              <span>No credit card required</span>
              <span className="hidden md:block opacity-30">·</span>
              <span>Free for players</span>
              <span className="hidden md:block opacity-30">·</span>
              <span>Affordable organizer plans</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
