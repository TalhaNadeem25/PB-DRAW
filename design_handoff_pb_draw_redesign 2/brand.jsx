// Shared design tokens + atoms for PB Draw redesign.
// Loaded as a Babel script before screen files.

const TOKENS = {
  // Surfaces
  paper: '#F5F2EB',     // page bg — warm cream
  surface: '#FFFFFF',   // cards
  surface2: '#FBF9F4',  // alt card / nested
  ink: '#0F0F0E',       // primary text
  ink2: '#3A3833',      // secondary text
  muted: '#6B6863',     // tertiary / labels
  faint: '#9C9890',     // disabled / placeholder
  hairline: '#E5E0D5',  // borders
  rule: '#D4CFC2',      // stronger rule

  // Brand
  court: '#1F4A2E',     // deep court green
  courtInk: '#0E2D1A',
  courtTint: '#E6EDE6',
  courtTint2: '#F1F5EE',

  // Status
  amber: '#C2691A',     // live / in-progress
  amberTint: '#F5E5D2',
  ink900: '#0F0F0E',
  red: '#A23A2C',
  blue: '#2A4F8F',
  blueTint: '#E2E9F4',
};

const FONTS = {
  display: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif",
  body: "'Geist', ui-sans-serif, system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
};

// Tiny atoms
function Eyebrow({ children, color = TOKENS.muted, style }) {
  return (
    <div style={{
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color,
      fontWeight: 500,
      ...style,
    }}>{children}</div>
  );
}

function Dot({ color = TOKENS.amber, size = 8, pulse = false }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      boxShadow: pulse ? `0 0 0 0 ${color}66` : 'none',
      animation: pulse ? 'pbpulse 1.6s ease-out infinite' : 'none',
      flexShrink: 0,
    }} />
  );
}

function Logo({ color = TOKENS.ink, size = 18 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Two intersecting circles forming a stylized PB ball + paddle silhouette */}
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="12" r="7" stroke={color} strokeWidth="1.6" />
        <circle cx="15" cy="12" r="7" stroke={color} strokeWidth="1.6" />
        <line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="1.6" />
      </svg>
      <span style={{
        fontFamily: FONTS.display,
        fontWeight: 800,
        fontSize: size * 0.95,
        letterSpacing: '-0.02em',
        color,
      }}>PB Draw</span>
    </div>
  );
}

function Pill({ children, tone = 'neutral', mono = false, style }) {
  const tones = {
    neutral: { bg: TOKENS.paper, fg: TOKENS.ink2, br: TOKENS.hairline },
    court:   { bg: TOKENS.courtTint, fg: TOKENS.courtInk, br: '#CCDAC9' },
    amber:   { bg: TOKENS.amberTint, fg: '#7C3F0A', br: '#E8C9A1' },
    blue:    { bg: TOKENS.blueTint, fg: TOKENS.blue, br: '#C7D2E8' },
    ink:     { bg: TOKENS.ink, fg: '#FFF', br: TOKENS.ink },
    outline: { bg: 'transparent', fg: TOKENS.ink2, br: TOKENS.rule },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 9px',
      borderRadius: 999,
      background: t.bg,
      color: t.fg,
      border: `1px solid ${t.br}`,
      fontFamily: mono ? FONTS.mono : FONTS.body,
      fontSize: mono ? 10.5 : 11.5,
      fontWeight: mono ? 500 : 500,
      letterSpacing: mono ? '0.04em' : 'normal',
      lineHeight: 1,
      ...style,
    }}>{children}</span>
  );
}

function Btn({ children, variant = 'primary', size = 'md', icon, style, full }) {
  const variants = {
    primary: { bg: TOKENS.ink, fg: '#FFF', br: TOKENS.ink },
    court:   { bg: TOKENS.court, fg: '#F2F8EE', br: TOKENS.court },
    outline: { bg: 'transparent', fg: TOKENS.ink, br: TOKENS.rule },
    ghost:   { bg: 'transparent', fg: TOKENS.ink, br: 'transparent' },
    amber:   { bg: TOKENS.amber, fg: '#FFF8EE', br: TOKENS.amber },
  };
  const sizes = {
    sm: { p: '7px 11px', fs: 12, gap: 6 },
    md: { p: '10px 16px', fs: 13, gap: 8 },
    lg: { p: '13px 20px', fs: 14, gap: 10 },
  };
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: s.gap, padding: s.p,
      background: v.bg, color: v.fg,
      border: `1px solid ${v.br}`,
      fontFamily: FONTS.body, fontSize: s.fs, fontWeight: 500,
      borderRadius: 8, cursor: 'pointer', letterSpacing: '-0.005em',
      width: full ? '100%' : 'auto',
      ...style,
    }}>
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      {children}
    </button>
  );
}

