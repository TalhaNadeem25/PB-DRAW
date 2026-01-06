import { Trophy, Users, LayoutGrid, Award, BarChart3, Shield, Zap, Globe } from "lucide-react";

const features = [
  {
    icon: Trophy,
    title: "Tournament Creation",
    description: "Create and customize tournaments with multiple events, skill levels, and formats in minutes.",
    accent: "primary",
  },
  {
    icon: LayoutGrid,
    title: "Pool Play Management",
    description: "Automatically generate round-robin pools and track every match with ease.",
    accent: "secondary",
  },
  {
    icon: Award,
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
    icon: BarChart3,
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
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-6 animate-fade-in">
            <Zap className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium">Powerful Features</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Everything You Need to
            <br />
            <span className="text-gradient">Run Great Tournaments</span>
          </h2>
          
          <p className="text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Powerful tools designed specifically for pickleball tournament management.
            From registration to results, we've got you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group glass-card-hover p-8 rounded-2xl animate-fade-in"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
