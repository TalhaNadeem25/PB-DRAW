import { UserPlus, Settings, PlayCircle, Trophy, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Account",
    description: "Sign up as an organizer or player in seconds. It's completely free to get started.",
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
    <section className="py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 court-pattern-subtle opacity-30" />
      
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-secondary/5 blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-secondary/20 mb-6 animate-fade-in">
            <PlayCircle className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium">Simple Process</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Four Simple Steps to
            <br />
            <span className="text-gradient">Tournament Success</span>
          </h2>
          
          <p className="text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
            From setup to championship, we've streamlined every step of the process.
          </p>
        </div>

        <div className="relative">
          {/* Connection line - desktop */}
          <div className="hidden lg:block absolute top-24 left-[12.5%] right-[12.5%] h-0.5">
            <div className="w-full h-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-full" />
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className="relative animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="relative text-center group">
                  {/* Step number background */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-8xl font-display font-bold text-primary/5 select-none transition-colors group-hover:text-primary/10">
                    {step.step}
                  </div>
                  
                  {/* Icon container */}
                  <div className="relative z-10 w-20 h-20 mx-auto rounded-2xl bg-hero-gradient flex items-center justify-center mb-8 shadow-glow group-hover:shadow-glow-lg group-hover:scale-105 transition-all duration-300">
                    <step.icon className="w-10 h-10 text-primary-foreground" />
                    
                    {/* Connector arrow - desktop only */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:flex absolute -right-8 top-1/2 -translate-y-1/2 text-primary/40">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-display font-bold mb-3 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
