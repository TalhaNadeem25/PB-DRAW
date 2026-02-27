import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Kept for skill level
import { Trophy, User, ArrowRight, Loader2, Play, Eye, EyeOff } from 'lucide-react';
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
    
    if (!acceptedTerms) {
        setError('You must accept the terms and conditions');
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
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout variant="auth">
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <main className="flex-1 flex overflow-hidden">
        {/* Split Layout: Left Panel (Visual) */}
        <div className="hidden lg:flex flex-1 relative bg-sidebar-primary overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-40">
                <div 
                    className="w-full h-full bg-center bg-cover" 
                    style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCPkWfPl10QRi6Z1IR8Lj41ZRv6lln8mtc12GGmSkrjbkW7nhmyybA5gq49T9l3pCde6ZBYG7-p-VCy4lSnGllwnc1IrO3BU9j7E_Z3Iou8IKpVCl_ePIH1-TfEtimKvSHYk7t103ofIsHTRpH-kVBU68fjGEuvYzkZOVUGAZDpPgtxFiZ5R7pyA0VfJLA-OS74fhHEYmXtNnhW37pC3GcWER3rw_sO4WHhQw7JRfGcLDCZmpQqnX4uhEaca-oQT3Y6PHj0QeX5OIU')` }}
                ></div>
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-sidebar-primary via-transparent to-transparent z-10"></div>
            
            <div className="relative z-20 flex flex-col justify-end p-16 w-full">
                <h1 className="text-primary-foreground text-5xl font-display font-black leading-tight tracking-tight mb-4">
                    Elevate Your <br/><span className="text-primary">Pickleball</span> Game.
                </h1>
                <p className="text-primary-foreground/80 text-lg max-w-md font-sans">
                    Join the fastest-growing community of players and organizers. Manage matches, track performance, and dominate the court.
                </p>
                <div className="mt-12 flex gap-8">
                    <div className="flex flex-col">
                        <span className="text-primary text-3xl font-display font-bold">12k+</span>
                        <span className="text-primary-foreground/60 text-xs uppercase tracking-widest font-medium">Players</span>
                    </div>
                    <div className="w-px h-12 bg-primary-foreground/20"></div>
                    <div className="flex flex-col">
                        <span className="text-primary text-3xl font-display font-bold">450+</span>
                        <span className="text-primary-foreground/60 text-xs uppercase tracking-widest font-medium">Clubs</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Split Layout: Right Panel (Registration Form) */}
        <div className="flex-1 bg-background overflow-y-auto">
          <div className="max-w-[580px] mx-auto px-6 py-12 lg:py-20 flex flex-col">
            {/* Headline Section */}
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-foreground text-3xl font-display font-bold tracking-tight mb-2">Create Your Account</h2>
              <p className="text-muted-foreground">Start your journey on the court today.</p>
            </div>

            {/* Step Header */}
            <div className="flex items-center gap-2 mb-8">
              <div className="h-1 flex-1 bg-primary rounded-full"></div>
              <div className="h-1 flex-1 bg-muted rounded-full"></div>
              <span className="ml-2 text-xs font-bold text-muted-foreground uppercase tracking-tighter">Step 1 of 2</span>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Choose Your Path */}
                <div>
                  <h3 className="text-foreground text-base font-bold mb-4 font-display">Choose Your Path</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Player Card */}
                    <label 
                        className={cn(
                            "group relative flex flex-col gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all hover:bg-primary/5",
                            formData.role === 'player' 
                                ? "border-primary bg-primary/5 shadow-sm" 
                                : "border-border bg-card hover:border-primary/50"
                        )}
                    >
                      <input 
                        type="radio" 
                        name="role" 
                        value="player" 
                        checked={formData.role === 'player'}
                        onChange={() => handleChange('role', 'player')}
                        className="hidden"
                      />
                      <div className="flex justify-between items-start">
                        <div className={cn(
                            "size-10 rounded-lg flex items-center justify-center transition-colors",
                            formData.role === 'player' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                        )}>
                          <User className="size-6" />
                        </div>
                        <div className={cn(
                            "size-5 rounded-full border-2 flex items-center justify-center transition-colors",
                            formData.role === 'player' ? "border-primary" : "border-muted-foreground/30"
                        )}>
                          {formData.role === 'player' && <div className="size-2.5 bg-primary rounded-full"></div>}
                        </div>
                      </div>
                      <div>
                        <p className="text-foreground text-base font-bold font-display">I am a Player</p>
                        <p className="text-muted-foreground text-sm leading-snug">Join tournaments, track stats, and find games.</p>
                      </div>
                    </label>

                    {/* Organizer Card */}
                    <label 
                        className={cn(
                            "group relative flex flex-col gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all hover:bg-primary/5",
                            formData.role === 'organizer' 
                                ? "border-primary bg-primary/5 shadow-sm" 
                                : "border-border bg-card hover:border-primary/50"
                        )}
                    >
                      <input 
                        type="radio" 
                        name="role" 
                        value="organizer" 
                        checked={formData.role === 'organizer'}
                        onChange={() => handleChange('role', 'organizer')}
                        className="hidden"
                      />
                      <div className="flex justify-between items-start">
                        <div className={cn(
                            "size-10 rounded-lg flex items-center justify-center transition-colors",
                            formData.role === 'organizer' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                        )}>
                          <Trophy className="size-6" />
                        </div>
                        <div className={cn(
                            "size-5 rounded-full border-2 flex items-center justify-center transition-colors",
                            formData.role === 'organizer' ? "border-primary" : "border-muted-foreground/30"
                        )}>
                          {formData.role === 'organizer' && <div className="size-2.5 bg-primary rounded-full"></div>}
                        </div>
                      </div>
                      <div>
                        <p className="text-foreground text-base font-bold font-display">I am an Organizer</p>
                        <p className="text-muted-foreground text-sm leading-snug">Manage events, handle registrations, and grow your club.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                {/* Registration Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="name" className="text-foreground text-sm font-semibold">Full Name</Label>
                        <Input 
                            id="name"
                            value={formData.name} 
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="h-12 px-4 bg-card focus-visible:ring-primary" 
                            placeholder="John Doe" 
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="email" className="text-foreground text-sm font-semibold">Email Address</Label>
                        <Input 
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="h-12 px-4 bg-card focus-visible:ring-primary" 
                            placeholder="john@example.com" 
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="password" className="text-foreground text-sm font-semibold">Password</Label>
                        <div className="relative">
                            <Input 
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                className="h-12 px-4 bg-card focus-visible:ring-primary pr-10" 
                                placeholder="At least 6 characters" 
                                required
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="confirmPassword" className="text-foreground text-sm font-semibold">Confirm Password</Label>
                        <Input 
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                            className="h-12 px-4 bg-card focus-visible:ring-primary" 
                            placeholder="Re-enter password" 
                            required
                        />
                    </div>
                </div>

                {/* Additional Fields (Skill/Phone) - Keeping functionality but styling simply */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                     <div className="flex flex-col gap-2">
                        <Label htmlFor="skillLevel" className="text-foreground text-sm font-semibold">Skill Level</Label>
                        <Select 
                            value={formData.skillLevel} 
                            onValueChange={(value) => handleChange('skillLevel', value)}
                        >
                            <SelectTrigger className="h-12 bg-card focus:ring-primary">
                                <SelectValue placeholder="Select skill" />
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
                     <div className="flex flex-col gap-2">
                        <Label htmlFor="phone" className="text-foreground text-sm font-semibold">Phone (Optional)</Label>
                        <Input 
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="h-12 px-4 bg-card focus-visible:ring-primary" 
                            placeholder="555-0123" 
                        />
                     </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <Checkbox 
                    id="terms" 
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-1 border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer font-normal">
                    I agree to the <Link to="/terms" className="text-foreground font-bold underline underline-offset-2 hover:text-primary">Terms of Service</Link> and <Link to="/privacy" className="text-foreground font-bold underline underline-offset-2 hover:text-primary">Privacy Policy</Link>.
                  </Label>
                </div>

                <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-14 rounded-xl text-base font-black tracking-wide shadow-md hover:scale-[1.01] active:scale-95 transition-all text-primary-foreground bg-primary hover:bg-primary/90"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Creating Account...
                        </>
                    ) : (
                        <>
                            <span>Continue to Preferences</span>
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                    )}
                </Button>
            </form>

            <div className="mt-12 text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">
                    Trusted by 500+ pickleball organizations worldwide
                </p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Progress Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full h-1.5 bg-border">
        <div className="h-full bg-hero-gradient w-1/2"></div>
      </div>
    </div>
    </Layout>
  );
};

export default Signup;
