import { Star } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "The live bracket updates saved us hours of answering 'when do we play next'. Worth every penny.",
      author: "Sarah J.",
      role: "Tournament Director",
      image: "https://i.pravatar.cc/150?u=sarah"
    },
    {
      quote: "Finally a platform that feels like it belongs in this decade. Finding a partner was incredibly easy.",
      author: "Michael T.",
      role: "4.5 Player",
      image: "https://i.pravatar.cc/150?u=michael"
    },
    {
      quote: "We switched from pickleball brackets last month. Registration conversion is up 40%.",
      author: "David R.",
      role: "Club Owner",
      image: "https://i.pravatar.cc/150?u=david"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tight text-foreground mb-4">
            Trusted by the best
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
            See why top clubs and organizers are making the switch to Pickle Rally.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <div className="flex gap-1 mb-6">
                {[1,2,3,4,5].map(star => <Star key={star} className="w-5 h-5 text-amber fill-amber" />)}
              </div>
              <p className="text-foreground font-medium text-lg leading-relaxed mb-8 flex-1 italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <img src={t.image} alt={t.author} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
                <div>
                  <p className="font-display font-bold text-foreground tracking-wide">{t.author}</p>
                  <p className="text-sm text-primary font-bold uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default TestimonialsSection;
