import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Brain, Zap, TrendingUp, Target, ArrowRight } from "lucide-react";

const AIPlannerSection = () => {
  const features = [
    {
      icon: Brain,
      title: "Smart Event Suggestions",
      description: "AI recommends optimal events based on skill levels and player demographics"
    },
    {
      icon: Zap,
      title: "Instant Court Calculations",
      description: "Calculate required courts based on players, time, and match duration"
    },
    {
      icon: TrendingUp,
      title: "Schedule Optimization",
      description: "Generate schedules that maximize court usage and minimize wait times"
    },
    {
      icon: Target,
      title: "Smart Pricing",
      description: "Get data-driven recommendations for entry fees and tournament pricing"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-bold text-primary">NEW: AI-POWERED PLANNING</span>
            </div>

            <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Plan Perfect Tournaments
              <br />
              with AI
            </h2>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Let artificial intelligence handle the complexity of tournament planning.
              Get expert recommendations for events, scheduling, pricing, and more—instantly.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                className="glass-card-hover border-0 group animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-hero-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-glow transition-all duration-300">
                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Demo/Preview Section */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 overflow-hidden">
            <CardContent className="p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full mb-4">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-xs font-bold text-primary">EXAMPLE QUESTIONS</span>
                  </div>
                  <h3 className="font-display font-bold text-2xl lg:text-3xl mb-4">
                    Ask AI anything about tournament planning
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    From court requirements to event suggestions, schedule optimization to pricing strategies—
                    our AI assistant has you covered.
                  </p>
                  <Button asChild size="lg" className="bg-hero-gradient hover:shadow-glow">
                    <Link to="/tournament-planner">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Try AI Planner Free
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>

                <div className="space-y-3">
                  {[
                    "How many courts do I need for 64 players?",
                    "What events should I create for different skill levels?",
                    "Help me create an optimal tournament schedule",
                    "How should I price my tournament events?",
                    "What's the best format for my tournament?",
                    "How do I handle skill level divisions?"
                  ].map((question, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-background/80 transition-all duration-200 animate-fade-in"
                      style={{ animationDelay: `${(idx + 4) * 100}ms` }}
                    >
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{question}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <div className="mt-16 text-center">
            <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div>
                <div className="text-4xl font-display font-bold text-primary mb-2">10x</div>
                <p className="text-sm text-muted-foreground">Faster planning process</p>
              </div>
              <div>
                <div className="text-4xl font-display font-bold text-primary mb-2">100%</div>
                <p className="text-sm text-muted-foreground">Data-driven recommendations</p>
              </div>
              <div>
                <div className="text-4xl font-display font-bold text-primary mb-2">24/7</div>
                <p className="text-sm text-muted-foreground">Always available assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIPlannerSection;
