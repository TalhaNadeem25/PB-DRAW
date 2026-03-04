import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Mail, ArrowLeft, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        email
      });

      if (response.data.success) {
        setIsSuccess(true);
        toast({
          title: 'Email sent',
          description: 'If an account exists with that email, we have sent a password reset link.',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong. Please try again.',
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
                Forgot Password?
              </h1>
              <p className="text-muted-foreground">
                No worries, we'll send you reset instructions
              </p>
            </div>

            {!isSuccess ? (
              <>
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
                      <p className="text-sm text-muted-foreground">
                        Enter the email address associated with your account
                      </p>
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
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>

                {/* Back to login */}
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-primary" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-bold">Check Your Email</h2>
                  <p className="text-muted-foreground">
                    We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>
                  </p>
                </div>

                <div className="bg-muted/50 rounded-xl p-6 space-y-2 text-sm text-muted-foreground">
                  <p>Didn't receive the email?</p>
                  <ul className="space-y-1 list-disc list-inside text-left">
                    <li>Check your spam folder</li>
                    <li>Make sure you entered the correct email</li>
                    <li>The link expires in 1 hour</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12"
                    onClick={() => {
                      setIsSuccess(false);
                      setEmail('');
                    }}
                  >
                    Try Another Email
                  </Button>

                  <Link to="/login">
                    <Button
                      variant="ghost"
                      size="lg"
                      className="w-full h-12"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
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
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                Account Recovery
              </h2>
              <p className="text-muted-foreground mb-6">
                We'll help you get back to playing in no time. Check your email for a secure reset link.
              </p>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Reset link expires in 1 hour</p>
                <p>Having trouble? Contact support</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