// SVG icon set — minimal line icons matched to the type weight
function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 1.6 }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'arrow-right': return <svg {...props}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>;
    case 'arrow-up-right': return <svg {...props}><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>;
    case 'search': return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'filter': return <svg {...props}><path d="M3 6h18"/><path d="M6 12h12"/><path d="M10 18h4"/></svg>;
    case 'calendar': return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>;
    case 'pin': return <svg {...props}><path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case 'trophy': return <svg {...props}><path d="M8 4h8v6a4 4 0 0 1-8 0V4z"/><path d="M8 6H4v2a4 4 0 0 0 4 4"/><path d="M16 6h4v2a4 4 0 0 1-4 4"/><path d="M9 18h6"/><path d="M12 14v4"/></svg>;
    case 'users': return <svg {...props}><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M21 18c0-2.2-1.7-4-4-4"/></svg>;
    case 'play': return <svg {...props}><polygon points="6 4 20 12 6 20 6 4" fill={color} stroke="none"/></svg>;
    case 'flame': return <svg {...props}><path d="M12 21c4 0 7-3 7-7 0-3-2-4.5-3.5-6.5C14 5.5 12 3 12 3s-1 3-3 5-3 4-3 6c0 4 2 7 6 7Z"/></svg>;
    case 'chevron-down': return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case 'chevron-right': return <svg {...props}><path d="m9 6 6 6-6 6"/></svg>;
    case 'check': return <svg {...props}><path d="m5 13 4 4 10-12"/></svg>;
    case 'x': return <svg {...props}><path d="m6 6 12 12"/><path d="m18 6-12 12"/></svg>;
    case 'plus': return <svg {...props}><path d="M12 5v14"/><path d="M5 12h14"/></svg>;
    case 'menu': return <svg {...props}><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>;
    case 'bracket': return <svg {...props}><path d="M4 5v14"/><path d="M4 12h6"/><path d="M10 7v10"/><path d="M10 12h4"/><path d="M14 9v6"/><path d="M14 12h4"/><path d="M18 11v2"/><path d="M18 12h2"/></svg>;
    case 'dashboard': return <svg {...props}><rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/></svg>;
    case 'court': return <svg {...props}><rect x="3" y="6" width="18" height="12" rx="0.5"/><path d="M3 12h18"/><path d="M9 6v12"/><path d="M15 6v12"/></svg>;
    case 'cash': return <svg {...props}><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01"/><path d="M18 15v.01"/></svg>;
    case 'mail': return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>;
    case 'bell': return <svg {...props}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>;
    case 'settings': return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>;
    case 'qr': return <svg {...props}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/><path d="M20 14h1"/><path d="M14 20h7"/><path d="M20 17v1"/></svg>;
    case 'share': return <svg {...props}><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8 11 8-4"/><path d="m8 13 8 4"/></svg>;
    case 'star': return <svg {...props}><path d="m12 3 2.7 5.5 6 .9-4.4 4.3 1 6L12 17l-5.4 2.8 1.1-6-4.4-4.3 6-.9L12 3Z"/></svg>;
    case 'spark': return <svg {...props}><path d="M12 3v6"/><path d="M12 15v6"/><path d="M3 12h6"/><path d="M15 12h6"/><path d="m6 6 4 4"/><path d="m14 14 4 4"/><path d="m18 6-4 4"/><path d="m10 14-4 4"/></svg>;
    default: return null;
  }
}

// Striped placeholder for imagery
function ImgSlot({ label, h = 200, tone = 'court', style }) {
  const t = tone === 'amber' ? TOKENS.amberTint : tone === 'ink' ? '#1A1A18' : TOKENS.courtTint;
  const fg = tone === 'ink' ? '#5A5A55' : TOKENS.muted;
  const stripe = tone === 'ink' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)';
  return (
    <div style={{
      height: h, width: '100%',
      background: `repeating-linear-gradient(135deg, ${t} 0, ${t} 14px, ${stripe} 14px, ${stripe} 15px)`,
      border: `1px solid ${TOKENS.hairline}`,
      borderRadius: 4,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...style,
    }}>
      <div style={{
        fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: fg,
        background: tone === 'ink' ? '#1A1A18' : TOKENS.surface,
        padding: '4px 9px', border: `1px solid ${TOKENS.hairline}`,
      }}>{label}</div>
    </div>
  );
}

// Avatar with initials
function Avatar({ name, size = 28, tone = 'paper' }) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('');
  const tones = {
    paper: { bg: TOKENS.paper, fg: TOKENS.ink2, br: TOKENS.hairline },
    court: { bg: TOKENS.court, fg: '#F2F8EE', br: TOKENS.court },
    amber: { bg: TOKENS.amber, fg: '#FFF8EE', br: TOKENS.amber },
    ink:   { bg: TOKENS.ink, fg: '#FFF', br: TOKENS.ink },
  };
  const t = tones[tone] || tones.paper;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: t.bg, color: t.fg, border: `1px solid ${t.br}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONTS.body, fontSize: size * 0.36, fontWeight: 600,
      letterSpacing: '0.01em', flexShrink: 0,
    }}>{initials}</div>
  );
}

Object.assign(window, { TOKENS, FONTS, Eyebrow, Dot, Logo, Pill, Btn, Icon, ImgSlot, Avatar });
