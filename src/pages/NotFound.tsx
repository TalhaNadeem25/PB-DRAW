import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Home, Search, Trophy, HelpCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="h-24" />
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-accent/5 rounded-full blur-2xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="text-center relative z-10 max-w-lg mx-auto">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <h1 className="text-[120px] sm:text-[180px] md:text-[220px] font-display font-bold leading-none bg-gradient-to-br from-primary via-primary/60 to-secondary bg-clip-text text-transparent animate-pulse-glow">
            404
          </h1>
          {/* Bouncing pickleball */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-secondary/70 shadow-lg animate-bounce flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-secondary-foreground/20 border-dashed" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="glass-card-hover rounded-2xl p-8 mb-8 animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
            Oops! Page Not Found
          </h2>
          <p className="text-muted-foreground mb-2">
            Looks like this ball went out of bounds!
          </p>
          <p className="text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="hero" className="hover-lift shadow-glow">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="hover-lift glass">
              <Link to="/tournaments">
                <Trophy className="w-4 h-4 mr-2" />
                Tournaments
              </Link>
            </Button>
            <Button asChild variant="outline" className="hover-lift glass">
              <Link to="/discover">
                <Search className="w-4 h-4 mr-2" />
                Discover
              </Link>
            </Button>
          </div>
        </div>

        {/* Help text */}
        <div className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <HelpCircle className="w-4 h-4" />
          <span>Need help? Contact support@pickleplay.com</span>
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default NotFound;
