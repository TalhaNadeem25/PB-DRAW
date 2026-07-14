// Browse + Tournament Detail screens

const TOURNEYS = [
  { id: 1, name: 'The Bay Open',      city: 'San Francisco, CA', date: 'May 8–9',  status: 'live', spots: 12, total: 96, fee: 65, levels: '3.5 – 5.0', host: 'Bay PB Co.',     prize: '$4,800', tag: 'Open · Mixed', day: 'TODAY' },
  { id: 2, name: 'Sonoma Series',      city: 'Healdsburg, CA',    date: 'May 15–17', status: 'open', spots: 38, total: 128, fee: 80, levels: '3.0 – 4.5', host: 'North Wine Club',  prize: '$6,200', tag: 'Series · Doubles', day: '7 DAYS' },
  { id: 3, name: 'Indoor Winter Cup',  city: 'Reno, NV',          date: 'May 22',   status: 'open',   spots: 4,  total: 64,  fee: 55, levels: '4.0 – 4.5', host: 'Indoor PB Reno',   prize: '$2,400', tag: 'Singles · Mens',   day: '14 DAYS' },
  { id: 4, name: 'Marin Mixers',       city: 'Mill Valley, CA',  date: 'May 29',   status: 'open',   spots: 22, total: 48,  fee: 45, levels: '2.5 – 3.5', host: 'Marin Rec',         prize: '$1,200', tag: 'Beginner · Mixed', day: '21 DAYS' },
  { id: 5, name: 'Pacific Heights Pro',city: 'San Francisco, CA', date: 'Jun 5–7',  status: 'open',  spots: 6,  total: 64,  fee: 110,levels: '4.5 – 5.0', host: 'PH Athletic Club', prize: '$11,000', tag: 'Pro · Doubles',   day: '28 DAYS' },
  { id: 6, name: 'Tahoe Lakeside Slam',city: 'Lake Tahoe, CA',   date: 'Jun 12',   status: 'wait',  spots: 0,  total: 80,  fee: 70, levels: 'All',       host: 'Tahoe Athletics',  prize: '$3,600', tag: 'Open · Doubles',   day: '35 DAYS' },
];

