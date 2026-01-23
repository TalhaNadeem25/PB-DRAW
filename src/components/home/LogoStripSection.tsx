const LogoStripSection = () => {
  return (
    <div className="bg-background-dark border-y border-white/5 py-12">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="text-center text-slate-500 text-xs font-display font-black uppercase tracking-[0.3em] mb-10">
          Trusted by 50+ regional associations
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className="h-8 w-32 bg-slate-400 rounded" 
              aria-label="Monochrome sports association logo placeholder"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogoStripSection;
