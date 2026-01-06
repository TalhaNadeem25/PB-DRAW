import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md space-y-8 animate-fade-in">
            {/* Logo */}
            <div className="text-center">
              <Link to="/" className="inline-flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-hero-gradient flex items-center justify-center shadow-glow">
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
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-12 h-12 text-base bg-muted/50 border-border focus:border-primary focus:ring-primary/20 transition-all"
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
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-12 pr-12 h-12 text-base bg-muted/50 border-border focus:border-primary focus:ring-primary/20 transition-all"
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
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full h-12 text-base shadow-glow hover:shadow-glow-lg transition-shadow group"
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
          {/* Mesh overlay */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 right-20 w-72 h-72 bg-secondary/30 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute bottom-32 left-20 w-56 h-56 bg-court-green-dark/40 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
          </div>
          
          {/* Court pattern */}
          <div className="absolute inset-0 court-pattern opacity-10" />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
            <div className="glass-dark rounded-3xl p-8 max-w-md text-center backdrop-blur-xl border border-primary-foreground/10">
              <div className="w-20 h-20 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold text-primary-foreground mb-4">
                Ready to Play?
              </h2>
              <p className="text-primary-foreground/80 mb-6">
                Join thousands of pickleball enthusiasts competing in tournaments across the country.
              </p>
              <div className="flex justify-center gap-6 text-sm text-primary-foreground/60">
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-primary-foreground">500+</div>
                  <div>Tournaments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-primary-foreground">15K+</div>
                  <div>Players</div>
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