function TournamentRow({ t, featured = false }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: featured ? '1.4fr 1fr 0.8fr 0.8fr 0.7fr 0.6fr' : '1.4fr 1fr 0.8fr 0.8fr 0.7fr 0.6fr',
      alignItems: 'center',
      gap: 14,
      padding: '18px 0',
      borderBottom: `1px solid ${TOKENS.hairline}`,
      fontFamily: FONTS.body,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            fontFamily: FONTS.display, fontWeight: 700,
            fontSize: 18, letterSpacing: '-0.025em', color: TOKENS.ink,
          }}>{t.name}</div>
          {t.status === 'live' && <Pill tone="amber" mono><Dot color={TOKENS.amber} size={5} pulse /> LIVE</Pill>}
          {t.status === 'wait' && <Pill tone="outline" mono>WAITLIST</Pill>}
        </div>
        <div style={{ fontSize: 12, color: TOKENS.muted }}>{t.host} · {t.tag}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: TOKENS.ink2 }}>
        <Icon name="pin" size={13} color={TOKENS.muted} />{t.city}
      </div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.ink2, letterSpacing: '0.02em' }}>
        <div>{t.date}</div>
        <div style={{ fontSize: 10, color: TOKENS.faint, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>IN {t.day}</div>
      </div>
      <div style={{ fontSize: 12, color: TOKENS.ink2 }}>
        <div style={{ fontFamily: FONTS.mono, color: TOKENS.ink, fontWeight: 500 }}>{t.levels}</div>
        <div style={{ color: TOKENS.faint, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>SKILL</div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 500, color: t.spots <= 6 ? TOKENS.amber : TOKENS.ink }}>{t.spots}</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.faint }}>/ {t.total}</span>
        </div>
        <div style={{ height: 3, background: TOKENS.hairline, borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${100 - (t.spots / t.total) * 100}%`, background: t.spots <= 6 ? TOKENS.amber : TOKENS.court }} />
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <Btn variant="outline" size="sm" icon={<Icon name="arrow-right" size={13} />}>Enter</Btn>
      </div>
    </div>
  );
}

function BrowseScreen() {
  const featured = TOURNEYS[0];
  return (
    <div style={{ width: 1440, minHeight: 1024, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="browse" />

      {/* Editorial hero */}
      <div style={{ padding: '56px 32px 36px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 60, alignItems: 'end' }}>
          <div>
            <Eyebrow style={{ marginBottom: 18 }}>EDITION 12 · MAY 2026 · WEST COAST</Eyebrow>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 800,
              fontSize: 88, letterSpacing: '-0.045em', lineHeight: 0.95,
              color: TOKENS.ink,
            }}>
              The draw,<br />
              <span style={{ fontStyle: 'italic', fontWeight: 700, color: TOKENS.court }}>resolved.</span>
            </div>
            <div style={{
              fontFamily: FONTS.body, fontSize: 16, color: TOKENS.ink2,
              maxWidth: 520, marginTop: 22, lineHeight: 1.5, fontWeight: 400,
            }}>
              Tournament software for organizers who care about the details, and players who care about the play. Built around the bracket, not the dashboard.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              <Btn variant="primary" size="lg" icon={<Icon name="arrow-right" size={15} color="#fff" />}>Browse 240 tournaments</Btn>
              <Btn variant="outline" size="lg">Host yours</Btn>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              padding: '14px 18px', background: TOKENS.surface,
              border: `1px solid ${TOKENS.hairline}`, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Dot color={TOKENS.amber} size={7} pulse />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: TOKENS.ink }}>Bay Open · QF · Walsh / Tanaka v Devereaux / Ito</div>
                  <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 2 }}>Game 2 · 8–6 · Court 1</div>
                </div>
              </div>
              <Btn variant="ghost" size="sm" icon={<Icon name="play" size={11} color={TOKENS.amber} />}>Watch</Btn>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: TOKENS.hairline, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6, overflow: 'hidden' }}>
              {[
                { l: 'LIVE NOW', v: '3', s: 'tournaments running' },
                { l: 'OPEN DRAWS', v: '240', s: 'across 28 states' },
                { l: 'PLAYERS', v: '18.4k', s: 'on PB Draw this week' },
              ].map((s, i) => (
                <div key={i} style={{ background: TOKENS.surface, padding: '18px 16px' }}>
                  <Eyebrow style={{ marginBottom: 10 }}>{s.l}</Eyebrow>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 30, fontWeight: 500, letterSpacing: '-0.02em', color: TOKENS.ink, fontFeatureSettings: '"tnum" 1' }}>{s.v}</div>
                  <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 2 }}>{s.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ padding: '14px 32px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', alignItems: 'center', gap: 8, background: TOKENS.surface2 }}>
        {['All', 'This week', 'This month', 'Doubles', 'Singles', 'Mixed', '4.0+', 'Within 50 mi'].map((f, i) => (
          <span key={f} style={{
            padding: '6px 12px',
            border: `1px solid ${i === 1 ? TOKENS.ink : TOKENS.hairline}`,
            background: i === 1 ? TOKENS.ink : TOKENS.surface,
            color: i === 1 ? '#FFF' : TOKENS.ink2,
            borderRadius: 999, fontSize: 12, fontWeight: 500,
            cursor: 'pointer',
          }}>{f}</span>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, letterSpacing: '0.1em' }}>SORT · STARTING SOON</span>
      </div>

      {/* Tournament list */}
      <div style={{ padding: '32px 32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 0.8fr 0.8fr 0.7fr 0.6fr',
          gap: 14,
          padding: '0 0 12px',
          borderBottom: `1px solid ${TOKENS.rule}`,
        }}>
          {['Tournament', 'Location', 'Date', 'Skill', 'Spots', ''].map(h => (
            <div key={h} style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: TOKENS.muted, fontWeight: 500 }}>{h}</div>
          ))}
        </div>
        {TOURNEYS.map(t => <TournamentRow key={t.id} t={t} />)}
      </div>
    </div>
  );
}

window.BrowseScreen = BrowseScreen;

// ----------------------------------------------------------------------
// Court Display — TV-style 1920×1080 large-screen scoreboard
// ----------------------------------------------------------------------
function CourtDisplayScreen() {
  return (
    <div style={{ width: 1920, height: 1080, background: '#0E0E0C', color: '#F5F2EB', fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      {/* Court pattern background */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, background:
        `linear-gradient(0deg, transparent 49.5%, #fff 49.5%, #fff 50.5%, transparent 50.5%),
         linear-gradient(90deg, transparent 49.5%, #fff 49.5%, #fff 50.5%, transparent 50.5%)`,
        backgroundSize: '100% 100%, 100% 100%' }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '36px 56px',
        borderBottom: '1px solid rgba(245,242,235,0.12)',
      }}>
        <Logo color="#F5F2EB" size={22} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: 14, letterSpacing: '0.18em', color: '#9C9890' }}>SAT 09 MAY · BAY OPEN · QF · COURT 1</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#C2691A', borderRadius: 999, fontFamily: FONTS.mono, fontSize: 12, letterSpacing: '0.18em', fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, background: '#FFF', borderRadius: '50%', animation: 'pbpulse 1.6s infinite' }} /> LIVE
          </span>
        </div>
      </div>

      {/* Main scoreboard */}
      <div style={{ padding: '56px 56px 32px', display: 'flex', flexDirection: 'column', gap: 40 }}>
        {[
          { name: 'WALSH / TANAKA',    seed: 6, scores: [9, 8, null], serving: false, badge: '4.5 · NorCal' },
          { name: 'DEVEREAUX / ITO',  seed: 3, scores: [11, 6, null], serving: true,  badge: '4.5 · BayPB',   leader: true },
        ].map((t, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 200px 200px 200px',
            alignItems: 'center',
            gap: 36,
            padding: '32px 0',
            borderTop: i === 0 ? '1px solid rgba(245,242,235,0.12)' : 'none',
            borderBottom: '1px solid rgba(245,242,235,0.12)',
          }}>
            <div style={{
              fontFamily: FONTS.mono, fontSize: 92, fontWeight: 300,
              color: '#F5E5D2', letterSpacing: '-0.04em', lineHeight: 1,
            }}>{t.seed}</div>
            <div>
              <div style={{
                fontFamily: FONTS.display, fontSize: 64, fontWeight: 700,
                letterSpacing: '-0.035em', lineHeight: 1, color: '#F5F2EB',
              }}>{t.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 14, color: '#9C9890', letterSpacing: '0.1em' }}>{t.badge}</span>
                {t.serving && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: '#C2691A', borderRadius: 4, fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, letterSpacing: '0.18em' }}>
                    <span style={{ width: 6, height: 6, background: '#FFF', borderRadius: '50%' }} /> SERVING
                  </span>
                )}
              </div>
            </div>
            {[0, 1, 2].map(g => (
              <div key={g} style={{
                fontFamily: FONTS.mono,
                fontSize: 144, fontWeight: 500,
                color: t.scores[g] === null ? '#3A3833' : (g === 2 ? '#C2691A' : (t.leader && g < 2 ? '#F5F2EB' : '#9C9890')),
                letterSpacing: '-0.04em', lineHeight: 0.85, textAlign: 'center',
                fontFeatureSettings: '"tnum" 1',
              }}>{t.scores[g] === null ? '–' : String(t.scores[g]).padStart(2, '0')}</div>
            ))}
          </div>
        ))}

        {/* Game labels under */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '110px 1fr 200px 200px 200px',
          gap: 36, marginTop: -28,
        }}>
          <div /><div />
          {['GAME 1', 'GAME 2', 'GAME 3'].map((g, i) => (
            <div key={g} style={{
              textAlign: 'center',
              fontFamily: FONTS.mono, fontSize: 13, letterSpacing: '0.22em',
              color: i === 2 ? '#C2691A' : '#6B6863',
              fontWeight: 500,
            }}>{g}{i === 2 ? ' · DECIDER' : ''}</div>
          ))}
        </div>
      </div>

      {/* Bottom — match meta */}
      <div style={{
        position: 'absolute', left: 56, right: 56, bottom: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 0',
        borderTop: '1px solid rgba(245,242,235,0.12)',
      }}>
        <div style={{ display: 'flex', gap: 56 }}>
          {[
            { l: 'MATCH FORMAT', v: 'BEST OF 3 · TO 11 · WIN BY 2' },
            { l: 'ELAPSED', v: '01:14' },
            { l: 'RALLY LEN.', v: '4.7s avg' },
            { l: 'NEXT', v: '15:30 · BEAUMONT/SATO v ROMANO/PATEL' },
          ].map(m => (
            <div key={m.l}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.18em', color: '#6B6863' }}>{m.l}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 16, color: '#F5F2EB', marginTop: 6, fontWeight: 500 }}>{m.v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: 12, letterSpacing: '0.18em', color: '#6B6863' }}>FOLLOW LIVE</span>
          <div style={{ width: 64, height: 64, background: '#F5F2EB', display: 'grid', placeItems: 'center', borderRadius: 4 }}>
            <Icon name="qr" size={44} color="#0E0E0C" strokeWidth={1.4} />
          </div>
        </div>
      </div>
    </div>
  );
}

window.CourtDisplayScreen = CourtDisplayScreen;
