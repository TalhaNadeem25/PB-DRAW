import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Apple, ArrowRight, Chrome, Eye, EyeOff, Loader2, Trophy, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  const redirectUrl = searchParams.get('redirect') || '/tournaments';

  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Shared state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login specific state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Signup specific state
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

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSignupChange = (field: string, value: string) => {
    setSignupData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(loginEmail, loginPassword);
      navigate(redirectUrl);
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password. Please try again.');
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

    setIsLoading(true);

    try {
      await register({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        role: signupData.role,
        skillLevel: parseFloat(signupData.skillLevel),
        phone: signupData.phone || undefined,
      });
      navigate(redirectUrl, { state: { fromSignup: true } });
    } catch (error) {
      console.error('Signup error:', error);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout variant="auth">
      <div className="min-h-screen flex flex-col lg:flex-row bg-background font-sans">
        <div className="h-6" />

        {/* Left Side: Hero Brand Experience */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 relative overflow-hidden items-center justify-center bg-sidebar-primary">  
          <div className="absolute inset-0 bg-cover bg-center opacity-40" 
            style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuANcBh8658firenMfbo6Fsqiw6eDQlBp_lX5oMiyvz9HHqM_Jd_VxipHbrbU1coa37yAOe9HF3G9ayWR8yaHeAg0QCWwlV-BZH7y9jlClMKtniLg_5AF446YVkwzmODdPD0qa19WWtMsCo7acHQEFgTloRgospSAWsUBkcocmrTXrrY67dn4YMsPkfoSU7_xTwZ1mywWoHEhSxPLinFMMiozYwuZDW5igU-v51FA5LGwI5nkDtZFeFwilrM1kSGLJejRnHji8ZeaFg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sidebar-primary via-transparent to-transparent z-10" />
          
          <div className="relative z-20 flex flex-col justify-end p-16 w-full">
            <div className="flex items-center gap-3 text-primary mb-6 animate-fade-in">
                <Trophy className="w-10 h-10 fill-current" />
                <h2 className="text-3xl font-display font-black tracking-tighter text-white">PICKLE RALLY</h2>
            </div>
            <h1 className="text-white text-5xl font-display font-black leading-tight mb-4 animate-slide-up">
              Master the court, <br/>manage the game.
            </h1>
            <p className="text-white/80 text-lg font-light max-w-md font-sans animate-slide-up" style={{ animationDelay: '0.1s' }}>
              The ultimate hub for pickleball enthusiasts. Access your tournaments, track rankings, and join the fastest-growing sports community.
            </p>
            <div className="mt-12 flex gap-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex flex-col">
                  <span className="text-primary text-3xl font-display font-bold">Play</span>
                  <span className="text-primary-foreground/60 text-xs uppercase tracking-widest font-medium">Tournaments</span>
              </div>
              <div className="w-px h-12 bg-primary-foreground/20"></div>
              <div className="flex flex-col">
                  <span className="text-primary text-3xl font-display font-bold">Manage</span>
                  <span className="text-primary-foreground/60 text-xs uppercase tracking-widest font-medium">Events</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form with Tabs */}
        <div className="flex w-full flex-col lg:w-1/2 xl:w-7/12 bg-background px-6 py-10 sm:px-10 lg:px-16 xl:px-20 justify-center overflow-y-auto">
          <div className="w-full max-w-xl mx-auto">
            
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2 mb-10 text-primary">
                <Trophy className="w-8 h-8 fill-current" />
                <span className="text-xl font-bold font-display text-foreground">Pickle Rally</span>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="login" className="rounded-lg font-display uppercase font-bold tracking-widest text-xs py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg font-display uppercase font-bold tracking-widest text-xs py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Create Account
                </TabsTrigger>
              </TabsList>

              {/* Error Message Global */}
              {error && (
                  <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 flex items-center justify-between">
                      {error}
                      <button onClick={() => setError('')} className="opacity-50 hover:opacity-100">×</button>
                  </div>
              )}

              {/* === LOGIN TAB === */}
              <TabsContent value="login" className="space-y-6 animate-in fade-in-50 duration-500">
                <div className="mb-8">
                  <h2 className="text-3xl font-display font-bold text-foreground mb-2">Welcome back</h2>
                  <p className="text-muted-foreground">Enter your credentials to access the rally.</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="login-email" className="text-foreground text-sm font-semibold">Email Address</Label>
                    <Input 
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="h-12 px-4 bg-transparent focus:border-primary focus:ring-primary/20" 
                      placeholder="name@example.com" 
                      required 
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="login-password" className="text-foreground text-sm font-semibold">Password</Label>
                      <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">Forgot Password?</Link>
                    </div>
                    <div className="relative flex items-center">
                      <Input 
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="h-12 px-4 pr-12 bg-transparent focus:border-primary focus:ring-primary/20" 
                        placeholder="••••••••" 
                        required 
                        disabled={isLoading}
                      />
                      <button 
                        type="button" 
                        className="absolute right-4 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer font-normal">
                      Remember me on this device
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg"
                    className="w-full h-12 mt-4 font-display font-bold rounded-xl shadow-glow hover:shadow-glow-lg transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin mr-2" />Signing In...</>
                    ) : (
                      <><span>Sign In</span><ArrowRight className="w-5 h-5 ml-2" /></>
                    )}
                  </Button>
                </form>

                {/* Social Login */}
                <div className="mt-8">
                  <div className="relative flex items-center mb-6">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="flex-shrink mx-4 text-xs font-medium text-muted-foreground uppercase tracking-widest">Or continue with</span>
                    <div className="flex-grow border-t border-border"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <Chrome className="w-4 h-4" />
                      <span className="text-sm font-semibold text-foreground">Google</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <Apple className="w-4 h-4 text-foreground" />
                      <span className="text-sm font-semibold text-foreground">Apple</span>
                    </button>
                  </div>
                </div>
              </TabsContent>

              {/* === SIGNUP TAB === */}
              <TabsContent value="signup" className="space-y-6 animate-in fade-in-50 duration-500">
                <div className="mb-6">
                  <h2 className="text-foreground text-3xl font-display font-bold tracking-tight mb-2">Create Account</h2>
                  <p className="text-muted-foreground">Start your journey on the court today.</p>
                </div>

                <form onSubmit={handleSignupSubmit} className="flex flex-col gap-6">
                  {/* Role Selection */}
                  <div>
                    <h3 className="text-foreground text-sm font-semibold mb-3">Choose Your Path</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Player Radio */}
                      <label className={cn(
                        "group relative flex flex-col gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        signupData.role === 'player' ? "border-primary bg-primary/5" : "border-border bg-transparent hover:border-primary/50"
                      )}>
                        <input type="radio" className="hidden" value="player" checked={signupData.role === 'player'} onChange={() => handleSignupChange('role', 'player')} />
                        <div className="flex justify-between items-start">
                          <div className={cn("size-8 rounded-lg flex items-center justify-center", signupData.role === 'player' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <User className="size-5" />
                          </div>
                          <div className={cn("size-5 rounded-full border-2 flex items-center justify-center", signupData.role === 'player' ? "border-primary" : "border-muted-foreground/30")}>
                            {signupData.role === 'player' && <div className="size-2.5 bg-primary rounded-full" />}
                          </div>
                        </div>
                        <div>
                          <p className="font-bold font-display text-sm">Player</p>
                          <p className="text-muted-foreground text-xs">Join tournaments & track stats.</p>
                        </div>
                      </label>

                      {/* Organizer Radio */}
                      <label className={cn(
                        "group relative flex flex-col gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        signupData.role === 'organizer' ? "border-primary bg-primary/5" : "border-border bg-transparent hover:border-primary/50"
                      )}>
                        <input type="radio" className="hidden" value="organizer" checked={signupData.role === 'organizer'} onChange={() => handleSignupChange('role', 'organizer')} />
                        <div className="flex justify-between items-start">
                          <div className={cn("size-8 rounded-lg flex items-center justify-center", signupData.role === 'organizer' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <Trophy className="size-5" />
                          </div>
                          <div className={cn("size-5 rounded-full border-2 flex items-center justify-center", signupData.role === 'organizer' ? "border-primary" : "border-muted-foreground/30")}>
                            {signupData.role === 'organizer' && <div className="size-2.5 bg-primary rounded-full" />}
                          </div>
                        </div>
                        <div>
                          <p className="font-bold font-display text-sm">Organizer</p>
                          <p className="text-muted-foreground text-xs">Manage events & clubs.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Core Form Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="signup-name" className="text-sm font-semibold">Full Name</Label>
                      <Input id="signup-name" value={signupData.name} onChange={(e) => handleSignupChange('name', e.target.value)} className="h-11" placeholder="John Doe" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="signup-email" className="text-sm font-semibold">Email</Label>
                      <Input id="signup-email" type="email" value={signupData.email} onChange={(e) => handleSignupChange('email', e.target.value)} className="h-11" placeholder="john@example.com" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2 relative">
                      <Label htmlFor="signup-password" className="text-sm font-semibold">Password</Label>
                      <Input id="signup-password" type={showPassword ? 'text' : 'password'} value={signupData.password} onChange={(e) => handleSignupChange('password', e.target.value)} className="h-11 pr-10" placeholder="Min 6 chars" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-muted-foreground">
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="signup-confirm" className="text-sm font-semibold">Confirm Password</Label>
                      <Input id="signup-confirm" type="password" value={signupData.confirmPassword} onChange={(e) => handleSignupChange('confirmPassword', e.target.value)} className="h-11" placeholder="Re-enter password" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="skillLevel" className="text-sm font-semibold">Skill Level</Label>
                      <Select value={signupData.skillLevel} onValueChange={(val) => handleSignupChange('skillLevel', val)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select skill" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2.5">2.5 - Beginner</SelectItem>
                          <SelectItem value="3.0">3.0 - Intermediate</SelectItem>
                          <SelectItem value="3.5">3.5 - Advanced Int.</SelectItem>
                          <SelectItem value="4.0">4.0 - Advanced</SelectItem>
                          <SelectItem value="4.5">4.5 - Competitive</SelectItem>
                          <SelectItem value="5.0">5.0 - Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="phone" className="text-sm font-semibold">Phone (Optional)</Label>
                      <Input id="phone" type="tel" value={signupData.phone} onChange={(e) => handleSignupChange('phone', e.target.value)} className="h-11" placeholder="555-0123" />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)} className="mt-1" />
                    <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer font-normal">
                      I agree to the <Link to="/terms" className="font-bold underline">Terms of Service</Link> and <Link to="/privacy" className="font-bold underline">Privacy Policy</Link>.
                    </Label>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full h-12 mt-2 font-display font-bold uppercase tracking-widest rounded-xl shadow-glow">
                    {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</> : <><User className="mr-2 h-4 w-4" /> Create Account</>}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-12 text-center pb-8">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                    Protected by reCAPTCHA and subject to the <br/> Google Privacy Policy and Terms of Service.
                </p>
            </div>
            
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuthPage;
