import { Trophy, Users, LayoutGrid, Award, BarChart3, Shield } from "lucide-react";

const features = [
  {
    icon: Trophy,
    title: "Tournament Creation",
    description: "Create and customize tournaments with multiple events, skill levels, and formats in minutes.",
  },
  {
    icon: LayoutGrid,
    title: "Pool Play Management",
    description: "Automatically generate round-robin pools and track every match with ease.",
  },
  {
    icon: Award,
    title: "Bracket Generation",
    description: "Generate single elimination brackets automatically from pool results.",
  },
  {
    icon: Users,
    title: "Player Registration",
    description: "Seamless registration for singles and doubles with partner matching.",
  },
  {
    icon: BarChart3,
    title: "Live Scoring",
    description: "Real-time score entry and automatic bracket advancement.",
  },
  {
    icon: Shield,
    title: "Public Results",
    description: "Share tournament brackets and results with anyone, no login required.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <span className="inline-block px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed specifically for pickleball tournament management.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-card p-8 rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-6 group-hover:bg-hero-gradient transition-colors duration-300">
                <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
