import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { statsAPI } from "@/services/api";
import { ArrowRight, Trophy, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";

const CTASection = () => {
  const { data } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => statsAPI.getPublic(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const organizersCount = data?.data?.organizersCount ?? 0;

  return (
    <section className="py-28 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-hero-gradient" />
      
      {/* Mesh overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-court-green-dark/40 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-ball-yellow/20 rounded-full blur-3xl animate-pulse-slow" />
      </div>
      
      {/* Court pattern */}
      <div className="absolute inset-0 court-pattern opacity-10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          {/* Glass card */}
          <div className="glass-dark rounded-3xl p-12 md:p-16 text-center backdrop-blur-xl border border-primary-foreground/10">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-secondary/20 backdrop-blur-sm mb-8"
            >
              <Trophy className="w-10 h-10 text-primary-foreground" />
            </motion.div>
            
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-primary-foreground">Start for free today</span>
            </motion.div>
            
            {/* Headline */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-6">
              Ready to Host Your
              <br />
              <span className="text-secondary">Epic Tournament?</span>
            </h2>
            
            <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
              {organizersCount > 0
                ? `Join ${organizersCount}+ organizers who trust Picklix to run professional-grade tournaments.`
                : "Join organizers who trust Picklix to run professional-grade tournaments."}
            </p>
            
            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button variant="accent" size="xl" className="group shadow-glow-yellow hover:shadow-[0_0_60px_hsl(45_95%_55%/0.4)] transition-shadow" asChild>
                <Link to="/signup">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/tournaments">
                  Browse Tournaments
                </Link>
              </Button>
            </motion.div>
            
            {/* Trust indicators */}
            <div className="mt-12 pt-8 border-t border-primary-foreground/10">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-primary-foreground/60">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <span>4.9/5 rating</span>
                </div>
                <span className="hidden md:block">•</span>
                <span>No credit card required</span>
                <span className="hidden md:block">•</span>
                <span>Free for players</span>
                <span className="hidden md:block">•</span>
                <span>Affordable organizer plans</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
