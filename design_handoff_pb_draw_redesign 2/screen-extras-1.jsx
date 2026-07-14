// Pool standings + Score-entry referee sheet + Player dashboard + Auth

// =====================================================================
// POOL STANDINGS
// =====================================================================
const POOLS = [
  { name: 'Pool A', teams: [
    { seed: 1, name: 'Hartwell / Vega',   w: 3, l: 0, pf: 33, pa: 14, diff: 19, advance: true },
    { seed: 2, name: 'Park / Ali',         w: 2, l: 1, pf: 28, pa: 22, diff: 6,  advance: true },
    { seed: 3, name: 'Brennan / Singh',    w: 1, l: 2, pf: 24, pa: 28, diff: -4 },
    { seed: 4, name: 'Iverson / Reed',     w: 0, l: 3, pf: 13, pa: 34, diff: -21 },
  ]},
  { name: 'Pool B', teams: [
    { seed: 1, name: 'Cho / Marquez',      w: 3, l: 0, pf: 33, pa: 18, diff: 15, advance: true },
    { seed: 2, name: 'Kapoor / Solberg',   w: 2, l: 1, pf: 27, pa: 21, diff: 6,  advance: true },
    { seed: 3, name: 'Larsen / Nakamura',  w: 1, l: 2, pf: 22, pa: 26, diff: -4 },
    { seed: 4, name: 'Khoury / Pierce',    w: 0, l: 3, pf: 11, pa: 33, diff: -22 },
  ]},
  { name: 'Pool C', teams: [
    { seed: 1, name: 'Devereaux / Ito',    w: 3, l: 0, pf: 33, pa: 12, diff: 21, advance: true },
    { seed: 2, name: 'Walsh / Tanaka',     w: 2, l: 1, pf: 26, pa: 24, diff: 2,  advance: true, live: true },
    { seed: 3, name: 'Acosta / Brown',     w: 1, l: 1, pf: 19, pa: 21, diff: -2, live: true },
    { seed: 4, name: 'Quinn / Halsey',     w: 0, l: 2, pf: 14, pa: 26, diff: -12 },
  ]},
  { name: 'Pool D', teams: [
    { seed: 1, name: 'Romano / Patel',     w: 2, l: 0, pf: 22, pa: 13, diff: 9, advance: true },
    { seed: 2, name: 'Beaumont / Sato',    w: 2, l: 0, pf: 22, pa: 11, diff: 11, advance: true },
    { seed: 3, name: 'Becker / Gomez',     w: 0, l: 2, pf: 14, pa: 24, diff: -10 },
    { seed: 4, name: 'Okonkwo / Reyes',    w: 0, l: 2, pf: 9,  pa: 19, diff: -10 },
  ]},
];

function PoolCard({ pool }) {
  return (
    <Card padded={false}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', borderBottom: `1px solid ${TOKENS.hairline}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>{pool.name}</div>
          {pool.teams.some(t => t.live) && <Pill tone="amber" mono><Dot color={TOKENS.amber} size={5} pulse /> LIVE</Pill>}
        </div>
        <span style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: '0.14em', color: TOKENS.muted }}>
          {pool.teams.filter(t => t.advance).length} ADVANCE
        </span>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '20px 1fr 28px 28px 36px 36px 36px 24px',
        padding: '8px 18px',
        borderBottom: `1px solid ${TOKENS.hairline}`,
        fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.1em', color: TOKENS.faint, fontWeight: 500,
      }}>
        <div>#</div><div>TEAM</div><div style={{ textAlign: 'right' }}>W</div><div style={{ textAlign: 'right' }}>L</div>
        <div style={{ textAlign: 'right' }}>PF</div><div style={{ textAlign: 'right' }}>PA</div><div style={{ textAlign: 'right' }}>±</div><div></div>
      </div>
      {pool.teams.map((t, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '20px 1fr 28px 28px 36px 36px 36px 24px',
          alignItems: 'center', padding: '11px 18px',
          borderBottom: i < 3 ? `1px solid ${TOKENS.hairline}` : 'none',
          background: t.advance ? TOKENS.surface : (t.live ? TOKENS.amberTint : TOKENS.surface),
        }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted }}>{t.seed}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: TOKENS.ink, fontWeight: t.advance ? 600 : 500 }}>{t.name}</span>
            {t.live && <Dot color={TOKENS.amber} size={5} pulse />}
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 13, textAlign: 'right', color: TOKENS.ink, fontWeight: 500 }}>{t.w}</div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 13, textAlign: 'right', color: TOKENS.muted }}>{t.l}</div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 12, textAlign: 'right', color: TOKENS.ink2 }}>{t.pf}</div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 12, textAlign: 'right', color: TOKENS.muted }}>{t.pa}</div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 12, textAlign: 'right', color: t.diff > 0 ? TOKENS.court : (t.diff < 0 ? TOKENS.muted : TOKENS.ink) }}>{t.diff > 0 ? '+' : ''}{t.diff}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {t.advance && <span style={{ width: 5, height: 22, background: TOKENS.court, borderRadius: 2 }} />}
          </div>
        </div>
      ))}
    </Card>
  );
}

