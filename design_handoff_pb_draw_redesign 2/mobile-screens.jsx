// Mobile screen set — all built to 390×800 internal canvas (sits inside IOSDevice 420×870).
// Same brand primitives, denser layout, single-column.

const M_W = 390;

// Shared mobile chrome ──────────────────────────────────────────────
function MTopBar({ title, back = true, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderBottom: `1px solid ${TOKENS.hairline}`,
      background: TOKENS.paper, position: 'sticky', top: 0, zIndex: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {back && <span style={{ display: 'inline-flex', width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: `1px solid ${TOKENS.hairline}` }}>
          <Icon name="arrow-right" size={12} color={TOKENS.ink} style={{ transform: 'rotate(180deg)' }} />
        </span>}
        <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 17, letterSpacing: '-0.025em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
      </div>
      {action}
    </div>
  );
}

function MTabBar({ active }) {
  const tabs = [
    ['home', 'Home'],
    ['bracket', 'Live'],
    ['plus', 'Browse'],
    ['bell', 'Inbox'],
    ['settings', 'Me'],
  ];
  return (
    <div style={{
      position: 'sticky', bottom: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
      borderTop: `1px solid ${TOKENS.hairline}`, background: TOKENS.surface, padding: '10px 0 14px',
    }}>
      {tabs.map(([k, l]) => (
        <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: active === k ? TOKENS.ink : TOKENS.faint }}>
          <Icon name={k} size={18} color={active === k ? TOKENS.ink : TOKENS.faint} strokeWidth={1.6} />
          <span style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: '0.08em', fontWeight: active === k ? 600 : 500 }}>{l.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 1. MOBILE BRACKET — compact swipeable round view
// ═══════════════════════════════════════════════════════════════════
function MobileBracket() {
  return (
    <div style={{ background: TOKENS.paper, fontFamily: FONTS.body, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MTopBar title="Bay Open · MX4.5" action={<Pill tone="amber" mono><Dot color={TOKENS.amber} size={4} pulse /> LIVE</Pill>} />
      {/* Round tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 16px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
        {[['R16', false], ['QF', true], ['SF', false], ['F', false]].map(([l, a]) => (
          <span key={l} style={{ padding: '6px 12px', fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
            background: a ? TOKENS.ink : 'transparent', color: a ? '#FFF' : TOKENS.muted,
            border: `1px solid ${a ? TOKENS.ink : TOKENS.hairline}`, borderRadius: 99, whiteSpace: 'nowrap' }}>{l}</span>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '14px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>QUARTERFINALS · 4 MATCHES</Eyebrow>
          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.muted }}>13:42 PT</span>
        </div>
        {[
          { t1: 'Hartwell / Vega', s1: '6', t2: 'Okonkwo / Reyes', s2: '3', live: 'GAME 2', ct: 'CT 1', srv: 1 },
          { t1: 'Park / Ali', s1: '8', t2: 'Romano / Patel', s2: '7', live: 'GAME 2', ct: 'CT 2', srv: 1, tight: true },
          { t1: 'Walsh / Tanaka', s1: '9', t2: 'Devereaux / Ito', s2: '11', live: 'GAME 3', ct: 'CT 4', srv: 2, tight: true },
          { t1: 'Cho / Marquez', s1: '11', t2: 'Brennan / Singh', s2: '6', done: true, ct: 'CT 3' },
        ].map((m, i) => (
          <div key={i} style={{ margin: '0 16px 10px', background: TOKENS.surface,
            border: `1px solid ${m.tight ? TOKENS.amber : TOKENS.hairline}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: m.done ? TOKENS.courtTint : (m.tight ? TOKENS.amberTint : TOKENS.surface2), borderBottom: `1px solid ${TOKENS.hairline}` }}>
              {m.done ? <Pill tone="court" mono>FINAL</Pill> :
                <Pill tone="amber" mono><Dot color={TOKENS.amber} size={4} pulse /> {m.live}</Pill>}
              <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.muted }}>{m.ct}</span>
            </div>
            {[[m.t1, m.s1, 1], [m.t2, m.s2, 2]].map(([t, s, n], k) => {
              const wins = parseInt(s) > parseInt(k === 0 ? m.s2 : m.s1);
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', borderTop: k > 0 ? `1px solid ${TOKENS.hairline}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {m.srv === n && !m.done && <Dot color={TOKENS.court} size={5} />}
                    <span style={{ fontSize: 13.5, fontWeight: wins ? 600 : 500, color: wins ? TOKENS.ink : TOKENS.ink2 }}>{t}</span>
                  </div>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: 500, color: wins ? TOKENS.ink : TOKENS.muted }}>{s}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <MTabBar active="bracket" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 2. MOBILE DETAIL — tournament detail
// ═══════════════════════════════════════════════════════════════════
function MobileDetail() {
  return (
    <div style={{ background: TOKENS.paper, fontFamily: FONTS.body, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MTopBar title="The Bay Open" action={<Icon name="share" size={14} color={TOKENS.ink} />} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Hero card */}
        <div style={{ height: 170, background: TOKENS.court, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 20, border: '2px solid rgba(245,242,235,0.3)', borderRadius: 4 }} />
          <div style={{ position: 'absolute', left: 20, right: 20, top: '50%', height: 2, background: 'rgba(245,242,235,0.3)' }} />
          <div style={{ position: 'absolute', bottom: 14, left: 16, color: '#F5F2EB' }}>
            <Pill tone="amber" mono><Dot color={TOKENS.amber} size={4} pulse /> DAY 1 · LIVE</Pill>
          </div>
        </div>
        <div style={{ padding: 18 }}>
          <Eyebrow style={{ marginBottom: 10 }}>SAT 09 – SUN 10 MAY · CRISSY FIELD · 6 COURTS</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 32, letterSpacing: '-0.035em', lineHeight: 1 }}>The Bay Open</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            <Pill tone="outline" mono>SANCTIONED</Pill>
            <Pill tone="outline" mono>DUPR VERIFIED</Pill>
            <Pill tone="court" mono>$130 ENTRY</Pill>
          </div>
        </div>

        {/* Event picker */}
        <div style={{ padding: '0 18px 14px' }}>
          <Eyebrow style={{ marginBottom: 10 }}>YOUR EVENT</Eyebrow>
          <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.ink}`, borderRadius: 8, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Mixed Doubles · 4.5</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, marginTop: 3 }}>48 / 64 PLAYERS · POOL → DBL ELIM</div>
              </div>
              <Pill tone="amber" mono>SEED #1</Pill>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {['DB 4.5', 'SG 4.5', 'MX 4.0'].map(l => (
              <span key={l} style={{ flex: 1, padding: '10px 0', textAlign: 'center', fontFamily: FONTS.mono, fontSize: 11, fontWeight: 500, color: TOKENS.muted, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6, background: TOKENS.surface }}>{l}</span>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div style={{ padding: '6px 18px 14px' }}>
          <Eyebrow style={{ marginBottom: 10 }}>YOUR SCHEDULE · DAY 1</Eyebrow>
          {[
            { t: '08:30', l: 'CHECK-IN · GEAR TENT', done: true },
            { t: '10:00', l: 'POOL · MATCH 1', done: true, sc: 'W 11–6' },
            { t: '11:30', l: 'POOL · MATCH 2', done: true, sc: 'W 11–8' },
            { t: '14:00', l: 'QUARTERFINAL · CT 1', live: true },
            { t: '16:30', l: 'SEMIFINAL · TBD' },
          ].map((s, i, a) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
              borderBottom: i < a.length - 1 ? `1px solid ${TOKENS.hairline}` : 'none' }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: 13, color: s.done ? TOKENS.faint : TOKENS.ink, width: 50 }}>{s.t}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: TOKENS.muted, letterSpacing: '0.1em' }}>{s.l}</div>
                {s.sc && <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.court, fontWeight: 500 }}>{s.sc}</span>}
              </div>
              {s.live ? <Pill tone="amber" mono>NOW</Pill> :
               s.done ? <Icon name="check" size={14} color={TOKENS.court} strokeWidth={2.4} /> : null}
            </div>
          ))}
        </div>
      </div>
      {/* Sticky CTA */}
      <div style={{ padding: 16, borderTop: `1px solid ${TOKENS.hairline}`, background: TOKENS.surface, display: 'flex', gap: 8 }}>
        <Btn variant="outline" size="md" style={{ flex: 1 }} icon={<Icon name="qr" size={14} />}>Ticket</Btn>
        <Btn variant="primary" size="md" style={{ flex: 1.4 }} icon={<Icon name="bracket" size={14} color="#FFF" />}>Live draw</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 3. MOBILE SCORE ENTRY — in-match scoring (referee or player)
// ═══════════════════════════════════════════════════════════════════
function MobileScoreEntry() {
  return (
    <div style={{ background: TOKENS.ink, fontFamily: FONTS.body, height: '100%', display: 'flex', flexDirection: 'column', color: '#F5F2EB' }}>
      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3A3833' }}>
        <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: '#9C9890', letterSpacing: '0.1em' }}>QF · CT 1 · GAME 2 OF 3</span>
        <Pill tone="amber" mono><Dot color={TOKENS.amber} size={4} pulse /> LIVE</Pill>
      </div>

      {/* Team A */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <button style={{ flex: 1, background: TOKENS.court, border: 'none', color: '#F5F2EB', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <Eyebrow color="#C4E0D2" style={{ marginBottom: 6 }}>SERVING · #1 · TEAM A</Eyebrow>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, letterSpacing: '-0.025em' }}>Hartwell / Vega</div>
            </div>
            <Dot color={TOKENS.amber} size={9} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: '#C4E0D2', letterSpacing: '0.1em' }}>TAP TO ADD POINT</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 110, fontWeight: 500, lineHeight: 0.85, letterSpacing: '-0.04em' }}>6</span>
          </div>
        </button>
        <div style={{ background: '#0F0E0C', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #3A3833', borderBottom: '1px solid #3A3833' }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: '#9C9890', letterSpacing: '0.1em' }}>SCORE · 6 — 3 · A LEADS</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, padding: '3px 7px', background: '#1A1815', color: '#F5F2EB', borderRadius: 3 }}>G1 11–9</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, padding: '3px 7px', background: TOKENS.amber, color: '#FFF', borderRadius: 3 }}>G2 6–3</span>
          </div>
        </div>
        {/* Team B */}
        <button style={{ flex: 1, background: TOKENS.surface, border: 'none', color: TOKENS.ink, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20, textAlign: 'left' }}>
          <div>
            <Eyebrow style={{ marginBottom: 6 }}>RECEIVING · #5 · TEAM B</Eyebrow>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, letterSpacing: '-0.025em' }}>Okonkwo / Reyes</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, letterSpacing: '0.1em' }}>TAP TO ADD POINT</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 110, fontWeight: 500, lineHeight: 0.85, letterSpacing: '-0.04em', color: TOKENS.muted }}>3</span>
          </div>
        </button>
      </div>

      <div style={{ padding: 14, display: 'flex', gap: 8, background: '#0F0E0C', borderTop: '1px solid #3A3833' }}>
        <Btn variant="outline" size="sm" style={{ flex: 1, background: 'transparent', color: '#F5F2EB', borderColor: '#3A3833' }}>↶ Undo</Btn>
        <Btn variant="outline" size="sm" style={{ flex: 1, background: 'transparent', color: '#F5F2EB', borderColor: '#3A3833' }}>Side ↔</Btn>
        <Btn variant="outline" size="sm" style={{ flex: 1, background: 'transparent', color: '#F5F2EB', borderColor: '#3A3833' }}>Timeout</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 4. MOBILE DASHBOARD — home
// ═══════════════════════════════════════════════════════════════════
function MobileDashboard() {
  return (
    <div style={{ background: TOKENS.paper, fontFamily: FONTS.body, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px 16px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Eyebrow>SAT · 09 MAY · 13:42</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', marginTop: 4 }}>Hey, Eli.</div>
        </div>
        <Avatar name="Eli Hartwell" size={36} tone="ink" />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Next match card */}
        <div style={{ margin: 16, background: TOKENS.ink, color: '#F5F2EB', borderRadius: 10, padding: 18, position: 'relative', overflow: 'hidden' }}>
          <Eyebrow color={TOKENS.amber} style={{ marginBottom: 10 }}><Dot color={TOKENS.amber} size={4} pulse /> NEXT UP · IN 18 MIN</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            Quarterfinal vs<br/>Okonkwo / Reyes
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 14, borderTop: '1px dashed #3A3833' }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: '#9C9890', letterSpacing: '0.1em' }}>COURT 1 · 14:00</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.amber, marginTop: 3 }}>BAY OPEN · MX 4.5</div>
            </div>
            <Btn variant="amber" size="sm" icon={<Icon name="arrow-right" size={12} color="#FFF" />}>Open</Btn>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '0 16px' }}>
          {[['4.51', 'DUPR'], ['18', 'WINS · 30D'], ['#1', 'SEED']].map(([v, l]) => (
            <div key={l} style={{ padding: 12, background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: 500, color: TOKENS.court }}>{v}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: '0.12em', color: TOKENS.faint, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '20px 16px 8px' }}>
          <Eyebrow>UPCOMING · 3 EVENTS</Eyebrow>
        </div>
        {[
          { d: 'MAY 15', n: 'Sonoma Series', sub: 'MX 4.5 · with Maya Chen', status: 'CONFIRMED' },
          { d: 'JUN 05', n: 'Pacific Heights Pro', sub: 'DB 4.5 · needs partner', status: 'OPEN' },
          { d: 'JUN 14', n: 'Marin Mixers', sub: 'MX 4.0 · with Kavi Park', status: 'WAITLIST' },
        ].map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderTop: `1px solid ${TOKENS.hairline}` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, width: 50, lineHeight: 1.2, textAlign: 'center' }}>{e.d.split(' ')[0]}<br/><span style={{ fontSize: 16, color: TOKENS.ink, fontWeight: 600 }}>{e.d.split(' ')[1]}</span></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{e.n}</div>
              <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 2 }}>{e.sub}</div>
            </div>
            <Pill tone={e.status === 'OPEN' ? 'amber' : 'outline'} mono>{e.status}</Pill>
          </div>
        ))}

        <div style={{ padding: '20px 16px 8px' }}><Eyebrow>RECENT FORM</Eyebrow></div>
        <div style={{ padding: '0 16px 16px', display: 'flex', gap: 5 }}>
          {'WWLWWWLWWW'.split('').map((c, k) => (
            <span key={k} style={{ flex: 1, height: 28, borderRadius: 4, background: c === 'W' ? TOKENS.court : TOKENS.faint,
              color: '#FFF', fontFamily: FONTS.mono, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{c}</span>
          ))}
        </div>
      </div>
      <MTabBar active="home" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5. MOBILE PROFILE
// ═══════════════════════════════════════════════════════════════════
function MobileProfile() {
  return (
    <div style={{ background: TOKENS.paper, fontFamily: FONTS.body, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MTopBar title="Profile" action={<Icon name="share" size={14} color={TOKENS.ink} />} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${TOKENS.hairline}` }}>
          <Avatar name="Eli Hartwell" size={68} tone="ink" />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, letterSpacing: '-0.025em' }}>Eli Hartwell</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, marginTop: 4 }}>@ehartwell · SAUSALITO, CA</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <Pill tone="court" mono>VERIFIED</Pill>
              <Pill tone="outline" mono>3Y MEMBER</Pill>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${TOKENS.hairline}` }}>
          {[['4.51', 'DUPR · MX'], ['4.62', 'DUPR · DB'], ['68%', 'WIN RATE']].map(([v, l], i) => (
            <div key={l} style={{ padding: '14px 12px', textAlign: 'center', borderRight: i < 2 ? `1px solid ${TOKENS.hairline}` : 'none' }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 22, fontWeight: 500, color: TOKENS.court }}>{v}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: TOKENS.faint, letterSpacing: '0.12em', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 16px 8px' }}><Eyebrow>TROPHY CABINET · 2026</Eyebrow></div>
        {[
          ['Sonoma Series', 'MX 4.5', 'Apr 26', '1st'],
          ['Indoor Winter', 'DB 4.5', 'Feb 14', '2nd'],
          ['Marin Mixers', 'MX 4.0', 'Jan 10', '1st'],
        ].map(([n, d, dt, p], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: `1px solid ${TOKENS.hairline}` }}>
            <span style={{ width: 36, height: 36, borderRadius: 6, background: p === '1st' ? TOKENS.amber : TOKENS.hairline, color: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600 }}>{p}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{n}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, marginTop: 2 }}>{d} · {dt}</div>
            </div>
            <Icon name="arrow-right" size={13} color={TOKENS.faint} />
          </div>
        ))}

        <div style={{ padding: '16px 16px 8px', borderTop: `1px solid ${TOKENS.hairline}` }}><Eyebrow>FREQUENT PARTNERS</Eyebrow></div>
        <div style={{ display: 'flex', gap: 10, padding: '0 16px 20px', overflowX: 'auto' }}>
          {[['MC', 'Maya Chen', '14W'], ['KV', 'Kavi Vega', '11W'], ['BP', 'Bri Park', '6W'], ['TS', 'Theo S.', '4W']].map(([i, n, w]) => (
            <div key={n} style={{ flex: '0 0 100px', padding: 12, background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8, textAlign: 'center' }}>
              <Avatar name={n} size={36} tone="paper" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 11.5, fontWeight: 500 }}>{n}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.court, marginTop: 2 }}>{w}</div>
            </div>
          ))}
        </div>
      </div>
      <MTabBar active="settings" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 6. MOBILE PARTNER — find a partner
// ═══════════════════════════════════════════════════════════════════
function MobilePartner() {
  return (
    <div style={{ background: TOKENS.paper, fontFamily: FONTS.body, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MTopBar title="Find a partner" />
      <div style={{ padding: '14px 16px', display: 'flex', gap: 6, borderBottom: `1px solid ${TOKENS.hairline}`, overflowX: 'auto' }}>
        {['MX 4.5', '4.3–4.7 DUPR', 'Bay Open', 'WITHIN 25MI'].map((f, i) => (
          <span key={f} style={{ padding: '6px 11px', fontFamily: FONTS.mono, fontSize: 10.5, fontWeight: 500,
            background: i === 0 ? TOKENS.ink : 'transparent', color: i === 0 ? '#FFF' : TOKENS.muted,
            border: `1px solid ${i === 0 ? TOKENS.ink : TOKENS.hairline}`, borderRadius: 99, whiteSpace: 'nowrap' }}>{f}</span>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {[
          { n: 'Maya Chen',  d: 4.52, t: 'Looking for MX partner · Bay Open weekend', m: 96, w: '14W · 5L · MX', tags: ['baseliner', 'right-handed', 'aggressive'] },
          { n: 'Bri Park',   d: 4.41, t: "Need a partner for Pacific Heights — let's go", m: 89, w: '11W · 3L · MX', tags: ['kitchen', 'lefty', 'patient'] },
          { n: 'Kavi Singh', d: 4.62, t: 'Open to weekend doubles, 4.5+ only', m: 84, w: '17W · 6L · DB', tags: ['banger', 'right-handed'] },
        ].map((p, i) => (
          <div key={i} style={{ marginBottom: 12, background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={p.n} size={46} tone="paper" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{p.n}</div>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 500, color: TOKENS.court }}>{p.d}</span>
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: TOKENS.muted, marginTop: 2 }}>{p.w}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, marginTop: 11, lineHeight: 1.4, color: TOKENS.ink2 }}>{p.t}</div>
            <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
              {p.tags.map(t => <Pill key={t} tone="outline" mono>{t.toUpperCase()}</Pill>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${TOKENS.hairline}` }}>
              <div>
                <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.faint }}>MATCH SCORE</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: 500, marginLeft: 8, color: TOKENS.court }}>{p.m}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn variant="ghost" size="sm">Pass</Btn>
                <Btn variant="primary" size="sm" icon={<Icon name="arrow-right" size={12} color="#FFF" />}>Invite</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 7. MOBILE CHECKOUT
