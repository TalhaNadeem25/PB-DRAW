import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, Trophy, Calendar, Users, Sparkles } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentIntent = searchParams.get("payment_intent");
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, [paymentIntent]);

  return (
    <Layout>
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

        <Card className="max-w-lg w-full glass border-0 shadow-float relative z-10 animate-scale-in">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-50" />
          
          <CardHeader className="text-center relative z-10 pt-10">
            {/* Animated success icon */}
            <div className="relative mx-auto mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-glow animate-pulse-glow">
                <CheckCircle2 className="w-14 h-14 text-primary-foreground" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-secondary animate-bounce" />
              </div>
            </div>
            
            <CardTitle className="text-3xl md:text-4xl font-display bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              You're all set for the tournament
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 relative z-10 pb-10">
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

            {/* What's next section */}
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg">What's Next?</h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Check Schedule</p>
                    <p className="text-xs text-muted-foreground">View your match times</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Manage Team</p>
                    <p className="text-xs text-muted-foreground">Invite partners or view team details</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="flex-1 h-12 hover-lift"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="hero"
                className="flex-1 h-12 hover-lift shadow-glow"
              >
                <Trophy className="w-4 h-4 mr-2" />
                View Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentSuccess;
