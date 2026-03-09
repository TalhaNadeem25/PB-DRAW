import { cn } from "@/lib/utils";
import { Medal, ChartBar, MagnifyingGlass, TrendingUp, Trophy, User, Users } from "@phosphor-icons/react";
import { useState } from "react";
import { motion } from "framer-motion";

const HowItWorksSection = () => {
  const [activeView, setActiveView] = useState<"players" | "organizers">("organizers");

  const features = [
    {
      icon: Search,
      bgIcon: Search,
      title: "Find Events",
      description: "Browse local and national tournaments that match your skill level and availability.",
    },
    {
      icon: Award,
      bgIcon: Trophy,
      title: "Compete",
      description: "Seamless registration, instant bracket updates, and real-time court assignments sent to your phone.",
    },
    {
      icon: BarChart3,
      bgIcon: TrendingUp,
      title: "Win",
      description: "Climb the global rankings. Get detailed match analytics and share your victories with the community.",
    },
  ];

  return (
    <section className="py-24 bg-background-light dark:bg-[#1a1f29]">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20"
        >
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-display font-black uppercase italic tracking-tighter mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg">
              Streamlining the pickleball experience for everyone. From registration to the final podium.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView("players")}
              className={cn(
                "p-4 border rounded-lg transition-colors",
                activeView === "players"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary"
              )}
            >
              <User className="w-5 h-5 text-primary" />
              <span className="block text-[10px] font-bold uppercase mt-1">Players</span>
            </button>
            <button
              onClick={() => setActiveView("organizers")}
              className={cn(
                "p-4 border rounded-lg transition-colors",
                activeView === "organizers"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary"
              )}
            >
              <Users className="w-5 h-5 text-primary" />
              <span className="block text-[10px] font-bold uppercase mt-1">Organizers</span>
            </button>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const BgIcon = feature.bgIcon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all relative overflow-hidden"
              >
                {/* Background Icon */}
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <BgIcon className="w-36 h-36 text-primary" />
                </div>
                
                {/* Icon Container */}
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-8 border border-primary/20">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-display font-bold mb-4 uppercase italic">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