// ═══════════════════════════════════════════════════════════════════
function MobileCheckout() {
  return (
    <div style={{ background: TOKENS.paper, fontFamily: FONTS.body, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MTopBar title="Confirm & pay" />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: 16 }}>
          <Eyebrow>YOU'RE REGISTERING</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 28, letterSpacing: '-0.035em', marginTop: 6, lineHeight: 1.05 }}>The Bay Open<br/><span style={{ fontStyle: 'italic', color: TOKENS.court }}>Mixed Doubles 4.5</span></div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, marginTop: 8 }}>SAT 09 – SUN 10 MAY · CRISSY FIELD</div>
        </div>

        <div style={{ padding: '0 16px 14px' }}>
          <Eyebrow style={{ marginBottom: 10 }}>YOUR TEAM</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['Eli Hartwell', '4.51', true], ['Kavi Vega', '4.62', true]].map(([n, d, c]) => (
              <div key={n} style={{ padding: 12, background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8 }}>
                <Avatar name={n} size={32} tone="paper" />
                <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>{n}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: TOKENS.muted, marginTop: 2 }}>DUPR {d} · {c ? 'CONFIRMED' : 'PENDING'}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '4px 16px 14px' }}>
          <Eyebrow style={{ marginBottom: 10 }}>ORDER</Eyebrow>
          <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8, padding: 14 }}>
            {[
              ['Entry · MX 4.5 (per player)', '$65 × 2'],
              ['Court fee',                   '$8.00'],
              ['Service',                     '$3.50'],
              ['Promo · EARLYBIRD',           '-$10.00'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13 }}>
                <span style={{ color: TOKENS.muted }}>{l}</span>
                <span style={{ fontFamily: FONTS.mono, color: TOKENS.ink }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTop: `1px dashed ${TOKENS.hairline}` }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 22, fontWeight: 500 }}>$131.50</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '4px 16px 16px' }}>
          <Eyebrow style={{ marginBottom: 10 }}>PAY WITH</Eyebrow>
          {[
            ['Apple Pay', 'fastest', true],
            ['Visa · 4242', 'default'],
            ['Add card', ''],
          ].map(([l, t, sel], i, a) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px',
              background: TOKENS.surface, border: `1px solid ${sel ? TOKENS.ink : TOKENS.hairline}`,
              borderRadius: 8, marginBottom: i < a.length - 1 ? 8 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${sel ? TOKENS.ink : TOKENS.rule}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {sel && <span style={{ width: 8, height: 8, borderRadius: '50%', background: TOKENS.ink }} />}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{l}</span>
                {t && <Pill tone="court" mono>{t.toUpperCase()}</Pill>}
              </div>
              <Icon name="arrow-right" size={13} color={TOKENS.faint} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, borderTop: `1px solid ${TOKENS.hairline}`, background: TOKENS.surface }}>
        <Btn variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }} icon={<Icon name="check" size={14} color="#FFF" strokeWidth={2.4} />}>Pay $131.50 with Apple Pay</Btn>
        <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 8, textAlign: 'center' }}>Free cancellation through May 4 · Bay PB Co. is the merchant of record</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 8. MOBILE AUTH