function PoolStandingsScreen() {
  return (
    <div style={{ width: 1440, minHeight: 900, background: TOKENS.paper, fontFamily: FONTS.body, color: TOKENS.ink }}>
      <TopNav active="live" />
      <div style={{ padding: '24px 32px 18px', borderBottom: `1px solid ${TOKENS.hairline}`,
        display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 32 }}>
        <div>
          <Eyebrow style={{ marginBottom: 8 }}>SAT 09 MAY · DAY 1 · POOL PLAY</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 40, letterSpacing: '-0.035em', lineHeight: 1 }}>The Bay Open · Pool standings</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 12, alignItems: 'center', fontSize: 13, color: TOKENS.muted }}>
            <span>Mixed Doubles · 4.5</span><span>·</span>
            <span>16 teams · 4 pools of 4</span><span>·</span>
            <span>Top 2 advance · 8-team bracket</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="outline" size="sm" icon={<Icon name="share" size={14} />}>Public link</Btn>
          <Btn variant="outline" size="sm" icon={<Icon name="bracket" size={14} />}>Generate playoff bracket</Btn>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 32px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', alignItems: 'center', gap: 24, background: TOKENS.surface2 }}>
        <div style={{ display: 'flex', gap: 0, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6, overflow: 'hidden', background: TOKENS.surface }}>
          {['Pool play', 'Bracket', 'Schedule', 'Standings'].map((t, i) => (
            <span key={t} style={{ padding: '7px 14px', fontFamily: FONTS.body, fontSize: 12.5, fontWeight: 500,
              background: i === 0 ? TOKENS.ink : 'transparent', color: i === 0 ? '#FFF' : TOKENS.ink2,
              borderRight: i < 3 ? `1px solid ${TOKENS.hairline}` : 'none' }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
          {['All pools', 'Pool A', 'Pool B', 'Pool C', 'Pool D'].map((t, i) => (
            <span key={t} style={{ padding: '5px 11px', borderRadius: 999, fontSize: 12, fontWeight: 500,
              background: i === 0 ? TOKENS.courtTint : 'transparent', color: i === 0 ? TOKENS.courtInk : TOKENS.muted,
              border: `1px solid ${i === 0 ? '#CCDAC9' : TOKENS.hairline}` }}>{t}</span>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, letterSpacing: '0.1em' }}>UPDATED 13:42 PT</span>
      </div>

      {/* Two pool grids */}
      <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {POOLS.map(p => <PoolCard key={p.name} pool={p} />)}
      </div>

      {/* Pool play schedule strip */}
      <div style={{ padding: '0 32px 36px' }}>
        <Card padded={false}>
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
            <div>
              <Eyebrow style={{ marginBottom: 4 }}>POOL C · LIVE</Eyebrow>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>Round-robin · 6 matches</div>
            </div>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted }}>4 of 6 complete</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, background: TOKENS.hairline }}>
            {[
              { a: 'Devereaux/Ito', b: 'Quinn/Halsey',   r: '15–7',  state: 'final' },
              { a: 'Walsh/Tanaka',  b: 'Acosta/Brown',   r: '15–11', state: 'final' },
              { a: 'Devereaux/Ito', b: 'Acosta/Brown',  r: '15–8',  state: 'final' },
              { a: 'Walsh/Tanaka',  b: 'Quinn/Halsey',   r: '15–7',  state: 'final' },
              { a: 'Devereaux/Ito', b: 'Walsh/Tanaka', r: '8–6',   state: 'live' },
              { a: 'Acosta/Brown',  b: 'Quinn/Halsey',  r: '14:00', state: 'upcoming' },
            ].map((m, i) => (
              <div key={i} style={{ background: m.state === 'live' ? TOKENS.amberTint : TOKENS.surface, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.14em', color: m.state === 'live' ? '#7C3F0A' : TOKENS.muted, fontWeight: 600 }}>
                    {m.state === 'live' ? 'LIVE' : m.state === 'final' ? 'FINAL' : 'NEXT'}
                  </span>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 500, color: TOKENS.ink }}>{m.r}</span>
                </div>
                <div style={{ fontSize: 12, color: TOKENS.ink, fontWeight: 500, lineHeight: 1.45 }}>{m.a}</div>
                <div style={{ fontSize: 11, color: TOKENS.muted, margin: '2px 0' }}>vs</div>
                <div style={{ fontSize: 12, color: TOKENS.ink2, lineHeight: 1.45 }}>{m.b}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

window.PoolStandingsScreen = PoolStandingsScreen;

// =====================================================================
// SCORE ENTRY — referee sheet
// =====================================================================
function ScoreEntryScreen() {
  return (
    <div style={{ width: 1440, minHeight: 900, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="live" />
      <div style={{ padding: '24px 32px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
        <Eyebrow style={{ marginBottom: 8 }}>BAY OPEN · COURT 1 · QUARTERFINAL</Eyebrow>
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 36, letterSpacing: '-0.035em', lineHeight: 1 }}>Score entry</div>
      </div>

      <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        {/* Score sheet */}
        <Card padded={false}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Pill tone="amber" mono><Dot color={TOKENS.amber} size={5} pulse /> LIVE · GAME 2</Pill>
              <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.muted }}>Best of 3 · to 11 · win by 2</span>
            </div>
            <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.muted }}>01:14 elapsed</span>
          </div>

          {/* Team A */}
          <div style={{ padding: '20px 22px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, letterSpacing: '0.14em' }}>SEED 6</span>
                  <Pill tone="court" mono><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Dot color={TOKENS.court} size={5}/> SERVING</span></Pill>
                </div>
                <div style={{ fontFamily: FONTS.display, fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 4 }}>Walsh / Tanaka</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <ScoreCell label="GM 1" value="9" final />
                <ScoreCell label="GM 2" value="8" active />
                <ScoreCell label="GM 3" value="–" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="court" size="md" icon={<Icon name="plus" size={14} color="#F2F8EE" />}>Point</Btn>
              <Btn variant="outline" size="md">Side-out</Btn>
              <Btn variant="ghost" size="md">Undo last</Btn>
            </div>
          </div>

          {/* Team B */}
          <div style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, letterSpacing: '0.14em' }}>SEED 3</span>
                </div>
                <div style={{ fontFamily: FONTS.display, fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 4 }}>Devereaux / Ito</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <ScoreCell label="GM 1" value="11" final />
                <ScoreCell label="GM 2" value="6" active />
                <ScoreCell label="GM 3" value="–" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="court" size="md" icon={<Icon name="plus" size={14} color="#F2F8EE" />}>Point</Btn>
              <Btn variant="outline" size="md">Side-out</Btn>
              <Btn variant="ghost" size="md">Undo last</Btn>
            </div>
          </div>

          {/* Sequence */}
          <div style={{ padding: '14px 22px', borderTop: `1px solid ${TOKENS.hairline}`, background: TOKENS.surface2 }}>
            <Eyebrow style={{ marginBottom: 10 }}>RALLY LOG · GAME 2</Eyebrow>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, fontFamily: FONTS.mono, fontSize: 11 }}>
              {['1A','2A','2B','3B','4B','5B','5A','6A','6B','7B','7A','8A'].map((s, i) => (
                <span key={i} style={{
                  padding: '3px 8px', borderRadius: 4,
                  background: s.endsWith('A') ? TOKENS.courtTint : TOKENS.surface,
                  border: `1px solid ${s.endsWith('A') ? '#CCDAC9' : TOKENS.hairline}`,
                  color: s.endsWith('A') ? TOKENS.courtInk : TOKENS.ink2,
                }}>{s}</span>
              ))}
            </div>
          </div>
        </Card>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <Eyebrow style={{ marginBottom: 10 }}>MATCH</Eyebrow>
            {[
              ['Format', 'Best of 3 · to 11'],
              ['Win by', '2'],
              ['Court', '1 (Center)'],
              ['Round', 'Quarterfinal'],
              ['Started', '13:30 PT'],
              ['Referee', 'M. Reyes'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px dashed ${TOKENS.hairline}` }}>
                <span style={{ fontSize: 12.5, color: TOKENS.muted }}>{k}</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 12.5, color: TOKENS.ink }}>{v}</span>
              </div>
            ))}
          </Card>
          <Card>
            <Eyebrow style={{ marginBottom: 10 }}>QUICK ACTIONS</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Btn variant="outline" size="md" full>Time-out · Walsh / Tanaka</Btn>
              <Btn variant="outline" size="md" full>Time-out · Devereaux / Ito</Btn>
              <Btn variant="outline" size="md" full>Medical pause</Btn>
              <Btn variant="ghost" size="md" full>Report dispute</Btn>
            </div>
          </Card>
          <Card style={{ background: TOKENS.ink, color: '#F5F2EB', borderColor: TOKENS.ink }}>
            <Eyebrow color="#9C9890" style={{ marginBottom: 10 }}>WIN PROBABILITY</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: 38, fontWeight: 500, letterSpacing: '-0.025em' }}>62<span style={{ fontSize: 18, color: '#9C9890' }}>%</span></span>
              <span style={{ fontSize: 12.5, color: '#C4C0B8' }}>Devereaux / Ito to advance</span>
            </div>
            <div style={{ height: 6, background: '#3A3833', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '62%', background: '#C2691A' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: FONTS.mono, fontSize: 10, color: '#9C9890', letterSpacing: '0.1em' }}>
              <span>WALSH/TANAKA 38%</span><span>DEVEREAUX/ITO 62%</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ScoreCell({ label, value, active, final }) {
  return (
    <div style={{
      width: 64, padding: '8px 0',
      border: `1px solid ${active ? TOKENS.amber : TOKENS.hairline}`,
      background: active ? TOKENS.amberTint : (final ? TOKENS.surface2 : TOKENS.surface),
      borderRadius: 4, textAlign: 'center',
    }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: '0.18em', color: TOKENS.muted, fontWeight: 500 }}>{label}</div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 32, fontWeight: 500, color: value === '–' ? TOKENS.faint : TOKENS.ink, fontFeatureSettings: '"tnum" 1', lineHeight: 1, marginTop: 2 }}>{value}</div>
    </div>
  );
}

window.ScoreEntryScreen = ScoreEntryScreen;

// =====================================================================
// PLAYER DASHBOARD
// =====================================================================
function PlayerDashboardScreen() {
  return (
    <div style={{ width: 1440, minHeight: 1000, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="browse" />
      <div style={{ padding: '32px 32px 18px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32, alignItems: 'end', borderBottom: `1px solid ${TOKENS.hairline}` }}>
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>SAT · 13:42 PT · 23 °C, LIGHT WIND</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 56, letterSpacing: '-0.04em', lineHeight: 0.98 }}>
            Good afternoon, Maya.
          </div>
          <div style={{ fontSize: 14.5, color: TOKENS.ink2, marginTop: 12 }}>You're up next on Court 4 in 18 minutes. Cho/Marquez are rolling — they took Pool B 3–0.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Card style={{ padding: 18, background: TOKENS.ink, color: '#F5F2EB', borderColor: TOKENS.ink }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Eyebrow color="#C2691A" style={{ marginBottom: 8 }}>NEXT MATCH · IN 18 MIN</Eyebrow>
                <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em' }}>Hartwell / Vega vs Cho / Marquez</div>
                <div style={{ fontSize: 12.5, color: '#C4C0B8', marginTop: 6 }}>Quarterfinal · Mixed Doubles 4.5 · Court 4</div>
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 38, fontWeight: 500, letterSpacing: '-0.02em', color: '#C2691A', lineHeight: 1 }}>14:00</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Btn variant="amber" size="sm">Check in</Btn>
              <Btn variant="ghost" size="sm" style={{ color: '#C4C0B8', borderColor: '#3A3833', border: '1px solid #3A3833' }}>Map to court</Btn>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 32px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', gap: 28, background: TOKENS.surface2 }}>
        {['Overview', 'Tournaments', 'Partners', 'Tickets', 'Messages'].map((t, i) => (
          <span key={t} style={{ fontSize: 13, fontWeight: 500, color: i === 0 ? TOKENS.ink : TOKENS.muted,
            paddingBottom: 14, marginBottom: -14,
            borderBottom: i === 0 ? `2px solid ${TOKENS.ink}` : '2px solid transparent' }}>{t}</span>
        ))}
      </div>

      <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Stats */}
          <Card>
            <SectionHead eyebrow="2026 SEASON" title="Form" dense
              action={<Btn variant="ghost" size="sm">Full record →</Btn>}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: TOKENS.hairline, border: `1px solid ${TOKENS.hairline}` }}>
              {[
                { l: 'DUPR', v: '4.52', d: '+0.08 vs last month' },
                { l: 'WIN %', v: '68%', d: '34W · 16L over 50' },
                { l: 'TOURNAMENTS', v: '7', d: '2 podiums · 1 gold' },
                { l: 'STREAK', v: 'W 4', d: 'Last loss 2 wks ago' },
              ].map((k, i) => (
                <div key={i} style={{ background: TOKENS.surface, padding: '18px 20px' }}>
                  <KPI label={k.l} value={k.v} delta={k.d} />
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming */}
          <Card>
            <SectionHead eyebrow="UPCOMING · 4" title="Your tournaments" dense
              action={<Btn variant="ghost" size="sm" icon={<Icon name="plus" size={13} />}>Find more</Btn>}
            />
            {TOURNEYS.slice(0, 4).map(t => <TournamentRow key={t.id} t={t} />)}
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <Eyebrow style={{ marginBottom: 10 }}>PARTNER · 3 INVITES</Eyebrow>
            {[
              { name: 'Jin Park', dupr: '4.5', tag: 'Asked you · Sonoma Series' },
              { name: 'Ana Solberg', dupr: '4.4', tag: 'Asked you · Marin Mixers' },
              { name: 'Theo Walsh', dupr: '4.6', tag: 'You asked · pending' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 2 ? `1px solid ${TOKENS.hairline}` : 'none' }}>
                <Avatar name={p.name} size={34} tone="paper" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name} <span style={{ color: TOKENS.muted, fontFamily: FONTS.mono, fontSize: 11, marginLeft: 4 }}>DUPR {p.dupr}</span></div>
                  <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 2 }}>{p.tag}</div>
                </div>
                <Btn variant="outline" size="sm">View</Btn>
              </div>
            ))}
          </Card>
          <Card>
            <Eyebrow style={{ marginBottom: 10 }}>TICKETS</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { e: 'Bay Open', d: 'Today · CT 4 · 14:00' },
                { e: 'Sonoma Series', d: 'May 15 · check-in 07:30' },
                { e: 'Pacific Heights Pro', d: 'Jun 5 · pending payment' },
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6 }}>
                  <div style={{ width: 36, height: 36, border: `1px solid ${TOKENS.hairline}`, borderRadius: 4, display: 'grid', placeItems: 'center' }}><Icon name="qr" size={20} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{t.e}</div>
                    <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 2 }}>{t.d}</div>
                  </div>
                  <Icon name="chevron-right" size={14} color={TOKENS.muted} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

window.PlayerDashboardScreen = PlayerDashboardScreen;

// =====================================================================
// AUTH
// =====================================================================
function AuthScreen() {
  return (
    <div style={{ width: 1440, height: 900, background: TOKENS.paper, fontFamily: FONTS.body, display: 'grid', gridTemplateColumns: '1.1fr 1fr' }}>
      {/* Left: editorial */}
      <div style={{ padding: 60, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: `1px solid ${TOKENS.hairline}` }}>
        <Logo size={20} />
        <div>
          <Eyebrow style={{ marginBottom: 18 }}>NO. 12 · MAY 2026</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 76, letterSpacing: '-0.045em', lineHeight: 0.95, color: TOKENS.ink }}>
            Show up.<br/>
            <span style={{ fontStyle: 'italic', color: TOKENS.court }}>Play to it.</span>
          </div>
          <div style={{ fontSize: 15, color: TOKENS.ink2, marginTop: 22, maxWidth: 460, lineHeight: 1.55 }}>
            240 open draws this week. Find the right one, snag a partner, and let the bracket decide.
          </div>
          <div style={{ display: 'flex', gap: 36, marginTop: 36 }}>
            {[['18.4k', 'PLAYERS'], ['240', 'OPEN DRAWS'], ['28', 'STATES']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}>{v}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.16em', color: TOKENS.muted, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: TOKENS.muted }}>"Cleanest scoring sheet I've used. The bracket page alone is worth it." <strong style={{ color: TOKENS.ink }}>— Lena, organizer, Bay PB Co.</strong></div>
      </div>

      {/* Right: form */}
      <div style={{ padding: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 480 }}>
        <Eyebrow style={{ marginBottom: 14 }}>WELCOME BACK</Eyebrow>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1 }}>Sign in to PB Draw</div>

        <div style={{ display: 'flex', gap: 4, marginTop: 28, padding: 4, background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8, width: 'fit-content' }}>
          {['Sign in', 'Create account'].map((t, i) => (
            <span key={t} style={{ padding: '6px 14px', fontSize: 12.5, fontWeight: 500, borderRadius: 6,
              background: i === 0 ? TOKENS.ink : 'transparent', color: i === 0 ? '#FFF' : TOKENS.muted }}>{t}</span>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
          <Field label="Email" value="maya.chen@example.com" />
          <Field label="Password" value="••••••••••" trailing="Show" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: TOKENS.muted }}>
              <span style={{ width: 14, height: 14, border: `1px solid ${TOKENS.rule}`, borderRadius: 3, background: TOKENS.surface, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={9} color={TOKENS.ink} strokeWidth={2.4} /></span>
              Remember me
            </label>
            <span style={{ fontSize: 12.5, color: TOKENS.ink, textDecoration: 'underline', textDecorationColor: TOKENS.hairline }}>Forgot password?</span>
          </div>
          <Btn variant="primary" size="lg" full icon={<Icon name="arrow-right" size={14} color="#FFF" />}>Sign in</Btn>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: TOKENS.faint, fontSize: 11 }}>
            <span style={{ flex: 1, height: 1, background: TOKENS.hairline }} /> OR <span style={{ flex: 1, height: 1, background: TOKENS.hairline }} />
          </div>
          <Btn variant="outline" size="lg" full>Continue with Apple</Btn>
          <Btn variant="outline" size="lg" full>Continue with Google</Btn>
        </div>

        <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 28 }}>
          New here? <span style={{ color: TOKENS.ink, fontWeight: 500 }}>Create an account</span> — registration doesn't require it. Browse, register, pay; we ask later.
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, trailing }) {
  return (
    <div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: '0.14em', color: TOKENS.muted, fontWeight: 500, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6 }}>
        <span style={{ fontSize: 14, color: TOKENS.ink, flex: 1 }}>{value}</span>
        {trailing && <span style={{ fontSize: 12, color: TOKENS.muted, fontWeight: 500 }}>{trailing}</span>}
      </div>
    </div>
  );
}

window.AuthScreen = AuthScreen;
