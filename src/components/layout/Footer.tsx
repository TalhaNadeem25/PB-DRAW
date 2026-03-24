import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Envelope, ThumbsUp, CaretRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { newsletterAPI } from "@/services/api";
import { toast } from "sonner";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await newsletterAPI.subscribe(email);
      toast.success(res.message || "Successfully subscribed!");
      setEmail("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Subscription failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-card border-t border-border/60">
      {/* CTA Strip */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-lg font-display font-black uppercase tracking-tight">Ready to play?</p>
            <p className="text-sm opacity-90">Browse upcoming tournaments and register today.</p>
          </div>
          <Button
            variant="secondary"
            className="rounded-xl font-display font-bold uppercase tracking-widest whitespace-nowrap"
            asChild
          >
            <Link to="/tournaments" className="inline-flex items-center gap-2">
              Browse Tournaments <CaretRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="pt-20 pb-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-20"
          >
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-8">
                <div className="text-primary">
                  <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z" fill="currentColor"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter text-foreground">
                  PB Draw
                </h2>
              </div>
              <p className="text-muted-foreground text-sm mb-8 max-w-xs">
                The digital backbone of professional and amateur pickleball worldwide.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all" aria-label="Website">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all" aria-label="Email">
                  <Envelope className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all" aria-label="Social">
                  <ThumbsUp className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h5 className="text-sm font-display font-black uppercase tracking-widest text-primary mb-6">
                Platform
              </h5>
              <ul className="space-y-3">
                {[
                  { to: "/tournaments", label: "Find Tournaments" },
                  { to: "/create-tournament", label: "Create Event" },
                  { to: "/dashboard", label: "Ranking System" },
                  { to: "/live", label: "Live Scores" },
                ].map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h5 className="text-sm font-display font-black uppercase tracking-widest text-primary mb-6">
                Company
              </h5>
              <ul className="space-y-3">
                {[
                  { to: "/privacy", label: "Privacy Policy" },
                  { to: "/terms", label: "Terms of Service" },
                  { to: "#", label: "About Us" },
                  { to: "/blog", label: "Blog" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h5 className="text-sm font-display font-black uppercase tracking-widest text-primary mb-6">
                Stay Updated
              </h5>
              <p className="text-muted-foreground text-sm mb-4">Get the latest tournament drops and news.</p>
              <div className="flex flex-col gap-2">
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                  className="bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-0 text-foreground placeholder:text-muted-foreground"
                />
                <Button
                  onClick={handleSubscribe}
                  disabled={loading || !email}
                  className="bg-primary text-primary-foreground font-display font-black uppercase tracking-widest py-3 rounded-lg text-sm hover:brightness-110 transition-all"
                >
                  {loading ? "Subscribing..." : "Subscribe"}
                </Button>
              </div>

              {/* App badges placeholder */}
              <div className="mt-6 flex gap-3">
                <div className="h-10 px-4 rounded-lg bg-muted/60 border border-border/50 flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                  <span>🍎</span> App Store
                </div>
                <div className="h-10 px-4 rounded-lg bg-muted/60 border border-border/50 flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                  <span>▶️</span> Google Play
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer Bottom */}
          <div className="pt-8 sm:pt-12 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 text-muted-foreground text-xs font-bold uppercase tracking-widest text-center sm:text-left">
            <p>© {new Date().getFullYear()} PB Draw. All Rights Reserved.</p>
            <div className="flex gap-8">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