// ═══════════════════════════════════════════════════════════════════
function MobileAuth() {
  return (
    <div style={{ background: TOKENS.ink, color: '#F5F2EB', fontFamily: FONTS.body, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <Logo size={16} color="#F5F2EB" />
          <Eyebrow color={TOKENS.amber} style={{ marginTop: 60, marginBottom: 14 }}>YOUR DRAW · YOUR GAME</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 52, letterSpacing: '-0.045em', lineHeight: 0.95 }}>
            Find your<br/>draw.<br/><span style={{ fontStyle: 'italic', color: TOKENS.amber }}>Win it.</span>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button style={{ background: '#F5F2EB', color: TOKENS.ink, border: 'none', borderRadius: 8, padding: '14px 16px', fontSize: 14.5, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
               Continue with Apple
            </button>
            <button style={{ background: 'transparent', color: '#F5F2EB', border: '1px solid #3A3833', borderRadius: 8, padding: '14px 16px', fontSize: 14.5, fontWeight: 500 }}>
              Continue with Google
            </button>
            <button style={{ background: 'transparent', color: '#F5F2EB', border: '1px solid #3A3833', borderRadius: 8, padding: '14px 16px', fontSize: 14.5, fontWeight: 500 }}>
              Continue with email
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18, fontSize: 12, color: '#9C9890' }}>
            <span>Already have an account?</span>
            <span style={{ color: TOKENS.amber, fontWeight: 500 }}>Log in</span>
          </div>
          <div style={{ fontSize: 10.5, color: '#6E6A62', textAlign: 'center', marginTop: 22, lineHeight: 1.5 }}>By continuing you agree to PB Draw's<br/>Terms and Privacy Policy.</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 9. MOBILE SPECTATOR — public live hub for a tournament
// ═══════════════════════════════════════════════════════════════════
function MobileSpectator() {
  return (
    <div style={{ background: TOKENS.paper, fontFamily: FONTS.body, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: TOKENS.ink, color: '#F5F2EB', padding: 18 }}>
        <Eyebrow color={TOKENS.amber} style={{ marginBottom: 10 }}><Dot color={TOKENS.amber} size={4} pulse /> LIVE · 13:42 PT</Eyebrow>
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 30, letterSpacing: '-0.035em', lineHeight: 1 }}>The Bay Open</div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: '#9C9890', marginTop: 8 }}>MX 4.5 · 6 COURTS · DAY 1 / 2</div>
      </div>
      <div style={{ padding: '12px 16px 8px' }}>
        <Eyebrow>LIVE NOW · 3 COURTS</Eyebrow>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        {[
          { c: 'CT 1', a: 'Hartwell / Vega', sa: '6', b: 'Okonkwo / Reyes', sb: '3', g: 'GAME 2' },
          { c: 'CT 2', a: 'Park / Ali',       sa: '8', b: 'Romano / Patel',  sb: '7', g: 'GAME 2', tight: true },
          { c: 'CT 4', a: 'Walsh / Tanaka',   sa: '9', b: 'Devereaux / Ito', sb: '11', g: 'GAME 3', tight: true },
        ].map((m, i) => (
          <div key={i} style={{ marginTop: 10, padding: 12, background: TOKENS.surface, border: `1px solid ${m.tight ? TOKENS.amber : TOKENS.hairline}`, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Pill tone="amber" mono><Dot color={TOKENS.amber} size={4} pulse /> {m.c} · {m.g}</Pill>
              <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.muted }}>QUARTERFINAL</span>
            </div>
            {[[m.a, m.sa, m.sb], [m.b, m.sb, m.sa]].map(([t, s, o], k) => {
              const w = parseInt(s) > parseInt(o);
              return (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <span style={{ fontSize: 13, fontWeight: w ? 600 : 500, color: w ? TOKENS.ink : TOKENS.muted }}>{t}</span>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: 500, color: w ? TOKENS.ink : TOKENS.muted }}>{s}</span>
                </div>
              );
            })}
          </div>
        ))}

        <div style={{ marginTop: 18 }}>
          <Eyebrow style={{ marginBottom: 10 }}>UP NEXT · CT 1</Eyebrow>
          <div style={{ background: TOKENS.courtTint, padding: 14, borderRadius: 8, border: `1px solid ${TOKENS.hairline}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: 16, fontWeight: 500 }}>14:00</span>
              <Pill tone="court" mono>SEMIFINAL</Pill>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 8 }}>Hartwell / Vega <span style={{ color: TOKENS.muted, fontWeight: 400 }}>vs</span> Walsh / Devereaux</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${TOKENS.hairline}`, background: TOKENS.surface, display: 'flex', gap: 8 }}>
        <Btn variant="amber" size="md" style={{ flex: 1 }} icon={<Icon name="play" size={12} color="#FFF" />}>Watch CT 1</Btn>
        <Btn variant="outline" size="md" icon={<Icon name="bracket" size={12} />}>Draw</Btn>
      </div>
    </div>
  );
}

Object.assign(window, {
  MobileBracket, MobileDetail, MobileScoreEntry, MobileDashboard, MobileProfile,
  MobilePartner, MobileCheckout, MobileAuth, MobileSpectator,
});
