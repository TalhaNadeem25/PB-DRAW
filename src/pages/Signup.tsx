import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trophy, Mail, Lock, User, Phone, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, XCircle, Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        skillLevel: parseFloat(formData.skillLevel),
        phone: formData.phone || undefined,
      });
      navigate('/tournaments');
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 25, label: 'Too short', color: 'bg-destructive' };
    if (password.length < 8) return { strength: 50, label: 'Weak', color: 'bg-warning' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 100, label: 'Strong', color: 'bg-success' };
    }
    return { strength: 75, label: 'Good', color: 'bg-primary' };
  };

  const passwordStrength = getPasswordStrength();

  const features = [
    { icon: Trophy, text: 'Find tournaments near you' },
    { icon: Calendar, text: 'Track your match history' },
    { icon: Users, text: 'Connect with other players' },
    { icon: CheckCircle2, text: 'Compete for prizes' },
  ];

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex">
        {/* Left side - Visual */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden bg-hero-gradient">
          {/* Floating Orbs */}
          <div className="absolute inset-0">
            <div className="absolute top-32 left-20 w-72 h-72 bg-secondary/30 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute bottom-20 right-20 w-56 h-56 bg-court-green-dark/40 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
            <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-primary-foreground/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "3s" }} />
          </div>
          
          {/* Court pattern */}
          <div className="absolute inset-0 court-pattern opacity-10" />
          
          {/* Decorative pickleball */}
          <div className="absolute top-20 left-20 opacity-20">
            <div className="w-20 h-20 rounded-full bg-secondary border-4 border-secondary-foreground/20" 
                 style={{ animation: 'bounce-gentle 4s ease-in-out infinite' }} />
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
            <div className="glass-dark rounded-3xl p-8 max-w-md text-center backdrop-blur-xl border border-primary-foreground/20 hover:border-primary-foreground/30 transition-colors duration-300 shadow-2xl">
              <div className="w-20 h-20 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-6 shadow-glow-yellow">
                <Trophy className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold text-primary-foreground mb-4">
                Join the Community
              </h2>
              <p className="text-primary-foreground/80 mb-6">
                Whether you're a casual player or competitive athlete, find tournaments that match your skill level.
              </p>
              <ul className="text-left space-y-4">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-primary-foreground/80 group">
                    <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                      <feature.icon className="w-4 h-4 text-secondary" />
                    </div>
                    <span className="text-sm">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-12 overflow-y-auto relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 court-pattern-subtle opacity-30" />
          
          <div className="w-full max-w-md space-y-6 animate-fade-in relative z-10">
            {/* Logo */}
            <div className="text-center">
              <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
                <div className="w-12 h-12 rounded-xl bg-hero-gradient flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
                  <Trophy className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-display text-2xl font-bold">
                  PICKLE<span className="text-primary">PLAY</span>
                </span>
              </Link>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                Create Account
              </h1>
              <p className="text-muted-foreground">
                Join PicklePlay and start competing
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
                  <XCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-12 h-12 text-base bg-muted/50 focus:shadow-glow transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-12 h-12 text-base bg-muted/50 focus:shadow-glow transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-12 pr-12 h-12 text-base bg-muted/50 focus:shadow-glow transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500", passwordStrength.color)} 
                          style={{ width: `${passwordStrength.strength}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{passwordStrength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-12 h-12 text-base bg-muted/50 focus:shadow-glow transition-all"
                    />
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                    )}
                  </div>
                </div>

                {/* Role Selection Cards */}
                <div className="space-y-2">
                  <Label>I am a...</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange('role', 'player')}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-300 text-left",
                        formData.role === 'player'
                          ? "border-primary bg-primary/5 shadow-glow"
                          : "border-border hover:border-primary/50 bg-muted/30"
                      )}
                    >
                      <User className={cn(
                        "w-6 h-6 mb-2 transition-colors",
                        formData.role === 'player' ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="font-medium">Player</div>
                      <div className="text-xs text-muted-foreground">Join tournaments</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('role', 'organizer')}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-300 text-left",
                        formData.role === 'organizer'
                          ? "border-primary bg-primary/5 shadow-glow"
                          : "border-border hover:border-primary/50 bg-muted/30"
                      )}
                    >
                      <Trophy className={cn(
                        "w-6 h-6 mb-2 transition-colors",
                        formData.role === 'organizer' ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="font-medium">Organizer</div>
                      <div className="text-xs text-muted-foreground">Host events</div>
                    </button>
                  </div>
                </div>

                {/* Skill Level */}
                <div className="space-y-2">
                  <Label htmlFor="skillLevel">Skill Level</Label>
                  <Select
                    value={formData.skillLevel}
                    onValueChange={(value) => handleChange('skillLevel', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-12 bg-muted/50 focus:shadow-glow transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2.5">2.5 - Beginner</SelectItem>
                      <SelectItem value="3.0">3.0 - Intermediate</SelectItem>
                      <SelectItem value="3.5">3.5 - Advanced Intermediate</SelectItem>
                      <SelectItem value="4.0">4.0 - Advanced</SelectItem>
                      <SelectItem value="4.5">4.5 - Competitive</SelectItem>
                      <SelectItem value="5.0">5.0 - Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="555-0123"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      disabled={isLoading}
                      className="pl-12 h-12 text-base bg-muted/50 focus:shadow-glow transition-all"
                    />
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Sign in link */}
            <p className="text-center text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Signup;
