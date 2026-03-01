import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, Trophy, Calendar, Users, Sparkles, Ticket, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const paymentIntent = searchParams.get("payment_intent");
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, [paymentIntent]);

  return (
    <Layout variant="auth">
      <div className="min-h-screen bg-mesh-gradient flex items-center justify-center p-4 relative overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        {/* Confetti effect */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10%`,
                  backgroundColor: ['#16a34a', '#eab308', '#3b82f6', '#ec4899', '#f97316'][Math.floor(Math.random() * 5)],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="max-w-lg w-full glass-card rounded-2xl p-8 relative z-10 animate-fade-in overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-hero-gradient" />
          <div className="relative z-10 pt-6 text-center">
            <div className="relative mx-auto mb-6">
              <div className="w-24 h-24 rounded-full bg-hero-gradient flex items-center justify-center shadow-glow animate-pulse-glow">
                <CheckCircle2 className="w-14 h-14 text-primary-foreground" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-secondary animate-bounce" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient mb-2">
              Payment Successful!
            </h1>
            <p className="text-lg text-muted-foreground">You're all set for the tournament</p>
          </div>

          <div className="space-y-8 relative z-10 pb-10 mt-8">
            {/* Success message */}
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl space-y-3">
              <div className="flex items-center gap-3 text-primary">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Registration Confirmed</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Thank you for your payment. You'll receive a confirmation email shortly with all the details about your tournament registration.
              </p>
            </div>

            {/* What's next — clear CTAs (audit 2.3) */}
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg">What&apos;s Next?</h3>
              <div className="grid gap-3">
                <Link
                  to="/tickets"
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-primary/20 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">View my tickets</p>
                    <p className="text-xs text-muted-foreground">QR code for check-in</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
                <Link
                  to="/teams"
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-primary/20 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">Manage team</p>
                    <p className="text-xs text-muted-foreground">Invite partner or view details</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </div>
            </div>

            {/* Primary action first */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="hero" className="flex-1 h-12 hover-lift shadow-glow" asChild>
                <Link to="/tickets">
                  <Ticket className="w-4 h-4 mr-2" />
                  View my tickets
                </Link>
              </Button>
              <Button variant="outline" className="flex-1 h-12 hover-lift" asChild>
                <Link to="/dashboard">
                  <Trophy className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" className="h-12" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSuccess;
