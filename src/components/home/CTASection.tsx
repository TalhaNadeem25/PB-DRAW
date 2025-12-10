import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-ball-yellow/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-court-green-dark/30 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-ball-yellow/20 backdrop-blur-sm mb-8">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-6">
            Ready to Host Your Tournament?
          </h2>
          
          <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Join hundreds of organizers who trust PicklePlay to run professional-grade tournaments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="accent" size="xl" asChild>
              <Link to="/signup">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link to="/tournaments">
                Browse Tournaments
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-primary-foreground/60 mt-6">
            No credit card required • Free for players • Affordable organizer plans
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
