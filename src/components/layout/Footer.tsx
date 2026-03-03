import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Mail, ThumbsUp } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border/60 pt-24 pb-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-20"
        >
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="text-primary">
                <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z" fill="currentColor"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter text-foreground">
                Picklix
              </h2>
            </div>
            <p className="text-muted-foreground text-lg mb-8 max-w-sm">
              The digital backbone of professional and amateur pickleball worldwide.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all" aria-label="Website">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all" aria-label="Email">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all" aria-label="Social">
                <ThumbsUp className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h5 className="text-sm font-display font-black uppercase tracking-widest text-primary mb-8">
              Platform
            </h5>
            <ul className="space-y-4">
              {[
                { to: "/tournaments", label: "Find Tournaments" },
                { to: "/create-tournament", label: "Create Event" },
                { to: "/dashboard", label: "Ranking System" },
                { to: "/about", label: "Rulebook" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h5 className="text-sm font-display font-black uppercase tracking-widest text-primary mb-8">
              Stay Updated
            </h5>
            <p className="text-muted-foreground text-sm mb-4">Get the latest tournament drops and news.</p>
            <div className="flex flex-col gap-2">
              <Input
                type="email"
                placeholder="Email Address"
                className="bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-0 text-foreground placeholder:text-muted-foreground"
              />
              <Button className="bg-primary text-primary-foreground font-display font-black uppercase tracking-widest py-3 rounded-lg text-sm hover:brightness-110 transition-all">
                Subscribe
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Footer Bottom */}
        <div className="pt-8 sm:pt-12 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 text-muted-foreground text-xs font-bold uppercase tracking-widest text-center sm:text-left">
          <p>© {new Date().getFullYear()} Picklix. All Rights Reserved.</p>
          <div className="flex gap-8">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
