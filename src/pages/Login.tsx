import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { AppStoreLogo, ArrowRight, Eye, EyeSlash, CircleNotch, Trophy } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/tournaments');
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout variant="auth">
    <div className="min-h-screen flex flex-col lg:flex-row bg-background font-sans">
      

      {/* Left Side: Hero Brand Experience (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative overflow-hidden items-center justify-center">  
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuANcBh8658firenMfbo6Fsqiw6eDQlBp_lX5oMiyvz9HHqM_Jd_VxipHbrbU1coa37yAOe9HF3G9ayWR8yaHeAg0QCWwlV-BZH7y9jlClMKtniLg_5AF446YVkwzmODdPD0qa19WWtMsCo7acHQEFgTloRgospSAWsUBkcocmrTXrrY67dn4YMsPkfoSU7_xTwZ1mywWoHEhSxPLinFMMiozYwuZDW5igU-v51FA5LGwI5nkDtZFeFwilrM1kSGLJejRnHji8ZeaFg')` }}
        ></div>
        
        {/* Branded Overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col justify-end p-20 z-10">
          <div className="max-w-xl">
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
          </div>
        </div>
        
        {/* Decorative Element */}
        <div className="absolute top-10 left-10 w-24 h-24 border-l-4 border-t-4 border-primary/50 z-20"></div>
      </div>

      {/* Right Side: Login Interface — Pattern E */}
      <div className="flex w-full flex-col lg:w-1/2 xl:w-5/12 bg-gradient-to-b from-primary/5 to-transparent lg:from-transparent px-6 py-10 sm:px-16 lg:px-20 xl:px-24 justify-center overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          <div className="glass-card rounded-2xl p-8 animate-fade-in">
            {/* Mobile Logo (Hidden on desktop) */}
            <div className="lg:hidden flex items-center gap-2 mb-10 text-primary">
                <Trophy className="w-8 h-8 fill-current" />
                <span className="text-xl font-bold font-display text-foreground">Pickle Rally</span>
            </div>

            <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-display font-bold text-foreground mb-2">Welcome back</h2>
                <p className="text-muted-foreground">Enter your credentials to access the rally.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Email Field */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="email" className="text-foreground text-sm font-semibold">Email Address</Label>
                    <div className="relative">
                        <Input 
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 px-4 bg-transparent border-input focus:border-primary focus:ring-primary/20" 
                            placeholder="name@example.com" 
                            required 
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="password" className="text-foreground text-sm font-semibold">Password</Label>
                        <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">Forgot Password?</Link>
                    </div>
                    <div className="relative flex items-center">
                        <Input 
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 px-4 pr-12 bg-transparent border-input focus:border-primary focus:ring-primary/20" 
                            placeholder="••••••••" 
                            required 
                            disabled={isLoading}
                        />
                        <button 
                            type="button" 
                            className="absolute right-4 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-3">
                    <Checkbox 
                        id="remember" 
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-input"
                    />
                    <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer transition-colors font-normal">
                        Remember me on this device
                    </Label>
                </div>

                {/* Sign In Button */}
                <Button 
                    type="submit" 
                    variant="default"
                    size="lg"
                    className="w-full h-12 font-display font-bold rounded-xl shadow-glow hover:shadow-glow-lg transition-all"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <CircleNotch className="w-5 h-5 animate-spin mr-2" />
                            Signing In...
                        </>
                    ) : (
                        <>
                            <span>Sign In</span>
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                    )}
                </Button>
            </form>

            {/* Social Login */}
            <div className="mt-10">
                <div className="relative flex items-center mb-8">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="flex-shrink mx-4 text-xs font-medium text-muted-foreground uppercase tracking-widest">Or continue with</span>
                    <div className="flex-grow border-t border-border"></div>
                </div>
                <div className="flex flex-col gap-3">
                    <div onClick={() => console.log('[DEBUG] Google button wrapper clicked')}>
                        <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                                console.log('[DEBUG] Google onSuccess fired', credentialResponse);
                                try {
                                    await loginWithGoogle(credentialResponse.credential!);
                                    navigate('/tournaments');
                                } catch (err) {
                                    console.error('[DEBUG] loginWithGoogle error', err);
                                    setError('Google sign-in failed. Please try again.');
                                }
                            }}
                            onError={() => {
                                console.error('[DEBUG] Google onError fired');
                                setError('Google sign-in failed. Please try again.');
                            }}
                            width="360"
                            theme="outline"
                            shape="rectangular"
                            text="signin_with"
                        />
                    </div>
                    <button disabled title="Coming Soon" className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border opacity-50 cursor-not-allowed">
                        <AppStoreLogo className="w-5 h-5 text-foreground" />
                        <span className="text-sm font-semibold text-foreground">Apple</span>
                    </button>
                </div>
            </div>

            {/* Footer Sign Up */}
            <div className="mt-12 text-center">
                <p className="text-muted-foreground text-sm">
                    New to the court? 
                    <Link to="/signup" className="text-primary font-bold ml-1 hover:underline">Create an account</Link>
                </p>
            </div>
            
            {/* Bottom Disclaimer */}
            <div className="mt-auto pt-10 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                    By logging in, you agree to Pickle Rally's <br/>
                    <Link to="/terms" className="hover:text-primary underline">Terms of Service</Link> and <Link to="/privacy" className="hover:text-primary underline">Privacy Policy</Link>
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default Login;
