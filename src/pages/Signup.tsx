import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { ArrowRight, CircleNotch, Eye, EyeSlash, Check } from '@phosphor-icons/react';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { cn } from '@/lib/utils';
import { PbLogo, Eyebrow } from '@/components/ui/pb';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'player',
    skillLevel: '3.0',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [mobileView, setMobileView] = useState<'splash' | 'form'>('splash');
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileInstance>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!acceptedTerms) { setError('You must accept the terms and conditions'); return; }
    if (!turnstileToken) { setError('Please complete the bot verification.'); return; }
    setIsLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        skillLevel: parseFloat(formData.skillLevel),
        phone: formData.phone || undefined,
        turnstileToken,
      });
      navigate('/tournaments');
    } catch {
      setError('Failed to create account. Please try again.');
      turnstileRef.current?.reset();
      setTurnstileToken('');
    } finally {
      setIsLoading(false);
    }
  };

  /* shared input class */
  const inputCls = "w-full h-11 px-4 rounded-[6px] border border-pb-hairline bg-pb-surface2 text-[13px] font-sans text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule";
  const labelCls = "block text-[11px] font-mono uppercase tracking-[0.08em] text-pb-muted mb-1.5";

  return (
    <Layout variant="auth">

      {/* ── Mobile dark splash (< lg) ──────────────────────────────── */}
      {mobileView === 'splash' && (
        <div className="lg:hidden min-h-screen bg-pb-ink flex flex-col px-6 pt-12 pb-10">
          <PbLogo color="#F5F2EB" size={18} />

          <div className="flex-1 flex flex-col justify-center py-10">
            <Eyebrow className="text-pb-amber mb-5">Your draw · Your game</Eyebrow>
            <h1 className="font-display font-extrabold text-[54px] leading-[0.95] tracking-[-0.045em] text-[#F5F2EB]">
              Find your<br />draw.<br />
              <em className="not-italic text-pb-amber">Win it.</em>
            </h1>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setMobileView('form')}
              className="w-full h-[52px] bg-[#F5F2EB] text-pb-ink rounded-[8px] font-sans font-medium text-[14px]"
            >
              Create account with email
            </button>

            <p className="text-center text-[12px] text-[#9C9890] pt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-pb-amber font-medium">Log in</Link>
            </p>
          </div>

          <p className="text-[10px] text-[#6E6A62] text-center mt-6 leading-relaxed">
            By continuing you agree to PB Draw's Terms and Privacy Policy.
          </p>
        </div>
      )}

      {/* ── Full layout (desktop always · mobile form view) ─────────── */}
      <div className={cn("min-h-screen flex flex-col bg-pb-paper font-sans", mobileView === 'splash' ? "hidden lg:flex" : "flex")}>
        <main className="flex-1 flex overflow-hidden">

          {/* Left: brand photo */}
          <div className="hidden lg:flex flex-1 relative overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-50"
              style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCPkWfPl10QRi6Z1IR8Lj41ZRv6lln8mtc12GGmSkrjbkW7nhmyybA5gq49T9l3pCde6ZBYG7-p-VCy4lSnGllwnc1IrO3BU9j7E_Z3Iou8IKpVCl_ePIH1-TfEtimKvSHYk7t103ofIsHTRpH-kVBU68fjGEuvYzkZOVUGAZDpPgtxFiZ5R7pyA0VfJLA-OS74fhHEYmXtNnhW37pC3GcWER3rw_sO4WHhQw7JRfGcLDCZmpQqnX4uhEaca-oQT3Y6PHj0QeX5OIU')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-pb-ink via-pb-ink/60 to-transparent" />
            <div className="relative z-10 flex flex-col justify-end p-16 w-full">
              <h1 className="text-white text-5xl font-display font-black leading-tight tracking-tighter mb-4 uppercase">
                Elevate Your<br/><span className="text-pb-court">Pickleball</span> Game.
              </h1>
              <p className="text-white/70 text-[14px] font-mono max-w-md mb-10">
                Join the fastest-growing community of players and organizers. Manage matches, track performance, and dominate the court.
              </p>
              <div className="flex gap-10">
                <div>
                  <span className="text-pb-court font-display font-black text-3xl">12k+</span>
                  <span className="block text-white/50 text-[10px] font-mono uppercase tracking-[0.08em] mt-1">Players</span>
                </div>
                <div className="w-px bg-white/15 self-stretch" />
                <div>
                  <span className="text-pb-court font-display font-black text-3xl">450+</span>
                  <span className="block text-white/50 text-[10px] font-mono uppercase tracking-[0.08em] mt-1">Clubs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="flex-1 bg-pb-paper overflow-y-auto">
            <div className="max-w-[560px] mx-auto px-6 py-12 lg:py-16 flex flex-col">

              {/* Mobile back button */}
              <div className="lg:hidden flex items-center gap-3 mb-8">
                <button
                  onClick={() => setMobileView('splash')}
                  className="flex items-center gap-1.5 text-[12px] font-mono text-pb-muted hover:text-pb-ink transition-colors"
                >
                  <ArrowRight size={13} className="rotate-180" /> Back
                </button>
              </div>

              <div className="mb-8">
                <h2 className="font-display font-extrabold text-[30px] tracking-[-0.035em] text-pb-ink mb-1.5">
                  Create Your Account
                </h2>
                <p className="text-[13px] font-mono text-pb-muted">Start your journey on the court today.</p>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-8">
                <div className="h-[3px] flex-1 bg-pb-court rounded-full" />
                <div className="h-[3px] flex-1 bg-pb-hairline rounded-full" />
                <span className="ml-2 text-[10px] font-mono text-pb-faint uppercase tracking-[0.08em]">Step 1 of 2</span>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Role selector */}
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-pb-muted mb-3">Choose Your Path</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'player', icon: User, title: 'I am a Player', sub: 'Join tournaments, track stats, and find games.' },
                      { value: 'organizer', icon: Trophy, title: 'I am an Organizer', sub: 'Manage events, handle registrations, and grow your club.' },
                    ].map(({ value, icon: Icon, title, sub }) => (
                      <label
                        key={value}
                        className={cn(
                          "flex flex-col gap-3 p-4 rounded-[6px] border-2 cursor-pointer transition-colors",
                          formData.role === value
                            ? "border-pb-court bg-pb-court-tint2"
                            : "border-pb-hairline bg-pb-surface hover:border-pb-rule"
                        )}
                      >
                        <input type="radio" name="role" value={value} checked={formData.role === value} onChange={() => handleChange('role', value)} className="sr-only" />
                        <div className="flex justify-between items-start">
                          <div className={cn(
                            "w-9 h-9 rounded-[6px] flex items-center justify-center transition-colors",
                            formData.role === value ? "bg-pb-court text-white" : "bg-pb-surface2 text-pb-muted"
                          )}>
                            <Icon size={18} />
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                            formData.role === value ? "border-pb-court" : "border-pb-hairline"
                          )}>
                            {formData.role === value && <div className="w-2.5 h-2.5 bg-pb-court rounded-full" />}
                          </div>
                        </div>
                        <div>
                          <p className="text-[13px] font-display font-bold text-pb-ink">{title}</p>
                          <p className="text-[11px] font-mono text-pb-muted mt-0.5 leading-snug">{sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-[6px] bg-destructive/10 border border-destructive/20 text-destructive text-[13px] font-mono text-center">
                    {error}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <input type="text" className={inputCls} placeholder="John Doe" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
                  </div>
                  <div>
                    <label className={labelCls}>Email Address</label>
                    <input type="email" className={inputCls} placeholder="john@example.com" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} className={cn(inputCls, 'pr-10')} placeholder="At least 6 characters" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pb-muted hover:text-pb-ink">
                        {showPassword ? <EyeSlash size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Confirm Password</label>
                    <input type="password" className={inputCls} placeholder="Re-enter password" value={formData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} required />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Skill Level</label>
                    <select
                      className="w-full h-11 px-4 rounded-[6px] border border-pb-hairline bg-pb-surface2 text-[13px] font-mono text-pb-ink focus:outline-none focus:border-pb-rule"
                      value={formData.skillLevel}
                      onChange={(e) => handleChange('skillLevel', e.target.value)}
                    >
                      <option value="2.5">2.5 — Beginner</option>
                      <option value="3.0">3.0 — Intermediate</option>
                      <option value="3.5">3.5 — Advanced Intermediate</option>
                      <option value="4.0">4.0 — Advanced</option>
                      <option value="4.5">4.5 — Competitive</option>
                      <option value="5.0">5.0 — Pro</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Phone (Optional)</label>
                    <input type="tel" className={inputCls} placeholder="555-0123" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <div
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className={cn(
                      "w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      acceptedTerms ? "bg-pb-court border-pb-court" : "border-pb-rule bg-pb-surface2"
                    )}
                  >
                    {acceptedTerms && <Check size={10} weight="bold" className="text-white" />}
                  </div>
                  <span className="text-[12px] font-mono text-pb-muted leading-relaxed">
                    I agree to the{' '}
                    <Link to="/terms" className="text-pb-ink font-semibold underline underline-offset-2 hover:text-pb-court">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-pb-ink font-semibold underline underline-offset-2 hover:text-pb-court">Privacy Policy</Link>.
                  </span>
                </label>

                <Turnstile
                  ref={turnstileRef}
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken('')}
                  onError={() => setTurnstileToken('')}
                  options={{ theme: 'light', size: 'normal' }}
                />

                <button
                  type="submit"
                  disabled={isLoading || !turnstileToken}
                  className="w-full h-13 py-3.5 rounded-[6px] bg-pb-ink text-white font-display font-black text-[14px] uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-pb-ink/90 transition-colors disabled:opacity-60"
                >
                  {isLoading ? (
                    <><CircleNotch size={16} className="animate-spin" /> Creating Account…</>
                  ) : (
                    <>Continue to Preferences <ArrowRight size={15} /></>
                  )}
                </button>
              </form>

              <div className="mt-10 text-center">
                <p className="text-[11px] font-mono text-pb-faint uppercase tracking-[0.12em]">
                  Trusted by 500+ pickleball organizations worldwide
                </p>
              </div>

              <div className="mt-6 text-center">
                <p className="text-[13px] font-mono text-pb-muted">
                  Already have an account?{' '}
                  <Link to="/login" className="text-pb-court font-semibold hover:underline underline-offset-2">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Mobile progress bar */}
        <div className="lg:hidden fixed bottom-0 left-0 w-full h-[3px] bg-pb-hairline">
          <div className="h-full bg-pb-court w-1/2 rounded-full" />
        </div>
      </div>
    </Layout>
  );
};

export default Signup;
