import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { ArrowRight, Envelope, CircleNotch, Check } from '@phosphor-icons/react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { PbLogo } from '@/components/ui/pb';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email });
      if (response.data.success) {
        setIsSuccess(true);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout variant="auth">
      <div className="min-h-screen flex flex-col lg:flex-row bg-pb-paper font-sans">

        {/* Left: brand panel */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative overflow-hidden items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuANcBh8658firenMfbo6Fsqiw6eDQlBp_lX5oMiyvz9HHqM_Jd_VxipHbrbU1coa37yAOe9HF3G9ayWR8yaHeAg0QCWwlV-BZH7y9jlClMKtniLg_5AF446YVkwzmODdPD0qa19WWtMsCo7acHQEFgTloRgospSAWsUBkcocmrTXrrY67dn4YMsPkfoSU7_xTwZ1mywWoHEhSxPLinFMMiozYwuZDW5igU-v51FA5LGwI5nkDtZFeFwilrM1kSGLJejRnHji8ZeaFg')` }}
          />
          <div className="absolute inset-0 bg-black/45 flex flex-col justify-end p-20 z-10">
            <div className="max-w-xl">
              <PbLogo color="#F5F2EB" size={18} className="mb-8" />
              <h1 className="text-white text-5xl font-display font-black leading-tight mb-4">
                Back on<br />the court<br />in minutes.
              </h1>
              <p className="text-white/75 text-[15px] font-mono max-w-md">
                Reset your password and get back to managing your tournaments.
              </p>
            </div>
          </div>
          <div className="absolute top-10 left-10 w-20 h-20 border-l-[3px] border-t-[3px] border-white/30 z-20" />
        </div>

        {/* Right: form panel */}
        <div className="flex w-full flex-col lg:w-1/2 xl:w-5/12 bg-pb-paper px-6 py-10 sm:px-14 lg:px-16 xl:px-20 justify-center overflow-y-auto">
          <div className="w-full max-w-md mx-auto">

            <div className="lg:hidden mb-10">
              <PbLogo size={16} />
            </div>

            {!isSuccess ? (
              <>
                <div className="mb-8">
                  <h2 className="font-display font-extrabold text-[30px] tracking-[-0.035em] text-pb-ink mb-1.5">
                    Forgot password?
                  </h2>
                  <p className="text-[13px] font-mono text-pb-muted">
                    No worries — we'll send a reset link to your email.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-[0.08em] text-pb-muted mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Envelope size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pb-faint" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 pl-9 pr-4 rounded-[6px] border border-pb-hairline bg-pb-surface2 text-[13px] font-sans text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule"
                        placeholder="name@example.com"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-[6px] bg-pb-ink text-white font-display font-bold text-[14px] uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-pb-ink/90 transition-colors disabled:opacity-60"
                  >
                    {isLoading ? (
                      <><CircleNotch size={16} className="animate-spin" /> Sending…</>
                    ) : (
                      <>Send Reset Link <ArrowRight size={15} /></>
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <Link
                    to="/login"
                    className="text-[13px] font-mono text-pb-muted hover:text-pb-ink transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowRight size={13} className="rotate-180" /> Back to login
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-pb-court/10 flex items-center justify-center mx-auto mb-6">
                  <Check size={28} className="text-pb-court" />
                </div>
                <h2 className="font-display font-extrabold text-[28px] tracking-[-0.03em] text-pb-ink mb-2">
                  Check your email
                </h2>
                <p className="text-[13px] font-mono text-pb-muted mb-6">
                  We sent a reset link to{' '}
                  <span className="text-pb-ink font-semibold">{email}</span>
                </p>
                <div className="bg-pb-surface2 border border-pb-hairline rounded-[8px] p-5 text-left mb-8">
                  <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-pb-muted mb-2">Didn't receive it?</p>
                  <ul className="space-y-1.5 text-[12px] font-mono text-pb-muted list-disc list-inside">
                    <li>Check your spam folder</li>
                    <li>Make sure you entered the correct email</li>
                    <li>The link expires in 1 hour</li>
                  </ul>
                </div>
                <button
                  onClick={() => { setIsSuccess(false); setEmail(''); }}
                  className="w-full h-11 rounded-[6px] border border-pb-hairline text-[13px] font-mono text-pb-ink hover:bg-pb-surface2 transition-colors mb-3"
                >
                  Try another email
                </button>
                <Link
                  to="/login"
                  className="text-[13px] font-mono text-pb-muted hover:text-pb-ink transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowRight size={13} className="rotate-180" /> Back to login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
