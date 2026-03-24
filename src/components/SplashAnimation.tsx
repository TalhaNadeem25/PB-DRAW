import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface Props {
  onComplete: () => void;
}

const LETTERS = 'PB DRAW'.split('');

const css = `
@keyframes splashFadeScale {
  from { opacity: 0; transform: scale(0.3); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes splashLetterIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes splashFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes splashPulse {
  0%, 100% { transform: scale(1);    opacity: 0.3; }
  50%       { transform: scale(1.15); opacity: 0.1; }
}
@keyframes splashLineIn {
  from { transform: scaleX(0); opacity: 0; }
  to   { transform: scaleX(1); opacity: 1; }
}
@keyframes splashExit {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(1.08); }
}
`;

export default function SplashAnimation({ onComplete }: Props) {
  const [exiting, setExiting] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const outTimer = setTimeout(() => setExiting(true), 2200);
    const doneTimer = setTimeout(() => { setGone(true); onComplete(); }, 2900);
    return () => { clearTimeout(outTimer); clearTimeout(doneTimer); };
  }, [onComplete]);

  if (gone) return null;

  return (
    <>
      <style>{css}</style>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(160deg, #14532d 0%, #16a34a 50%, #15803d 100%)',
          animation: exiting ? 'splashExit 0.7s ease-in-out forwards' : undefined,
        }}
      >
        {/* Pulse rings */}
        <div style={{
          position: 'absolute', width: 220, height: 220, borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.15)',
          animation: 'splashPulse 2.5s ease-in-out infinite',
          animationDelay: '0.4s',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.07)',
          animation: 'splashPulse 2.5s ease-in-out infinite',
          animationDelay: '0.6s',
        }} />

        {/* Logo */}
        <div style={{
          marginBottom: 32, position: 'relative',
          animation: 'splashFadeScale 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
          opacity: 0,
          animationFillMode: 'forwards',
        }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 20,
            background: 'rgba(255,255,255,0.15)', filter: 'blur(18px)',
          }} />
          <img
            src="/assets/icon/icon.png"
            alt="PB Draw"
            width={100}
            height={100}
            style={{ position: 'relative', borderRadius: 20, boxShadow: '0 0 40px rgba(255,255,255,0.2)' }}
          />
        </div>

        {/* Letters */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
          {LETTERS.map((letter, i) => (
            <span
              key={i}
              style={{
                fontSize: 36, fontWeight: 800, color: 'white',
                letterSpacing: 4, fontFamily: 'system-ui, -apple-system, sans-serif',
                textShadow: '0 0 30px rgba(255,255,255,0.4)',
                opacity: 0,
                animation: `splashLetterIn 0.4s ease-out forwards`,
                animationDelay: `${0.5 + i * 0.07}s`,
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <p style={{
          color: 'rgba(255,255,255,0.65)', fontSize: 13, letterSpacing: 3,
          textTransform: 'uppercase', fontFamily: 'system-ui, -apple-system, sans-serif',
          opacity: 0,
          animation: 'splashFadeIn 0.5s ease-out 1.2s forwards',
        }}>
          Tournament Management
        </p>

        {/* Bottom line */}
        <div style={{
          position: 'absolute', bottom: 64, width: 40, height: 2,
          background: 'rgba(255,255,255,0.3)', borderRadius: 2,
          transformOrigin: 'left',
          opacity: 0,
          animation: 'splashLineIn 0.6s ease-out 1.4s forwards',
        }} />
      </div>
    </>
  );
}

export function useShouldShowSplash() {
  return Capacitor.isNativePlatform();
}
