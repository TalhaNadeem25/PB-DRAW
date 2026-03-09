import { Trophy, Users, SquaresFour, Medal, ChartBar, Shield, Lightning, Globe } from "@phosphor-icons/react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Trophy,
    title: "Tournament Creation",
    description: "Create and customize tournaments with multiple events, skill levels, and formats in minutes.",
    accent: "primary",
  },
  {
    icon: SquaresFour,
    title: "Pool Play Management",
    description: "Automatically generate round-robin pools and track every match with ease.",
    accent: "secondary",
  },
  {
    icon: Medal,
    title: "Bracket Generation",
    description: "Generate single elimination brackets automatically from pool results.",
    accent: "primary",
  },
  {
    icon: Users,
    title: "Player Registration",
    description: "Seamless registration for singles and doubles with partner matching.",
    accent: "secondary",
  },
  {
    icon: ChartBar,
    title: "Live Scoring",
    description: "Real-time score entry and automatic bracket advancement.",
    accent: "primary",
  },
  {
    icon: Globe,
    title: "Public Results",
    description: "Share tournament brackets and results with anyone, no login required.",
    accent: "secondary",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const FeaturesSection = () => {
  return (
    <section className="py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-muted/30" />
      <div className="absolute inset-0 court-pattern-subtle opacity-30" />

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-secondary/5 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-6">
            <Lightning className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium">Powerful Features</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            Everything You Need to
            <br />
            <span className="text-gradient">Run Great Tournaments</span>
          </h2>

          <p className="text-lg text-muted-foreground">
            Powerful tools designed specifically for pickleball tournament management.
            From registration to results, we've got you covered.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => {
            // First two cards span 2 cols on large screens for bento effect
            const isLarge = index < 2;
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`group glass-card-hover p-8 rounded-2xl relative overflow-hidden ${
                  isLarge ? 'lg:col-span-1 md:col-span-1 first:md:col-span-2 first:lg:col-span-1' : ''
                }`}
                style={{ gridColumn: index === 0 ? undefined : undefined }}
              >
                {/* Animated border glow on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-sm" />
                </div>

                <div className="relative z-10">
                  {/* Step number */}
                  <span className="absolute top-0 right-0 text-6xl font-display font-black text-muted/40 leading-none select-none">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  {/* Icon */}
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300
                    ${feature.accent === 'primary'
                      ? 'bg-primary/10 group-hover:bg-hero-gradient group-hover:shadow-glow'
                      : 'bg-secondary/10 group-hover:bg-accent-gradient group-hover:shadow-glow-yellow'
                    }
                  `}>
                    <feature.icon className={`
                      w-7 h-7 transition-colors duration-300
                      ${feature.accent === 'primary'
                        ? 'text-primary group-hover:text-primary-foreground'
                        : 'text-secondary group-hover:text-secondary-foreground'
                      }
                    `} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-display font-bold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Decorative accent line */}
                  <div className={`
                    h-1 w-0 mt-6 rounded-full transition-all duration-500 group-hover:w-16
                    ${feature.accent === 'primary' ? 'bg-hero-gradient' : 'bg-accent-gradient'}
                  `} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
