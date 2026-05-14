import { useState } from "react";
import { Globe, Envelope, ThumbsUp, CaretRight, CircleNotch } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { newsletterAPI } from "@/services/api";
import { toast } from "sonner";
import { PbLogo } from "@/components/ui/pb";

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
    <footer className="bg-pb-surface border-t border-pb-hairline">
      {/* CTA strip */}
      <div className="bg-pb-ink">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-display font-black text-[16px] uppercase tracking-tight text-white">Ready to play?</p>
            <p className="text-[12px] font-mono text-white/60 mt-0.5">Browse upcoming tournaments and register today.</p>
          </div>
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-2 h-9 px-5 rounded-[6px] border border-white/25 text-white font-display font-bold text-[12px] uppercase tracking-wide hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            Browse Tournaments <CaretRight size={13} />
          </Link>
        </div>
      </div>

      <div className="pt-16 pb-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16"
          >
            {/* Brand */}
            <div className="col-span-1">
              <div className="mb-6">
                <PbLogo size={16} />
              </div>
              <p className="text-[13px] font-mono text-pb-muted mb-6 max-w-xs leading-relaxed">
                The digital backbone of professional and amateur pickleball worldwide.
              </p>
              <div className="flex gap-2">
                {[
                  { icon: Globe, label: "Website" },
                  { icon: Envelope, label: "Email" },
                  { icon: ThumbsUp, label: "Social" },
                ].map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="w-9 h-9 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center text-pb-muted hover:bg-pb-court hover:text-white hover:border-pb-court transition-all"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Platform links */}
            <div>
              <h5 className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-court mb-5">Platform</h5>
              <ul className="space-y-2.5">
                {[
                  { to: "/tournaments", label: "Find Tournaments" },
                  { to: "/create-tournament", label: "Create Event" },
                  { to: "/dashboard", label: "Ranking System" },
                  { to: "/live", label: "Live Scores" },
                ].map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-[13px] font-mono text-pb-muted hover:text-pb-ink transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h5 className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-court mb-5">Company</h5>
              <ul className="space-y-2.5">
                {[
                  { to: "/privacy", label: "Privacy Policy" },
                  { to: "/terms", label: "Terms of Service" },
                  { to: "#", label: "About Us" },
                  { to: "/blog", label: "Blog" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-[13px] font-mono text-pb-muted hover:text-pb-ink transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h5 className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-court mb-5">Stay Updated</h5>
              <p className="text-[13px] font-mono text-pb-muted mb-4">Get the latest tournament drops and news.</p>
              <div className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                  className="w-full h-10 px-3 rounded-[6px] border border-pb-hairline bg-pb-paper text-[13px] font-mono text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule"
                />
                <button
                  onClick={handleSubscribe}
                  disabled={loading || !email}
                  className="h-10 rounded-[6px] bg-pb-ink text-white font-display font-black text-[12px] uppercase tracking-wide hover:bg-pb-ink/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <><CircleNotch size={13} className="animate-spin" /> Subscribing…</> : "Subscribe"}
                </button>
              </div>

              {/* App store badges */}
              <div className="mt-5 flex gap-2">
                <div className="h-9 px-3 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center gap-1.5 text-[11px] font-mono text-pb-muted">
                  App Store
                </div>
                <div className="h-9 px-3 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center gap-1.5 text-[11px] font-mono text-pb-muted">
                  Google Play
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer bottom */}
          <div className="pt-8 border-t border-pb-hairline flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono text-pb-faint uppercase tracking-[0.1em] text-center sm:text-left">
            <p>© {new Date().getFullYear()} PB Draw. All Rights Reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-pb-muted transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-pb-muted transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
