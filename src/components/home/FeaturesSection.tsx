import { Trophy, Users, SquaresFour, Medal, ChartBar, Globe } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/pb";

const features = [
  { icon: Trophy,      title: "Tournament Creation",   description: "Create and customize tournaments with multiple events, skill levels, and formats in minutes." },
  { icon: SquaresFour, title: "Pool Play Management",  description: "Automatically generate round-robin pools and track every match with ease." },
  { icon: Medal,       title: "Bracket Generation",    description: "Generate single elimination brackets automatically from pool results." },
  { icon: Users,       title: "Player Registration",   description: "Seamless registration for singles and doubles with partner matching." },
  { icon: ChartBar,    title: "Live Scoring",           description: "Real-time score entry and automatic bracket advancement." },
  { icon: Globe,       title: "Public Results",         description: "Share tournament brackets and results with anyone, no login required." },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const FeaturesSection = () => (
  <section className="py-24 bg-pb-surface border-y border-pb-hairline overflow-hidden">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 max-w-2xl mx-auto"
      >
        <Eyebrow className="justify-center mb-4">Powerful Features</Eyebrow>
        <h2 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-pb-ink uppercase mb-5">
          Everything You Need to<br/>Run Great Tournaments
        </h2>
        <p className="text-[15px] font-mono text-pb-muted">
          Powerful tools designed specifically for pickleball tournament management.
          From registration to results, we've got you covered.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            variants={cardVariants}
            className="group bg-pb-paper border border-pb-hairline rounded-[6px] p-6 hover:border-pb-rule transition-colors relative overflow-hidden"
          >
            {/* Step number watermark */}
            <span className="absolute top-4 right-5 text-5xl font-display font-black text-pb-faint/30 leading-none select-none pointer-events-none">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-12 h-12 rounded-[6px] bg-pb-court-tint2 border border-pb-hairline flex items-center justify-center mb-5 group-hover:border-pb-court/30 transition-colors">
                <feature.icon size={20} className="text-pb-court" />
              </div>

              {/* Accent line */}
              <div className="h-[2px] w-0 mb-4 rounded-full bg-pb-court transition-all duration-500 group-hover:w-12" />

              <h3 className="font-display font-bold text-[17px] tracking-[-0.015em] text-pb-ink mb-2 group-hover:text-pb-court transition-colors">
                {feature.title}
              </h3>
              <p className="text-[13px] font-mono text-pb-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default FeaturesSection;
