import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { AppStoreLogo, ArrowRight, Eye, EyeSlash, CircleNotch } from '@phosphor-icons/react';
import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { cn } from '@/lib/utils';
import { PbLogo, Eyebrow } from '@/components/ui/pb';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobileView, setMobileView] = useState<'splash' | 'form'>('splash');
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileInstance>(null);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) { setError('Please complete the bot verification.'); return; }
    setIsLoading(true);
    setError('');
    try {
      await login(email, password, turnstileToken);
      navigate('/tournaments');
    } catch {
      setError('Invalid email or password. Please try again.');
      turnstileRef.current?.reset();
      setTurnstileToken('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout variant="auth">

      {/* ── Mobile dark splash (< lg) ──────────────────────────────── */}
      {mobileView === 'splash' && (
        <div className="lg:hidden min-h-screen bg-pb-ink flex flex-col px-6 pt-12 pb-10">
          <PbLogo color="#F5F2EB" size={18} />

          <div className="flex-1 flex flex-col justify-center py-10">
            <Eyebrow className="text-pb-amber mb-5">Welcome back</Eyebrow>
            <h1 className="font-display font-extrabold text-[54px] leading-[0.95] tracking-[-0.045em] text-[#F5F2EB]">
              Find your<br />draw.<br />
              <em className="not-italic text-pb-amber">Win it.</em>
            </h1>
          </div>

          <div className="space-y-3">
            <button
              disabled
              title="Coming Soon"
              className="w-full h-[52px] bg-[#F5F2EB] text-pb-ink rounded-[8px] font-sans font-medium text-[14px] flex items-center justify-center gap-2.5 opacity-40 cursor-not-allowed"
            >
              <AppStoreLogo size={17} /> Continue with Apple
            </button>

            <div className="overflow-hidden rounded-[8px]">
              <GoogleLogin
                onSuccess={async (cr) => {
                  try { await loginWithGoogle(cr.credential!); navigate('/tournaments'); }
                  catch { setError('Google sign-in failed. Please try again.'); setMobileView('form'); }
                }}
                onError={() => { setError('Google sign-in failed.'); setMobileView('form'); }}
                width="390"
                theme="outline"
                shape="rectangular"
                text="signin_with"
              />
            </div>

            <button
              onClick={() => setMobileView('form')}
              className="w-full h-[52px] bg-transparent text-[#F5F2EB] border border-[#3A3833] rounded-[8px] font-sans font-medium text-[14px]"
            >
              Continue with email
            </button>

            <p className="text-center text-[12px] text-[#9C9890] pt-2">
              New to the court?{' '}
              <Link to="/signup" className="text-pb-amber font-medium">Create account</Link>
            </p>
          </div>

          <p className="text-[10px] text-[#6E6A62] text-center mt-6 leading-relaxed">
            By continuing you agree to PB Draw's Terms and Privacy Policy.
          </p>
        </div>
      )}

      {/* ── Full layout (desktop always · mobile form view) ─────────── */}
      <div className={cn("min-h-screen flex flex-col lg:flex-row bg-pb-paper font-sans", mobileView === 'splash' ? "hidden lg:flex" : "flex")}>

        {/* Left: brand photo panel */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative overflow-hidden items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuANcBh8658firenMfbo6Fsqiw6eDQlBp_lX5oMiyvz9HHqM_Jd_VxipHbrbU1coa37yAOe9HF3G9ayWR8yaHeAg0QCWwlV-BZH7y9jlClMKtniLg_5AF446YVkwzmODdPD0qa19WWtMsCo7acHQEFgTloRgospSAWsUBkcocmrTXrrY67dn4YMsPkfoSU7_xTwZ1mywWoHEhSxPLinFMMiozYwuZDW5igU-v51FA5LGwI5nkDtZFeFwilrM1kSGLJejRnHji8ZeaFg')` }}
          />
          <div className="absolute inset-0 bg-black/45 flex flex-col justify-end p-20 z-10">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-6">
                <Trophy size={36} className="text-white fill-current" />
                <h2 className="text-3xl font-display font-black tracking-tighter text-white">PB DRAW</h2>
              </div>
              <h1 className="text-white text-5xl font-display font-black leading-tight mb-4">
                Master the court,<br/>manage the game.
              </h1>
              <p className="text-white/75 text-[15px] font-mono max-w-md">
                The ultimate hub for pickleball enthusiasts. Access your tournaments, track rankings, and join the fastest-growing sports community.
              </p>
            </div>
          </div>
          <div className="absolute top-10 left-10 w-20 h-20 border-l-[3px] border-t-[3px] border-white/30 z-20" />
        </div>

        {/* Right: form panel */}
        <div className="flex w-full flex-col lg:w-1/2 xl:w-5/12 bg-pb-paper px-6 py-10 sm:px-14 lg:px-16 xl:px-20 justify-center overflow-y-auto">
          <div className="w-full max-w-md mx-auto">

            {/* Mobile back button (email form view) */}
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
                Welcome back
              </h2>
              <p className="text-[13px] font-mono text-pb-muted">Enter your credentials to access the rally.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-[6px] bg-destructive/10 border border-destructive/20 text-destructive text-[13px] font-mono">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-[0.08em] text-pb-muted mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-[6px] border border-pb-hairline bg-pb-surface2 text-[13px] font-sans text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule"
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-pb-muted">Password</label>
                  <Link to="/forgot-password" className="text-[11px] font-mono text-pb-court hover:underline underline-offset-2">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-4 pr-11 rounded-[6px] border border-pb-hairline bg-pb-surface2 text-[13px] font-sans text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pb-muted hover:text-pb-ink"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={cn(
                    "w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors cursor-pointer",
                    rememberMe ? "bg-pb-court border-pb-court" : "border-pb-rule bg-pb-surface2"
                  )}
                >
                  {rememberMe && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-[12px] font-mono text-pb-muted">Remember me on this device</span>
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
                className="w-full h-12 rounded-[6px] bg-pb-ink text-white font-display font-bold text-[14px] uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-pb-ink/90 transition-colors disabled:opacity-60"
              >
                {isLoading ? (
                  <><CircleNotch size={16} className="animate-spin" /> Signing In…</>
                ) : (
                  <>Sign In <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            {/* Social login */}
            <div className="mt-8">
              <div className="relative flex items-center mb-6">
                <div className="flex-grow border-t border-pb-hairline" />
                <span className="flex-shrink mx-4 text-[10px] font-mono text-pb-faint uppercase tracking-[0.12em]">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-pb-hairline" />
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      try {
                        await loginWithGoogle(credentialResponse.credential!);
                        navigate('/tournaments');
                      } catch {
                        setError('Google sign-in failed. Please try again.');
                      }
                    }}
                    onError={() => setError('Google sign-in failed. Please try again.')}
                    width="360"
                    theme="outline"
                    shape="rectangular"
                    text="signin_with"
                  />
                </div>
                <button
                  disabled
                  title="Coming Soon"
                  className="flex items-center justify-center gap-2.5 h-10 px-4 rounded-[6px] border border-pb-hairline opacity-40 cursor-not-allowed"
                >
                  <AppStoreLogo size={16} className="text-pb-ink" />
                  <span className="text-[13px] font-mono text-pb-ink">Apple</span>
                </button>
              </div>
            </div>

            <div className="mt-10 text-center">
              <p className="text-[13px] font-mono text-pb-muted">
                New to the court?{' '}
                <Link to="/signup" className="text-pb-court font-semibold hover:underline underline-offset-2">
                  Create an account
                </Link>
              </p>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[10px] font-mono text-pb-faint uppercase tracking-[0.12em] leading-relaxed">
                By logging in, you agree to PB Draw's{' '}
                <Link to="/terms" className="hover:text-pb-muted underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="hover:text-pb-muted underline">Privacy Policy</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
