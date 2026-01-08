import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trophy, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Chrome, Apple } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/tournaments');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-16 relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 court-pattern-subtle opacity-30" />
          
          <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
            {/* Logo */}
            <div className="text-center">
              <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
                <div className="w-12 h-12 rounded-xl bg-hero-gradient flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
                  <Trophy className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-display text-2xl font-bold">
                  PICKLE<span className="text-primary">PLAY</span>
                </span>
              </Link>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                Welcome Back
              </h1>
              <p className="text-muted-foreground">
                Enter your credentials to access your account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-12 h-12 text-base bg-muted/50 border-border focus:border-primary focus:ring-primary/20 focus:shadow-glow transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-12 pr-12 h-12 text-base bg-muted/50 border-border focus:border-primary focus:ring-primary/20 focus:shadow-glow transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Remember me for 30 days
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full h-12 text-base shadow-glow hover:shadow-glow-lg transition-all duration-300 group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons (Disabled placeholders) */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 glass border-border/50 hover:bg-muted/50"
                  disabled
                >
                  <Chrome className="w-5 h-5 mr-2" />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 glass border-border/50 hover:bg-muted/50"
                  disabled
                >
                  <Apple className="w-5 h-5 mr-2" />
                  Apple
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Social login coming soon
              </p>
            </form>

            {/* Sign up link */}
            <p className="text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Right side - Visual */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden bg-hero-gradient">
          {/* Floating Orbs */}
          <div className="absolute inset-0">
            <div className="absolute top-20 right-20 w-72 h-72 bg-secondary/30 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute bottom-32 left-20 w-56 h-56 bg-court-green-dark/40 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
            <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-primary-foreground/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "4s" }} />
          </div>
          
          {/* Court pattern */}
          <div className="absolute inset-0 court-pattern opacity-10" />
          
          {/* Decorative pickleball */}
          <div className="absolute bottom-20 right-20 opacity-20">
            <div className="w-24 h-24 rounded-full bg-secondary border-4 border-secondary-foreground/20 animate-bounce-slow" 
                 style={{ animation: 'bounce-gentle 3s ease-in-out infinite' }} />
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
            <div className="glass-dark rounded-3xl p-8 max-w-md text-center backdrop-blur-xl border border-primary-foreground/20 hover:border-primary-foreground/30 transition-colors duration-300 shadow-2xl">
              <div className="w-20 h-20 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-6 shadow-glow-yellow">
                <Trophy className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold text-primary-foreground mb-4">
                Ready to Play?
              </h2>
              <p className="text-primary-foreground/80 mb-6">
                Join thousands of pickleball enthusiasts competing in tournaments across the country.
              </p>
              <div className="flex justify-center gap-8 text-sm text-primary-foreground/60">
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-primary-foreground mb-1">500+</div>
                  <div className="text-xs uppercase tracking-wider">Tournaments</div>
                </div>
                <div className="h-12 w-px bg-primary-foreground/20" />
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-primary-foreground mb-1">15K+</div>
                  <div className="text-xs uppercase tracking-wider">Players</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
