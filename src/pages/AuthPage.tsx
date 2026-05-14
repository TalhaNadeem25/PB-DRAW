import Layout from '@/components/layout/Layout';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { Eye, EyeSlash, CircleNotch } from '@phosphor-icons/react';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { useGoogleLogin } from '@react-oauth/google';
import { Eyebrow, PbLogo, PbBtn } from '@/components/ui/pb';
import { ArrowRight } from 'lucide-react';

// ── Field primitive (auth-specific) ──────────────────────────────────────────
function Field({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  disabled,
  trailing,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-pb-muted"
      >
        {label}
      </label>
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-pb-surface border border-pb-hairline rounded-[6px] focus-within:border-pb-ink transition-colors">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="flex-1 bg-transparent text-[14px] text-pb-ink placeholder:text-pb-faint font-sans outline-none"
        />
        {trailing}
      </div>
    </div>
  );
}

// ── AuthPage ──────────────────────────────────────────────────────────────────
const AuthPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  const redirectUrl = searchParams.get('redirect') || '/tournaments';

  const [activeTab, setActiveTab] = useState(defaultTab);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'player',
    skillLevel: '3.0',
    phone: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileInstance>(null);

  const { login, register, loginWithGoogle, loginWithApple } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.async = true;
    script.onload = () => {
      (window as any).AppleID?.auth.init({
        clientId: 'com.pbdraw.app.web',
        scope: 'name email',
        redirectURI: 'https://www.pbdraw.com/login',
        usePopup: true,
      });
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await loginWithGoogle(tokenResponse.access_token);
        navigate(redirectUrl);
      } catch {
        setError('Google sign-in failed. Please try again.');
      }
    },
    onError: () => setError('Google sign-in failed. Please try again.'),
  });

  const handleAppleSignIn = async () => {
    try {
      const response = await (window as any).AppleID.auth.signIn();
      await loginWithApple(response.authorization.id_token, response.user);
      navigate(redirectUrl);
    } catch (err: any) {
      if (err?.error !== 'popup_closed_by_user') {
        setError('Apple sign-in failed. Please try again.');
      }
    }
  };

  const handleSignupChange = (field: string, value: string) => {
    setSignupData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) { setError('Please complete the bot verification.'); return; }
    setIsLoading(true);
    setError('');
    try {
      await login(loginEmail, loginPassword, turnstileToken);
      haptics.success();
      navigate(redirectUrl);
    } catch {
      haptics.error();
      setError('Invalid email or password. Please try again.');
      turnstileRef.current?.reset();
      setTurnstileToken('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!acceptedTerms) {
      setError('You must accept the terms and conditions');
      return;
    }
    if (!turnstileToken) { setError('Please complete the bot verification.'); return; }
    setIsLoading(true);
    try {
      await register({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        role: signupData.role,
        skillLevel: parseFloat(signupData.skillLevel),
        phone: signupData.phone || undefined,
        turnstileToken,
      });
      haptics.success();
      navigate(redirectUrl, { state: { fromSignup: true } });
    } catch {
      haptics.error();
      setError('Failed to create account. Please try again.');
      turnstileRef.current?.reset();
      setTurnstileToken('');
    } finally {
      setIsLoading(false);
    }
  };

  const isLogin = activeTab === 'login';

  return (
    <Layout variant="auth">
      <div className="min-h-screen bg-pb-paper grid lg:grid-cols-[1.1fr_1fr]">

        {/* ── Left: editorial panel ─────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between px-14 py-14 border-r border-pb-hairline">
          {/* Top: logo */}
          <PbLogo size={19} />

          {/* Center: headline */}
          <div>
            <Eyebrow className="mb-5">No. 12 · May 2026</Eyebrow>

            <h1
              className="font-display font-extrabold text-pb-ink leading-[0.95]"
              style={{ fontSize: 'clamp(52px, 5.5vw, 76px)', letterSpacing: '-0.045em' }}
            >
              Show up.<br />
              <span className="italic" style={{ color: 'var(--pb-court)' }}>
                Play to it.
              </span>
            </h1>

            <p className="mt-5 text-[15px] text-pb-ink2 leading-[1.55] max-w-[440px]">
              240 open draws this week. Find the right one, snag a partner,
              and let the bracket decide.
            </p>

            {/* Stats */}
            <div className="flex gap-9 mt-9">
              {[['18.4k', 'Players'], ['240', 'Open Draws'], ['28', 'States']].map(([v, l]) => (
                <div key={l}>
                  <div
                    className="font-mono font-medium text-pb-ink leading-none"
                    style={{ fontSize: 28, letterSpacing: '-0.02em', fontFeatureSettings: '"tnum" 1' }}
                  >
                    {v}
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-pb-muted mt-1">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: testimonial */}
          <p className="text-[12.5px] text-pb-muted leading-relaxed max-w-[420px]">
            "Cleanest scoring sheet I've used. The bracket page alone is worth it."
            {' '}<strong className="text-pb-ink font-medium">— Lena, organizer, Bay PB Co.</strong>
          </p>
        </div>

        {/* ── Right: form panel ─────────────────────────────────────────── */}
        <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 xl:px-20 overflow-y-auto">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <PbLogo size={18} />
          </div>

          <div className="w-full max-w-[420px] mx-auto">
            <Eyebrow className="mb-3">
              {isLogin ? 'Welcome back' : 'Join the draw'}
            </Eyebrow>
            <h2
              className="font-display font-bold text-pb-ink"
              style={{ fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1 }}
            >
              {isLogin ? 'Sign in to PB Draw' : 'Create account'}
            </h2>

            {/* Segmented toggle */}
            <div className="flex gap-1 mt-7 p-1 bg-pb-surface border border-pb-hairline rounded-[8px] w-fit">
              {(['login', 'signup'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setError(''); setTurnstileToken(''); turnstileRef.current?.reset(); }}
                  className={cn(
                    "px-3.5 py-1.5 text-[12.5px] font-medium rounded-[6px] transition-colors duration-150",
                    activeTab === tab
                      ? "bg-pb-ink text-white"
                      : "text-pb-muted hover:text-pb-ink"
                  )}
                >
                  {tab === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mt-5 px-4 py-3 rounded-[6px] bg-destructive/8 border border-destructive/20 text-[13px] text-destructive flex justify-between items-center">
                {error}
                <button onClick={() => setError('')} className="opacity-50 hover:opacity-100 ml-3 shrink-0">×</button>
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {isLogin && (
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4 mt-6">
                <Field
                  label="Email"
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(v) => { setLoginEmail(v); setError(''); }}
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                />

                <Field
                  label="Password"
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(v) => { setLoginPassword(v); setError(''); }}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-pb-faint hover:text-pb-muted transition-colors"
                    >
                      {showPassword
                        ? <EyeSlash className="w-4 h-4" />
                        : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <div className="flex items-center justify-between mt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={rememberMe}
                      onCheckedChange={(c) => setRememberMe(c as boolean)}
                      className="rounded-[3px]"
                    />
                    <span className="text-[12.5px] text-pb-muted">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[12.5px] text-pb-ink underline decoration-pb-hairline hover:decoration-pb-ink transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Turnstile
                  ref={turnstileRef}
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken('')}
                  onError={() => setTurnstileToken('')}
                  options={{ theme: 'light', size: 'normal' }}
                />

                <PbBtn
                  type="submit"
                  variant="primary"
                  size="lg"
                  full
                  disabled={isLoading || !turnstileToken}
                  className="mt-2 justify-between"
                >
                  {isLoading ? (
                    <><CircleNotch className="w-4 h-4 animate-spin" /> Signing in…</>
                  ) : (
                    <><span>Sign in</span><ArrowRight size={15} strokeWidth={1.8} /></>
                  )}
                </PbBtn>
              </form>
            )}

            {/* ── SIGNUP FORM ── */}
            {!isLogin && (
              <form onSubmit={handleSignupSubmit} className="flex flex-col gap-4 mt-6">

                {/* Role picker */}
                <div>
                  <div className="font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-pb-muted mb-2.5">
                    I am a
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['player', 'organizer'] as const).map((role) => (
                      <label
                        key={role}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 border rounded-[6px] cursor-pointer transition-colors",
                          signupData.role === role
                            ? "border-pb-ink bg-pb-surface2"
                            : "border-pb-hairline bg-pb-surface hover:border-pb-rule"
                        )}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={signupData.role === role}
                          onChange={() => handleSignupChange('role', role)}
                          className="hidden"
                        />
                        <span
                          className={cn(
                            "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                            signupData.role === role ? "border-pb-ink" : "border-pb-rule"
                          )}
                        >
                          {signupData.role === role && (
                            <span className="w-2 h-2 rounded-full bg-pb-ink block" />
                          )}
                        </span>
                        <span className="text-[13px] font-medium text-pb-ink capitalize">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Full name" id="signup-name" value={signupData.name}
                    onChange={(v) => handleSignupChange('name', v)} placeholder="Jane Smith" required />
                  <Field label="Email" id="signup-email" type="email" value={signupData.email}
                    onChange={(v) => handleSignupChange('email', v)} placeholder="jane@example.com" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Password"
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={signupData.password}
                    onChange={(v) => handleSignupChange('password', v)}
                    placeholder="Min 6 chars"
                    required
                    trailing={
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="text-pb-faint hover:text-pb-muted transition-colors">
                        {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  <Field label="Confirm password" id="signup-confirm" type="password"
                    value={signupData.confirmPassword}
                    onChange={(v) => handleSignupChange('confirmPassword', v)}
                    placeholder="Re-enter" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Skill level — custom select to match field style */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-pb-muted">
                      Skill level
                    </span>
                    <Select value={signupData.skillLevel} onValueChange={(v) => handleSignupChange('skillLevel', v)}>
                      <SelectTrigger className="h-[42px] rounded-[6px] border-pb-hairline bg-pb-surface text-[14px] font-sans focus:ring-0 focus:border-pb-ink">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2.5">2.5 — Beginner</SelectItem>
                        <SelectItem value="3.0">3.0 — Intermediate</SelectItem>
                        <SelectItem value="3.5">3.5 — Advanced Int.</SelectItem>
                        <SelectItem value="4.0">4.0 — Advanced</SelectItem>
                        <SelectItem value="4.5">4.5 — Competitive</SelectItem>
                        <SelectItem value="5.0">5.0 — Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Field label="Phone (optional)" id="signup-phone" type="tel"
                    value={signupData.phone} onChange={(v) => handleSignupChange('phone', v)}
                    placeholder="555-0123" />
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer mt-1">
                  <Checkbox
                    checked={acceptedTerms}
                    onCheckedChange={(c) => setAcceptedTerms(c as boolean)}
                    className="mt-0.5 rounded-[3px]"
                  />
                  <span className="text-[12px] text-pb-muted leading-relaxed">
                    I agree to the{' '}
                    <Link to="/terms" className="text-pb-ink underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-pb-ink underline">Privacy Policy</Link>.
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

                <PbBtn
                  type="submit"
                  variant="primary"
                  size="lg"
                  full
                  disabled={isLoading || !turnstileToken}
                  className="mt-1 justify-between"
                >
                  {isLoading ? (
                    <><CircleNotch className="w-4 h-4 animate-spin" /> Creating account…</>
                  ) : (
                    <><span>Create account</span><ArrowRight size={15} strokeWidth={1.8} /></>
                  )}
                </PbBtn>
              </form>
            )}

            {/* OR divider */}
            <div className="flex items-center gap-3 my-5 text-pb-faint text-[11px]">
              <span className="flex-1 h-px bg-pb-hairline" />
              OR
              <span className="flex-1 h-px bg-pb-hairline" />
            </div>

            {/* Social buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => googleLogin()}
                className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 text-[13px] font-medium text-pb-ink bg-pb-surface border border-pb-hairline rounded-[6px] hover:bg-pb-surface2 transition-colors"
              >
                {/* Google icon */}
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <button
                disabled
                title="Coming soon"
                className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 text-[13px] font-medium text-pb-faint bg-pb-surface border border-pb-hairline rounded-[6px] opacity-50 cursor-not-allowed"
              >
                {/* Apple icon */}
                <svg width="15" height="16" viewBox="0 0 814 1000" fill="currentColor">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 383.8 37.5 258.2 37.5 207.7c0-127.4 53.4-194.7 109.4-250.7 44.8-45.2 100.8-67.9 145.4-67.9 87.5 0 140.4 45.9 210.3 45.9 76.9 0 121.5-54.6 214.5-54.6 33.7 0 112.2 4.2 167.3 65.1z"/>
                </svg>
                Continue with Apple
              </button>
            </div>

            {/* Footer note */}
            <p className="mt-7 text-[12px] text-pb-muted leading-relaxed">
              {isLogin
                ? <>New here? <button onClick={() => setActiveTab('signup')} className="text-pb-ink font-medium hover:underline">Create an account</button> — browse and register first, we ask later.</>
                : <>Already have an account? <button onClick={() => setActiveTab('login')} className="text-pb-ink font-medium hover:underline">Sign in</button>.</>
              }
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuthPage;
