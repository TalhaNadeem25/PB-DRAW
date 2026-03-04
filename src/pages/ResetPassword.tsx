import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Lock, Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { setAuthData } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`,
        { password }
      );

      if (response.data.success) {
        setIsSuccess(true);

        // Auto-login the user with the returned token
        if (response.data.data.token && response.data.data.user) {
          setAuthData(response.data.data.user, response.data.data.token);
        }

        toast({
          title: 'Success',
          description: 'Your password has been reset successfully',
          variant: 'default'
        });

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Invalid or expired reset token. Please request a new password reset.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout variant="auth">
      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md space-y-8 animate-fade-in">
            <div className="glass-card rounded-2xl p-8">
            {/* Logo */}
            <div className="text-center">
              <Link to="/" className="inline-flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-hero-gradient flex items-center justify-center shadow-glow">
                  <Trophy className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-display text-2xl font-bold">
                  PICK<span className="text-primary">LIX</span>
                </span>
              </Link>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                {isSuccess ? 'Password Reset!' : 'Reset Password'}
              </h1>
              <p className="text-muted-foreground">
                {isSuccess ? 'You can now access your account' : 'Enter your new password below'}
              </p>
            </div>

            {!isSuccess ? (
              <>
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter new password"
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
                      <p className="text-sm text-muted-foreground">
                        Must be at least 6 characters long
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className="pl-12 pr-12 h-12 text-base bg-muted/50 border-border focus:border-primary focus:ring-primary/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full h-12 text-base shadow-glow hover:shadow-glow-lg transition-shadow"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>

                {/* Back to login */}
                <p className="text-center text-muted-foreground">
                  Remember your password?{' '}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Back to login
                  </Link>
                </p>
              </>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-primary" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-bold">Password Reset Successful!</h2>
                  <p className="text-muted-foreground">
                    Your password has been changed successfully. You're now logged in.
                  </p>
                </div>

                <div className="bg-muted/50 rounded-xl p-6 space-y-2 text-sm text-muted-foreground">
                  <p>Redirecting you to your dashboard...</p>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full h-12"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Right side - Visual (neutral, no green hero) */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden bg-muted/50 border-l border-border">
          <div className="flex flex-col items-center justify-center w-full p-12">
            <div className="rounded-3xl p-8 max-w-md text-center border border-border bg-card shadow-sm">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                Secure Password Reset
              </h2>
              <p className="text-muted-foreground mb-6">
                Choose a strong password that you haven't used before. Your account security is important to us.
              </p>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Use at least 6 characters</p>
                <p>Include letters and numbers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPassword;
