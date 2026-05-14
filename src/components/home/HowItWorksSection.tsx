import { cn } from "@/lib/utils";
import { Medal, ChartBar, MagnifyingGlass, TrendUp, Trophy, User, Users } from "@phosphor-icons/react";
import { useState } from "react";
import { motion } from "framer-motion";

const HowItWorksSection = () => {
  const [activeView, setActiveView] = useState<"players" | "organizers">("organizers");

  const features = [
    {
      icon: MagnifyingGlass,
      title: "Find Events",
      description: "Browse local and national tournaments that match your skill level and availability.",
    },
    {
      icon: Medal,
      title: "Compete",
      description: "Seamless registration, instant bracket updates, and real-time court assignments sent to your phone.",
    },
    {
      icon: ChartBar,
      title: "Win",
      description: "Climb the global rankings. Get detailed match analytics and share your victories with the community.",
    },
  ];

  return (
    <section className="py-24 bg-pb-paper border-b border-pb-hairline">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16"
        >
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter text-pb-ink mb-4">
              How It Works
            </h2>
            <p className="text-[15px] font-mono text-pb-muted">
              Streamlining the pickleball experience for everyone. From registration to the final podium.
            </p>
          </div>
          <div className="flex gap-2">
            {(["players", "organizers"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={cn(
                  "p-3.5 border rounded-[6px] transition-colors",
                  activeView === view
                    ? "border-pb-court bg-pb-court-tint2"
                    : "border-pb-hairline hover:border-pb-rule hover:bg-pb-surface"
                )}
              >
                {view === "players"
                  ? <User size={16} className={activeView === view ? "text-pb-court" : "text-pb-muted"} />
                  : <Users size={16} className={activeView === view ? "text-pb-court" : "text-pb-muted"} />
                }
                <span className={cn(
                  "block text-[9px] font-mono uppercase tracking-[0.06em] mt-1",
                  activeView === view ? "text-pb-court" : "text-pb-muted"
                )}>
                  {view}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group bg-pb-surface border border-pb-hairline rounded-[6px] p-7 hover:border-pb-rule transition-colors relative overflow-hidden"
            >
              {/* Large background icon */}
              <div className="absolute -right-3 -top-3 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                <Trophy size={120} className="text-pb-ink" />
              </div>

              <div className="w-12 h-12 bg-pb-court-tint2 border border-pb-hairline rounded-[6px] flex items-center justify-center mb-7 relative z-10 group-hover:border-pb-court/30 transition-colors">
                <feature.icon size={20} className="text-pb-court" />
              </div>

              <span className="font-mono text-[11px] text-pb-faint mb-2 block">0{index + 1}</span>
              <h3 className="text-xl font-display font-black uppercase tracking-tight text-pb-ink mb-3">
                {feature.title}
              </h3>
              <p className="text-[13px] font-mono text-pb-muted leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
