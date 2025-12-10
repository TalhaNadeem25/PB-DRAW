import { Link } from "react-router-dom";
import { Trophy, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">
                PICKLE<span className="text-primary">PLAY</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm">
              The ultimate platform for organizing and participating in pickleball tournaments.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-background">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/tournaments" className="text-muted-foreground hover:text-primary transition-colors">
                  Find Tournaments
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* For Organizers */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-background">For Organizers</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/create-tournament" className="text-muted-foreground hover:text-primary transition-colors">
                  Create Tournament
                </Link>
              </li>
              <li>
                <Link to="/organizer-guide" className="text-muted-foreground hover:text-primary transition-colors">
                  Organizer Guide
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-muted-foreground hover:text-primary transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-background">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                support@pickleplay.com
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                (555) 123-4567
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                123 Pickleball Lane<br />
                Austin, TX 78701
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-muted-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 PicklePlay. All rights reserved.
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
