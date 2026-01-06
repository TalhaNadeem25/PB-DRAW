import { Link } from "react-router-dom";
import { Trophy, Mail, MapPin, Phone, Github, Twitter, Instagram, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  return (
    <footer className="relative bg-foreground text-background overflow-hidden">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-hero-gradient" />
      
      {/* Background mesh effect */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-glow transition-shadow group-hover:shadow-glow-lg">
                <Trophy className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display text-2xl font-bold">
                PICKLE<span className="text-primary">PLAY</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              The ultimate platform for organizing and participating in pickleball tournaments. 
              From local club matches to professional championships.
            </p>
            
            {/* Newsletter */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Stay updated with the latest tournaments</p>
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-background/10 border-background/20 text-background placeholder:text-background/50 focus:border-primary"
                />
                <Button variant="default" size="default" className="shrink-0">
                  Subscribe
                </Button>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Github, href: "#", label: "GitHub" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center hover:bg-primary hover:shadow-glow transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6 text-background">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              {[
                { to: "/tournaments", label: "Find Tournaments" },
                { to: "/live", label: "Live Matches" },
                { to: "/how-it-works", label: "How It Works" },
                { to: "/pricing", label: "Pricing" },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-primary transition-all duration-300 group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Organizers */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6 text-background">For Organizers</h4>
            <ul className="space-y-3 text-sm">
              {[
                { to: "/create-tournament", label: "Create Tournament" },
                { to: "/organizer-guide", label: "Organizer Guide" },
                { to: "/analytics", label: "Analytics Dashboard" },
                { to: "/support", label: "Support" },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-primary transition-all duration-300 group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6 text-background">Contact</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3 text-muted-foreground group">
                <div className="w-8 h-8 rounded-lg bg-background/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <span>support@pickleplay.com</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground group">
                <div className="w-8 h-8 rounded-lg bg-background/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground group">
                <div className="w-8 h-8 rounded-lg bg-background/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span>123 Pickleball Lane<br />Austin, TX 78701</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-destructive fill-destructive animate-pulse" />
            <span>for pickleball enthusiasts</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PicklePlay. All rights reserved.
          </p>
          
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
