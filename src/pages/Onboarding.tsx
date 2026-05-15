import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleNotch, Trophy, Clipboard } from '@phosphor-icons/react';
import { authAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { PbLogo } from '@/components/ui/pb';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const SKILL_LEVELS = [
  { value: '2.5', label: '2.5', desc: 'Beginner' },
  { value: '3.0', label: '3.0', desc: 'Recreational' },
  { value: '3.5', label: '3.5', desc: 'Intermediate' },
  { value: '4.0', label: '4.0', desc: 'Advanced' },
  { value: '4.5', label: '4.5', desc: 'Competitive' },
  { value: '5.0', label: '5.0', desc: 'Elite' },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<'role' | 'skill'>('role');
  const [role, setRole] = useState<'player' | 'organizer'>('player');
  const [skillLevel, setSkillLevel] = useState('3.0');
  const [isLoading, setIsLoading] = useState(false);

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      await authAPI.updateProfile({
        role,
        skillLevel: parseFloat(skillLevel),
      });
      updateUser({ ...user!, role, skillLevel: parseFloat(skillLevel) });
      toast.success('Profile set up!');
      navigate('/dashboard');
    } catch {
      toast.error('Something went wrong. You can update this in your profile.');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pb-paper flex flex-col" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-4">
        <PbLogo size={28} />
        <button
          onClick={() => navigate('/dashboard')}
          className="font-mono text-[11px] text-pb-muted uppercase tracking-[0.08em]"
        >
          Skip
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 px-5 mb-8">
        {(['role', 'skill'] as const).map((s) => (
          <div
            key={s}
            className={cn(
              'h-1 rounded-full transition-all duration-300',
              step === s ? 'w-6 bg-pb-ink' : 'w-2 bg-pb-hairline'
            )}
          />
        ))}
      </div>

      <div className="flex-1 px-5">
        {/* Step 1: Role */}
        {step === 'role' && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-mono text-[11px] text-pb-muted uppercase tracking-[0.1em] mb-1">Step 1 of 2</p>
              <h1 className="font-display font-bold text-[28px] text-pb-ink tracking-[-0.025em] leading-tight">
                What brings you<br />to PB Draw?
              </h1>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { value: 'player', icon: Trophy, title: 'I\'m a Player', desc: 'Find and join tournaments & leagues near me' },
                { value: 'organizer', icon: Clipboard, title: 'I\'m an Organizer', desc: 'Host and manage my own tournaments & leagues' },
              ].map(({ value, icon: Icon, title, desc }) => (
                <button
                  key={value}
                  onClick={() => setRole(value as 'player' | 'organizer')}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-[10px] border text-left transition-all',
                    role === value
                      ? 'border-pb-ink bg-pb-ink text-white'
                      : 'border-pb-hairline bg-pb-surface text-pb-ink'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0',
                    role === value ? 'bg-white/15' : 'bg-pb-paper'
                  )}>
                    <Icon size={20} weight="bold" className={role === value ? 'text-white' : 'text-pb-ink'} />
                  </div>
                  <div>
                    <p className={cn('font-display font-bold text-[15px]', role === value ? 'text-white' : 'text-pb-ink')}>{title}</p>
                    <p className={cn('text-[12px] font-sans mt-0.5', role === value ? 'text-white/70' : 'text-pb-muted')}>{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Skill level (players only) */}
        {step === 'skill' && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-mono text-[11px] text-pb-muted uppercase tracking-[0.1em] mb-1">Step 2 of 2</p>
              <h1 className="font-display font-bold text-[28px] text-pb-ink tracking-[-0.025em] leading-tight">
                {role === 'player' ? 'What\'s your\nskill level?' : 'Almost done!'}
              </h1>
              {role === 'organizer' && (
                <p className="text-[14px] text-pb-muted mt-2">You're all set to start hosting. Tap Finish to go to your dashboard.</p>
              )}
            </div>

            {role === 'player' && (
              <div className="grid grid-cols-2 gap-2.5">
                {SKILL_LEVELS.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setSkillLevel(value)}
                    className={cn(
                      'flex flex-col items-center justify-center py-4 rounded-[10px] border transition-all',
                      skillLevel === value
                        ? 'border-pb-ink bg-pb-ink text-white'
                        : 'border-pb-hairline bg-pb-surface text-pb-ink'
                    )}
                  >
                    <span className={cn('font-mono font-bold text-[22px]', skillLevel === value ? 'text-white' : 'text-pb-court')}>{label}</span>
                    <span className={cn('font-sans text-[11px] mt-0.5', skillLevel === value ? 'text-white/70' : 'text-pb-muted')}>{desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pt-4">
        {step === 'role' ? (
          <button
            onClick={() => setStep('skill')}
            className="w-full h-[52px] bg-pb-ink text-white rounded-[10px] font-display font-bold text-[15px] flex items-center justify-center"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={isLoading}
            className="w-full h-[52px] bg-pb-ink text-white rounded-[10px] font-display font-bold text-[15px] flex items-center justify-center gap-2"
          >
            {isLoading ? <CircleNotch size={18} className="animate-spin" /> : 'Finish'}
          </button>
        )}

        {step === 'skill' && (
          <button
            onClick={() => setStep('role')}
            className="w-full mt-3 font-mono text-[11px] text-pb-muted uppercase tracking-[0.08em] text-center"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
