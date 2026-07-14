// Shared shell — top navigation used across screens.

function TopNav({ active = 'browse' }) {
  const items = [
    { id: 'browse', label: 'Tournaments' },
    { id: 'live', label: 'Live' },
    { id: 'partners', label: 'Partners' },
    { id: 'host', label: 'Host' },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 32px',
      borderBottom: `1px solid ${TOKENS.hairline}`,
      background: TOKENS.paper,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
        <Logo size={18} />
        <nav style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          {items.map(it => (
            <span key={it.id} style={{
              fontFamily: FONTS.body, fontSize: 13, fontWeight: 500,
              color: it.id === active ? TOKENS.ink : TOKENS.muted,
              borderBottom: it.id === active ? `1px solid ${TOKENS.ink}` : '1px solid transparent',
              paddingBottom: 2, letterSpacing: '-0.005em',
            }}>{it.label}</span>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 12px', border: `1px solid ${TOKENS.hairline}`,
          borderRadius: 8, background: TOKENS.surface, width: 280,
        }}>
          <Icon name="search" size={14} color={TOKENS.muted} />
          <span style={{
            fontFamily: FONTS.body, fontSize: 13, color: TOKENS.faint,
          }}>Search tournaments, players, clubs</span>
          <span style={{ marginLeft: 'auto', fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.faint, padding: '2px 5px', border: `1px solid ${TOKENS.hairline}`, borderRadius: 4 }}>⌘K</span>
        </div>
        <button style={{
          width: 36, height: 36, border: `1px solid ${TOKENS.hairline}`,
          background: TOKENS.surface, borderRadius: 8, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}>
          <Icon name="bell" size={15} color={TOKENS.ink2} />
          <span style={{ position: 'absolute', top: 8, right: 9, width: 6, height: 6, background: TOKENS.amber, borderRadius: '50%' }} />
        </button>
        <Avatar name="Maya Chen" size={36} tone="court" />
      </div>
    </div>
  );
}

// Section frame for cards
function Card({ children, style, padded = true }) {
  return (
    <div style={{
      background: TOKENS.surface,
      border: `1px solid ${TOKENS.hairline}`,
      borderRadius: 6,
      padding: padded ? 22 : 0,
      ...style,
    }}>{children}</div>
  );
}

// Section header with rule
function SectionHead({ eyebrow, title, action, dense }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      borderBottom: `1px solid ${TOKENS.hairline}`,
      paddingBottom: dense ? 10 : 16,
      marginBottom: dense ? 16 : 22,
    }}>
      <div>
        {eyebrow && <Eyebrow style={{ marginBottom: 6 }}>{eyebrow}</Eyebrow>}
        <div style={{
          fontFamily: FONTS.display, fontWeight: 700,
          fontSize: dense ? 22 : 28, letterSpacing: '-0.03em',
          color: TOKENS.ink, lineHeight: 1.05,
        }}>{title}</div>
      </div>
      {action}
    </div>
  );
}

// KPI block
function KPI({ label, value, delta, mono = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 0' }}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{
        fontFamily: mono ? FONTS.mono : FONTS.display,
        fontSize: 28, fontWeight: mono ? 500 : 700, letterSpacing: '-0.02em',
        color: TOKENS.ink, lineHeight: 1, fontFeatureSettings: '"tnum" 1',
      }}>{value}</div>
      {delta && (
        <div style={{ fontFamily: FONTS.body, fontSize: 11.5, color: TOKENS.muted }}>
          {delta}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { TopNav, Card, SectionHead, KPI });
