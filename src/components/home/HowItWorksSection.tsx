import { UserPlus, Settings, PlayCircle, Trophy } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Account",
    description: "Sign up as an organizer or player in seconds. It's completely free.",
  },
  {
    icon: Settings,
    step: "02",
    title: "Set Up Tournament",
    description: "Define events, skill levels, registration deadlines, and court availability.",
  },
  {
    icon: PlayCircle,
    step: "03",
    title: "Manage Competition",
    description: "Create pools, generate brackets, and enter scores in real-time.",
  },
  {
    icon: Trophy,
    step: "04",
    title: "Crown Champions",
    description: "Automatic advancement and final results published instantly.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 court-pattern opacity-20" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <span className="inline-block px-4 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Four Simple Steps
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From setup to championship, we've streamlined every step of the process.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className="relative animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/10" />
              )}
              
              <div className="relative text-center group">
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-6xl font-display font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
                  {step.step}
                </div>
                
                {/* Icon */}
                <div className="relative z-10 w-20 h-20 mx-auto rounded-2xl bg-hero-gradient flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                  <step.icon className="w-10 h-10 text-primary-foreground" />
                </div>
                
                <h3 className="text-xl font-display font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
