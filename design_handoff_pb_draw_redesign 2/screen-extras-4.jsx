// Final batch: Analytics, Leagues, League detail, Teams, Spectator, Scanner,
// Skill quiz, Payment success, Blog, Not found.

// =====================================================================
// ANALYTICS DASHBOARD — organizer-facing
// =====================================================================
function AnalyticsScreen() {
  return (
    <div style={{ width: 1440, minHeight: 1100, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="host" />
      <div style={{ padding: '28px 32px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>BAY PB CO. · LAST 12 MONTHS</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 48, letterSpacing: '-0.04em', lineHeight: 1 }}>Analytics</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="outline" size="sm">Last 12 months ▾</Btn>
          <Btn variant="outline" size="sm" icon={<Icon name="share" size={13}/>}>Export CSV</Btn>
        </div>
      </div>

      {/* KPI band */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: `1px solid ${TOKENS.hairline}` }}>
        {[
          { l: 'GROSS REVENUE', v: '$184.2k', d: '+22% YoY' },
          { l: 'TOURNAMENTS',   v: '38',      d: '12 in last 90d' },
          { l: 'REGISTRATIONS', v: '2,847',   d: 'avg 74.9 per event' },
          { l: 'RETENTION',     v: '64%',     d: 'returning players' },
          { l: 'FILL RATE',     v: '91%',     d: 'avg slots claimed' },
        ].map((k, i) => (
          <div key={i} style={{ padding: '22px 26px', borderRight: i < 4 ? `1px solid ${TOKENS.hairline}` : 'none', background: TOKENS.surface }}>
            <KPI label={k.l} value={k.v} delta={k.d} />
          </div>
        ))}
      </div>

      <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <Card padded={false}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionHead eyebrow="REVENUE" title="Monthly gross · 2025–26" dense />
            <div style={{ display: 'flex', gap: 6 }}>
              {['12M','6M','3M'].map((p,i) => <span key={p} style={{ padding: '5px 11px', fontSize: 11.5, fontFamily: FONTS.mono, borderRadius: 4, background: i===0 ? TOKENS.ink : 'transparent', color: i===0 ? '#FFF' : TOKENS.muted, border: `1px solid ${i===0 ? TOKENS.ink : TOKENS.hairline}` }}>{p}</span>)}
            </div>
          </div>
          {/* Bar chart */}
          <div style={{ padding: 22, display: 'flex', alignItems: 'flex-end', gap: 8, height: 240, borderBottom: `1px solid ${TOKENS.hairline}` }}>
            {[
              ['MAY','7.2'],['JUN','9.4'],['JUL','11.1'],['AUG','12.8'],['SEP','15.6'],['OCT','18.2'],
              ['NOV','14.3'],['DEC','10.8'],['JAN','12.4'],['FEB','17.6'],['MAR','21.4'],['APR','24.1','live'],
            ].map(([m, v, live], i) => (
              <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.muted }}>${v}k</span>
                <div style={{ width: '100%', height: parseFloat(v) * 7, background: live ? TOKENS.amber : TOKENS.ink, borderRadius: '2px 2px 0 0' }} />
                <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: live ? TOKENS.amber : TOKENS.faint, letterSpacing: '0.1em', fontWeight: live ? 600 : 400 }}>{m}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '14px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            {[
              ['Tournament fees', '$148.4k', 80],
              ['Membership',      '$22.8k',  12],
              ['Merchandise',     '$9.6k',   5],
              ['Court rentals',   '$3.4k',   3],
            ].map(([l, v, pct]) => (
              <div key={l}>
                <Eyebrow style={{ marginBottom: 6 }}>{l}</Eyebrow>
                <div style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: 500 }}>{v}</div>
                <div style={{ height: 3, background: TOKENS.hairline, borderRadius: 99, marginTop: 6 }}>
                  <div style={{ width: pct + '%', height: '100%', background: TOKENS.court, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <Eyebrow style={{ marginBottom: 12 }}>TOP EVENTS · BY GROSS</Eyebrow>
            {[
              { n: 'The Bay Open',        g: '$24.1k', f: '128 / 128' },
              { n: 'Sonoma Series',       g: '$18.6k', f: '96 / 96' },
              { n: 'Pacific Heights Pro', g: '$16.2k', f: '64 / 64' },
              { n: 'Marin Mixers',        g: '$8.4k',  f: '48 / 48' },
              { n: 'Indoor Winter Cup',   g: '$6.8k',  f: '48 / 64' },
            ].map((e, i, a) => (
              <div key={e.n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < a.length-1 ? `1px solid ${TOKENS.hairline}` : 'none' }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{e.n}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, marginTop: 2 }}>{e.f}</div>
                </div>
                <span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 500 }}>{e.g}</span>
              </div>
            ))}
          </Card>
          <Card>
            <Eyebrow style={{ marginBottom: 12 }}>PLAYER MIX</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {/* Donut */}
              <svg width="100" height="100" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke={TOKENS.hairline} strokeWidth="6" />
                <circle cx="18" cy="18" r="14" fill="none" stroke={TOKENS.court} strokeWidth="6" strokeDasharray="51 88" strokeDashoffset="0" transform="rotate(-90 18 18)" />
                <circle cx="18" cy="18" r="14" fill="none" stroke={TOKENS.amber} strokeWidth="6" strokeDasharray="26 88" strokeDashoffset="-51" transform="rotate(-90 18 18)" />
                <circle cx="18" cy="18" r="14" fill="none" stroke={TOKENS.ink} strokeWidth="6" strokeDasharray="11 88" strokeDashoffset="-77" transform="rotate(-90 18 18)" />
              </svg>
              <div style={{ flex: 1, fontSize: 12 }}>
                {[['Doubles', '58%', TOKENS.court], ['Mixed', '30%', TOKENS.amber], ['Singles', '12%', TOKENS.ink]].map(([l, v, c]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                    <span style={{ flex: 1, color: TOKENS.muted }}>{l}</span>
                    <span style={{ fontFamily: FONTS.mono, color: TOKENS.ink, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card>
            <Eyebrow style={{ marginBottom: 10 }}>FUNNEL · BAY OPEN</Eyebrow>
            {[
              ['Visited page', '4,824', 100],
              ['Started reg.', '1,492', 31],
              ['Picked partner', '688', 14],
              ['Paid',          '256', 5.3],
            ].map(([l, v, pct]) => (
              <div key={l} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: TOKENS.muted }}>{l}</span>
                  <span style={{ fontFamily: FONTS.mono }}>{v} <span style={{ color: TOKENS.faint }}>· {pct}%</span></span>
                </div>
                <div style={{ height: 5, background: TOKENS.hairline, borderRadius: 99 }}>
                  <div style={{ width: pct + '%', height: '100%', background: TOKENS.ink, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
window.AnalyticsScreen = AnalyticsScreen;

// =====================================================================
// LEAGUES — listing
// =====================================================================
function LeaguesScreen() {
  const leagues = [
    { n: 'NorCal Doubles', s: '8 weeks', d: 'Spring 26', tag: '4.0–4.5', f: '$95', teams: 24, color: TOKENS.court },
    { n: 'Bay Mixed Ladder', s: '12 weeks', d: 'Spring 26', tag: 'All levels', f: '$60', teams: 64, color: TOKENS.amber },
    { n: 'Sonoma Singles',   s: '6 weeks', d: 'Summer 26', tag: '4.5+', f: '$85', teams: 16, color: TOKENS.ink },
    { n: 'Indoor Winter',   s: '10 weeks', d: 'Winter 25', tag: 'Open', f: '$120', teams: 32 },
  ];
  return (
    <div style={{ width: 1440, minHeight: 1000, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="browse" />
      <div style={{ padding: '40px 32px 28px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
        <Eyebrow style={{ marginBottom: 10 }}>RECURRING PLAY · ACROSS THE BAY</Eyebrow>
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 64, letterSpacing: '-0.04em', lineHeight: 0.96 }}>Leagues.</div>
        <div style={{ fontSize: 14.5, color: TOKENS.ink2, marginTop: 12, maxWidth: 560 }}>Show up every week. Track form across the season. Auto-scheduled matches, automatic standings, optional payouts.</div>
      </div>

      <div style={{ padding: 32, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {leagues.map((l, i) => (
          <Card key={l.n} padded={false} style={{ overflow: 'hidden' }}>
            <div style={{ height: 6, background: l.color || TOKENS.hairline }} />
            <div style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <Eyebrow style={{ marginBottom: 6 }}>{l.d.toUpperCase()} · {l.s.toUpperCase()}</Eyebrow>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 26, letterSpacing: '-0.025em' }}>{l.n}</div>
                </div>
                <Pill tone="court" mono>{l.tag}</Pill>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 18, paddingTop: 18, borderTop: `1px solid ${TOKENS.hairline}` }}>
                {[
                  ['ENTRY', l.f],
                  ['TEAMS', `${l.teams}`],
                  ['MATCHES', `${l.teams * 3}`],
                  ['STARTS', l.d.split(' ')[0] === 'Spring' ? 'Mar 4' : (l.d.split(' ')[0] === 'Summer' ? 'Jun 7' : 'Nov 9')],
                ].map(([k, v]) => (
                  <div key={k}>
                    <Eyebrow style={{ marginBottom: 4 }}>{k}</Eyebrow>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 17, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <Btn variant="primary" size="sm" icon={<Icon name="arrow-right" size={12} color="#FFF" />}>Register team</Btn>
                <Btn variant="outline" size="sm">Standings</Btn>
                <Btn variant="ghost" size="sm">Rules</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
window.LeaguesScreen = LeaguesScreen;

// =====================================================================
// LEAGUE DETAIL — season standings
// =====================================================================
function LeagueDetailScreen() {
  return (
    <div style={{ width: 1440, minHeight: 1100, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="browse" />
      <div style={{ padding: '32px 32px 18px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'end' }}>
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>SPRING 2026 · WEEK 5 OF 8 · DUPR 4.0–4.5</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 56, letterSpacing: '-0.04em', lineHeight: 0.96 }}>NorCal Doubles League</div>
          <div style={{ fontSize: 14, color: TOKENS.ink2, marginTop: 12 }}>Tuesdays + Thursdays · Bay PB Co., Sausalito Courts, Crissy Field · 24 teams, double round-robin.</div>
        </div>
        <Card style={{ background: TOKENS.ink, color: '#F5F2EB', borderColor: TOKENS.ink }}>
          <Eyebrow color="#9C9890" style={{ marginBottom: 8 }}>NEXT WEEK · WEEK 6</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 20, letterSpacing: '-0.025em' }}>3 matches scheduled</div>
          <div style={{ fontSize: 12, color: '#C4C0B8', marginTop: 6 }}>Tue 12 May, 18:30 · Court 1, 3, 5</div>
          <Btn variant="amber" size="sm" style={{ marginTop: 14 }}>View schedule</Btn>
        </Card>
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 32px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', gap: 28, background: TOKENS.surface2 }}>
        {['Standings', 'Schedule', 'Stats leaders', 'Teams', 'Rules'].map((t, i) => (
          <span key={t} style={{ fontSize: 13, fontWeight: 500, color: i === 0 ? TOKENS.ink : TOKENS.muted,
            paddingBottom: 14, marginBottom: -14, borderBottom: i === 0 ? `2px solid ${TOKENS.ink}` : '2px solid transparent' }}>{t}</span>
        ))}
      </div>

      <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <Card padded={false}>
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
            <SectionHead eyebrow="STANDINGS · 24 TEAMS · WEEK 5" title="Top of the table" dense
              action={<Btn variant="ghost" size="sm">Tiebreakers →</Btn>} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 50px 50px 50px 70px 70px', padding: '8px 22px', borderBottom: `1px solid ${TOKENS.hairline}`, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.1em', color: TOKENS.faint, fontWeight: 500 }}>
            <div>#</div><div>TEAM</div>
            <div style={{ textAlign: 'right' }}>P</div><div style={{ textAlign: 'right' }}>W</div><div style={{ textAlign: 'right' }}>L</div>
            <div style={{ textAlign: 'right' }}>PTS</div><div style={{ textAlign: 'right' }}>FORM</div>
          </div>
          {[
            ['1', 'Hartwell / Vega',     '8', '7', '1', '21', 'WWWLW', true],
            ['2', 'Cho / Marquez',       '8', '6', '2', '18', 'WLWWW'],
            ['3', 'Devereaux / Ito',     '8', '6', '2', '18', 'WWWWL'],
            ['4', 'Walsh / Tanaka',      '8', '5', '3', '15', 'WLWLW'],
            ['5', 'Park / Ali',          '7', '4', '3', '12', 'LWWLW'],
            ['6', 'Beaumont / Sato',     '7', '4', '3', '12', 'WWLLW'],
            ['7', 'Romano / Patel',      '8', '3', '5',  '9', 'LLWWL'],
            ['8', 'Kapoor / Solberg',    '7', '3', '4',  '9', 'WLLWL'],
            ['9', 'Brennan / Singh',     '8', '2', '6',  '6', 'LLLWL'],
            ['10', 'Larsen / Nakamura',  '8', '2', '6',  '6', 'LLWLL'],
          ].map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 50px 50px 50px 70px 70px', alignItems: 'center', padding: '11px 22px', borderBottom: i < 9 ? `1px solid ${TOKENS.hairline}` : 'none',
              background: r[7] ? TOKENS.courtTint : TOKENS.surface }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: r[7] ? 700 : 500 }}>{r[0]}</span>
              <span style={{ fontSize: 13.5, fontWeight: r[7] ? 600 : 500 }}>{r[1]}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.muted, textAlign: 'right' }}>{r[2]}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.court, textAlign: 'right' }}>{r[3]}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.muted, textAlign: 'right' }}>{r[4]}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{r[5]}</span>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {r[6].split('').map((c, k) => (
                  <span key={k} style={{ width: 12, height: 12, borderRadius: 2, background: c === 'W' ? TOKENS.court : TOKENS.faint,
                    color: '#FFF', fontFamily: FONTS.mono, fontSize: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{c}</span>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <Eyebrow style={{ marginBottom: 12 }}>STATS LEADERS</Eyebrow>
            {[
              ['Most wins', 'Hartwell / Vega', '7W'],
              ['Best diff', 'Devereaux / Ito', '+34'],
              ['Hot streak', 'Cho / Marquez', 'W4'],
              ['MVP votes',  'Maya Chen',     '142'],
            ].map(([l, t, v], i, a) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < a.length-1 ? `1px solid ${TOKENS.hairline}` : 'none' }}>
                <div>
                  <Eyebrow style={{ marginBottom: 3 }}>{l}</Eyebrow>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
                </div>
                <span style={{ fontFamily: FONTS.mono, fontSize: 16, fontWeight: 500, color: TOKENS.court, alignSelf: 'center' }}>{v}</span>
              </div>
            ))}
          </Card>
          <Card>
            <Eyebrow style={{ marginBottom: 10 }}>YOUR TEAM · #1</Eyebrow>
            <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em' }}>Hartwell / Vega</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 36, color: TOKENS.court, marginTop: 6, fontWeight: 500 }}>21 <span style={{ fontSize: 14, color: TOKENS.muted }}>pts</span></div>
            <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 6 }}>3 ahead of 2nd · clinch with 1 more win.</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
window.LeagueDetailScreen = LeagueDetailScreen;

// =====================================================================
// TEAMS — team management
// =====================================================================
function TeamsScreen() {
  return (
    <div style={{ width: 1440, minHeight: 980, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="me" />
      <div style={{ padding: '32px 32px 18px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>YOUR TEAMS · 6 ACTIVE</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 48, letterSpacing: '-0.04em' }}>Teams</div>
        </div>
        <Btn variant="primary" size="md" icon={<Icon name="plus" size={14} color="#FFF" />}>Create team</Btn>
      </div>

      <div style={{ padding: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {[
          { n: 'Hartwell / Vega',     d: 'Mixed Doubles 4.5',  r: '14W · 5L', form: 'WWWWL', primary: true, next: 'Bay Open · QF · today 14:00' },
          { n: 'Hartwell / Chen',     d: 'Mixed Doubles 4.5',  r: '8W · 3L',  form: 'WLWWW', next: 'Sonoma Series · May 15' },
          { n: 'Hartwell / Beaumont', d: 'Doubles 4.5',        r: '5W · 1L',  form: 'WWLWW', next: 'PHP · Jun 5' },
          { n: 'Hartwell / Park',     d: 'Mixed Doubles 4.5',  r: '3W · 2L',  form: 'WLWLW', archived: true },
          { n: 'Vega / Cho',          d: 'Mixed Doubles 4.5',  r: '11W · 4L', form: 'WWWWL', next: 'Marin Mixers · May 22' },
          { n: 'NorCal Doubles A',   d: 'League · 8 players',  r: '7W · 1L',  form: 'WWWLW', team: true, next: 'League · Tue 18:30' },
        ].map((t, i) => (
          <Card key={i} padded={false}>
            <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${TOKENS.hairline}` }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>{t.n}</span>
                  {t.primary && <Pill tone="amber" mono>ACTIVE</Pill>}
                  {t.archived && <Pill tone="outline" mono>ARCHIVED</Pill>}
                </div>
                <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 4 }}>{t.d}</div>
              </div>
              <Icon name="settings" size={14} color={TOKENS.muted} />
            </div>
            <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${TOKENS.hairline}` }}>
              <Avatar name={t.n.split(' / ')[0]} size={28} tone="paper" />
              {!t.team && <Avatar name={t.n.split(' / ')[1] || ''} size={28} tone="paper" style={{ marginLeft: -10 }} />}
              {t.team && <Avatar name="A" size={28} tone="paper" style={{ marginLeft: -10 }} />}
              {t.team && <Avatar name="B" size={28} tone="paper" style={{ marginLeft: -10 }} />}
              <span style={{ marginLeft: 'auto', fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.court, fontWeight: 500 }}>{t.r}</span>
              <div style={{ display: 'flex', gap: 2 }}>
                {t.form.split('').map((c, k) => (
                  <span key={k} style={{ width: 10, height: 10, borderRadius: 2, background: c === 'W' ? TOKENS.court : TOKENS.faint }} />
                ))}
              </div>
            </div>
            <div style={{ padding: '12px 20px', fontSize: 12, color: TOKENS.muted }}>
              <Eyebrow style={{ marginBottom: 4 }}>NEXT</Eyebrow>
              <span style={{ color: TOKENS.ink, fontSize: 12.5 }}>{t.next || '—'}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
window.TeamsScreen = TeamsScreen;

// =====================================================================
// SPECTATOR — public live hub for a tournament
// =====================================================================
function SpectatorScreen() {
  return (
    <div style={{ width: 1440, minHeight: 1000, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="live" />
      <div style={{ background: TOKENS.ink, color: '#F5F2EB', padding: '36px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
          <div>
            <Eyebrow color={TOKENS.amber} style={{ marginBottom: 12 }}><Dot color={TOKENS.amber} size={6} pulse /> LIVE · DAY 1 OF 2 · 13:42 PT</Eyebrow>
            <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 72, letterSpacing: '-0.04em', lineHeight: 0.95 }}>The Bay Open</div>
            <div style={{ fontSize: 14, color: '#C4C0B8', marginTop: 14 }}>Crissy Field · Mixed Doubles 4.5 · 6 courts · 96 players</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="amber" size="md" icon={<Icon name="play" size={14} color="#FFF" />}>Watch Court 1</Btn>
            <Btn variant="ghost" size="md" style={{ color: '#F5F2EB', border: '1px solid #3A3833' }} icon={<Icon name="bell" size={14} color="#F5F2EB" />}>Follow</Btn>
          </div>
        </div>
      </div>

      {/* Live courts strip */}
      <div style={{ padding: '24px 32px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
        <SectionHead eyebrow="LIVE NOW · 3 COURTS" title="Quarterfinals in progress" dense />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 14 }}>
          {[
            { c: 'CT 1', a: 'Hartwell / Vega', b: 'Okonkwo / Reyes',  sa: '6', sb: '3', g: 'GAME 2', srv: 'a' },
            { c: 'CT 2', a: 'Park / Ali',       b: 'Romano / Patel',   sa: '8', sb: '7', g: 'GAME 2', srv: 'a' },
            { c: 'CT 4', a: 'Walsh / Tanaka',   b: 'Devereaux / Ito',  sa: '9', sb: '11', g: 'GAME 3', srv: 'b', tight: true },
          ].map((m, i) => (
            <Card key={i} padded={false} style={{ borderColor: m.tight ? TOKENS.amber : TOKENS.hairline }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Pill tone="amber" mono><Dot color={TOKENS.amber} size={5} pulse /> {m.c} · {m.g}</Pill>
                <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted }}>QUARTERFINAL</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <ScoreRow team={m.a} score={m.sa} serving={m.srv === 'a'} winning={parseInt(m.sa) > parseInt(m.sb)} />
                <div style={{ height: 1, background: TOKENS.hairline, margin: '10px 0' }} />
                <ScoreRow team={m.b} score={m.sb} serving={m.srv === 'b'} winning={parseInt(m.sb) > parseInt(m.sa)} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Schedule + leaders */}
      <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <Card padded={false}>
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
            <SectionHead eyebrow="UP NEXT · COURT 1" title="The road to the final" dense
              action={<Btn variant="ghost" size="sm">Full schedule →</Btn>} />
          </div>
          {[
            { t: '14:00', r: 'SF', a: 'Hartwell / Vega', b: 'Walsh ⁄ Devereaux (winner CT 4)', c: 'CT 1' },
            { t: '14:00', r: 'SF', a: 'Park / Ali', b: 'Cho / Marquez', c: 'CT 4' },
            { t: '16:30', r: 'F',  a: 'SF1', b: 'SF2', c: 'CT 1', big: true },
          ].map((m, i, a) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 50px 1fr 60px', alignItems: 'center',
              padding: '14px 22px', borderBottom: i < a.length-1 ? `1px solid ${TOKENS.hairline}` : 'none',
              background: m.big ? TOKENS.courtTint : TOKENS.surface }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: m.big ? 18 : 14, fontWeight: 500 }}>{m.t}</span>
              <Pill tone={m.big ? 'court' : 'outline'} mono>{m.r}</Pill>
              <div style={{ fontSize: m.big ? 15 : 13.5, fontWeight: m.big ? 600 : 500 }}>{m.a} <span style={{ color: TOKENS.muted, fontWeight: 400 }}>vs</span> {m.b}</div>
              <Pill tone="outline" mono>{m.c}</Pill>
            </div>
          ))}
        </Card>

        <Card>
          <Eyebrow style={{ marginBottom: 12 }}>WIN PROBABILITIES</Eyebrow>
          {[
            ['Hartwell / Vega', 32, '#1'],
            ['Cho / Marquez',   26, '#4'],
            ['Devereaux / Ito', 18, '#3'],
            ['Walsh / Tanaka',  14, '#6'],
            ['Park / Ali',       6, '#5'],
            ['Others',           4, ''],
          ].map(([t, p, s], i, a) => (
            <div key={t} style={{ padding: '10px 0', borderBottom: i < a.length-1 ? `1px solid ${TOKENS.hairline}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                <span><span style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.muted, marginRight: 6 }}>{s}</span>{t}</span>
                <span style={{ fontFamily: FONTS.mono, fontWeight: 500 }}>{p}%</span>
              </div>
              <div style={{ height: 4, background: TOKENS.hairline, borderRadius: 99 }}>
                <div style={{ width: p + '%', height: '100%', background: i === 0 ? TOKENS.amber : TOKENS.ink, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function ScoreRow({ team, score, serving, winning }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {serving && <Dot color={TOKENS.court} size={6} />}
        <span style={{ fontSize: 14, fontWeight: winning ? 600 : 500, color: winning ? TOKENS.ink : TOKENS.ink2 }}>{team}</span>
      </div>
      <span style={{ fontFamily: FONTS.mono, fontSize: 22, fontWeight: 500, color: winning ? TOKENS.ink : TOKENS.muted, lineHeight: 1 }}>{score}</span>
    </div>
  );
}
window.SpectatorScreen = SpectatorScreen;

// =====================================================================
// SCANNER — check-in
// =====================================================================
function ScannerScreen() {
  return (
    <div style={{ width: 1440, height: 900, background: TOKENS.ink, fontFamily: FONTS.body, color: '#F5F2EB', display: 'grid', gridTemplateColumns: '1.2fr 1fr' }}>
      <div style={{ padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid #3A3833' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo size={20} color="#F5F2EB" />
          <Pill tone="amber" mono><Dot color={TOKENS.amber} size={5} pulse /> SCANNING · CT 1</Pill>
        </div>

        {/* Camera viewport */}
        <div style={{ aspectRatio: '4/3', background: '#0A0A09', border: `2px solid ${TOKENS.amber}`, borderRadius: 12, position: 'relative', display: 'grid', placeItems: 'center', overflow: 'hidden', margin: '24px 0' }}>
          <div style={{ position: 'absolute', inset: 24, border: `1px dashed rgba(245,242,235,0.2)`, borderRadius: 6 }} />
          {/* Corners */}
          {[[0,0,'NW'],[0,1,'NE'],[1,0,'SW'],[1,1,'SE']].map(([y,x,p]) => (
            <div key={p} style={{ position: 'absolute', [y?'bottom':'top']: 40, [x?'right':'left']: 40, width: 32, height: 32,
              borderTop: y?'none':`3px solid ${TOKENS.amber}`, borderBottom: y?`3px solid ${TOKENS.amber}`:'none',
              borderLeft: x?'none':`3px solid ${TOKENS.amber}`, borderRight: x?`3px solid ${TOKENS.amber}`:'none' }} />
          ))}
          <Icon name="qr" size={220} color="#F5F2EB" strokeWidth={0.5} />
          <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.amber, letterSpacing: '0.14em' }}>● SCANNING…</div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="outline" size="md" style={{ background: 'transparent', color: '#F5F2EB', borderColor: '#3A3833' }}>Manual lookup</Btn>
          <Btn variant="outline" size="md" style={{ background: 'transparent', color: '#F5F2EB', borderColor: '#3A3833' }}>Flashlight</Btn>
          <Btn variant="ghost" size="md" style={{ color: '#F5F2EB', marginLeft: 'auto' }}>Settings</Btn>
        </div>
      </div>

      <div style={{ padding: 48, display: 'flex', flexDirection: 'column' }}>
        <Eyebrow color="#9C9890" style={{ marginBottom: 12 }}>LAST CHECK-IN · 2 SEC AGO</Eyebrow>
        <div style={{ background: '#1A1815', border: '1px solid #3A3833', borderRadius: 10, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <span style={{ width: 44, height: 44, borderRadius: '50%', background: TOKENS.court, display: 'grid', placeItems: 'center' }}>
              <Icon name="check" size={22} color="#FFF" strokeWidth={2.6} />
            </span>
            <div>
              <div style={{ fontFamily: FONTS.display, fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em' }}>Hartwell / Vega</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.amber, letterSpacing: '0.1em' }}>CHECKED IN · 13:44</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, paddingTop: 18, borderTop: '1px dashed #3A3833' }}>
            {[['EVENT', 'Mixed Doubles 4.5'], ['ROUND', 'Quarterfinal'], ['COURT', 'CT 1'], ['TIME', '14:00 PT'], ['SEED', '#1'], ['PAID', '$130']].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.14em', color: '#9C9890' }}>{k}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 14, color: '#F5F2EB', marginTop: 3 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <Eyebrow color="#9C9890" style={{ marginBottom: 12, marginTop: 28 }}>QUEUE · 3 PENDING</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { n: 'Cho / Marquez',     t: '14:00 · CT 4', s: 'paid' },
            { n: 'Walsh / Tanaka',    t: '13:30 · CT 4', s: 'late' },
            { n: 'Park / Ali',         t: '14:00 · CT 2', s: 'paid' },
          ].map(p => (
            <div key={p.n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#1A1815', borderRadius: 6, border: '1px solid #3A3833' }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.n}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: '#9C9890', marginTop: 2 }}>{p.t}</div>
              </div>
              {p.s === 'late' ? <Pill tone="amber" mono>LATE · 12 MIN</Pill> : <Pill tone="outline" mono>WAITING</Pill>}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[['62', 'CHECKED IN'], ['3', 'PENDING'], ['1', 'LATE']].map(([v, l]) => (
            <div key={l} style={{ padding: 14, background: '#1A1815', borderRadius: 6, border: '1px solid #3A3833' }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 24, fontWeight: 500, color: l === 'LATE' ? TOKENS.amber : '#F5F2EB' }}>{v}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: '#9C9890', letterSpacing: '0.12em', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.ScannerScreen = ScannerScreen;

// =====================================================================
// SKILL QUIZ
// =====================================================================
function SkillQuizScreen() {
  return (
    <div style={{ width: 1440, minHeight: 900, background: TOKENS.paper, fontFamily: FONTS.body, display: 'grid', gridTemplateColumns: '1fr 1.4fr' }}>
      <div style={{ background: TOKENS.ink, color: '#F5F2EB', padding: 60, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Logo size={20} color="#F5F2EB" />
        <div>
          <Eyebrow color={TOKENS.amber} style={{ marginBottom: 14 }}>SKILL ASSESSMENT · NO DUPR REQUIRED</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 64, letterSpacing: '-0.045em', lineHeight: 0.95 }}>
            Twelve<br/>questions.<br/>
            <span style={{ fontStyle: 'italic', color: TOKENS.amber }}>One number.</span>
          </div>
          <div style={{ fontSize: 14, color: '#C4C0B8', marginTop: 24, maxWidth: 380 }}>Estimated rating in 4 minutes. Organizers use it to seed brackets when you're unverified.</div>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#9C9890' }}>
          <span>~4 MIN</span><span>·</span><span>12 QUESTIONS</span><span>·</span><span>NON-BINDING</span>
        </div>
      </div>

      <div style={{ padding: 60, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <Eyebrow>QUESTION 6 OF 12</Eyebrow>
          <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.muted }}>~2 MIN LEFT</span>
        </div>
        <div style={{ height: 4, background: TOKENS.hairline, borderRadius: 99, marginBottom: 36 }}>
          <div style={{ width: '50%', height: '100%', background: TOKENS.ink, borderRadius: 99 }} />
        </div>

        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12 }}>
          When you're at the kitchen line and your opponent pops up a ball, what do you do?
        </div>
        <div style={{ fontSize: 14, color: TOKENS.muted, marginBottom: 32 }}>Pick the answer that matches your most common reaction in tournament play.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { l: 'Reset to a soft dink — I want the rally',                  k: 'A' },
            { l: "Slam it cross-court at the opponent's feet",                k: 'B', sel: true },
            { l: 'Ernie it down the line if I can step around',               k: 'C' },
            { l: "I'm not sure — I usually just keep it in play",            k: 'D' },
          ].map(o => (
            <label key={o.k} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: 18,
              border: `1px solid ${o.sel ? TOKENS.ink : TOKENS.hairline}`,
              background: o.sel ? TOKENS.surface : TOKENS.surface,
              borderRadius: 8, position: 'relative',
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                background: o.sel ? TOKENS.ink : 'transparent',
                color: o.sel ? '#FFF' : TOKENS.muted,
                border: `1px solid ${o.sel ? TOKENS.ink : TOKENS.rule}`,
                fontFamily: FONTS.mono, fontWeight: 600, fontSize: 12,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{o.k}</span>
              <span style={{ flex: 1, fontSize: 14.5, color: TOKENS.ink, fontWeight: o.sel ? 500 : 400 }}>{o.l}</span>
              {o.sel && <Icon name="check" size={16} color={TOKENS.court} strokeWidth={2.6} />}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 36 }}>
          <Btn variant="outline" size="md">← Back</Btn>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" size="md">Skip</Btn>
            <Btn variant="primary" size="md" icon={<Icon name="arrow-right" size={14} color="#FFF" />}>Continue</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
window.SkillQuizScreen = SkillQuizScreen;

// =====================================================================
// PAYMENT SUCCESS
// =====================================================================
function PaymentSuccessScreen() {
  return (
    <div style={{ width: 1440, height: 900, background: TOKENS.paper, fontFamily: FONTS.body, display: 'grid', placeItems: 'center', padding: 40 }}>
      <div style={{ width: 720, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 88, height: 88, borderRadius: '50%', background: TOKENS.court, marginBottom: 28 }}>
          <Icon name="check" size={42} color="#F5F2EB" strokeWidth={2.6} />
        </div>
        <Eyebrow style={{ marginBottom: 14 }}>RECEIPT NO. PBD-26-04812 · MAY 9 · 09:14 PT</Eyebrow>
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 76, letterSpacing: '-0.045em', lineHeight: 0.95 }}>
          You're in.
        </div>
        <div style={{ fontSize: 15, color: TOKENS.ink2, marginTop: 20, maxWidth: 460, marginInline: 'auto' }}>Hartwell / Vega — Mixed Doubles 4.5. We sent a receipt and ticket to <strong>eli@hartwell.io</strong>.</div>

        <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 10, padding: 24, marginTop: 36, textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          {[
            ['EVENT', 'The Bay Open'],
            ['DATES', 'Sat 09 – Sun 10 May'],
            ['DIVISION', 'Mixed Doubles 4.5'],
            ['TEAM', 'Hartwell / Vega'],
            ['CHECK-IN', '07:30 – 08:30 · gear tent'],
            ['TOTAL PAID', '$131.50'],
          ].map(([k, v]) => (
            <div key={k}>
              <Eyebrow style={{ marginBottom: 4 }}>{k}</Eyebrow>
              <div style={{ fontFamily: FONTS.mono, fontSize: 15, color: TOKENS.ink }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 32 }}>
          <Btn variant="primary" size="lg" icon={<Icon name="qr" size={16} color="#FFF" />}>View ticket</Btn>
          <Btn variant="outline" size="lg" icon={<Icon name="bracket" size={14} />}>See the draw</Btn>
          <Btn variant="ghost" size="lg">Add to calendar</Btn>
        </div>

        <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 28 }}>Free cancellation through May 4 · Bay PB Co. is the merchant of record · <span style={{ color: TOKENS.ink, textDecoration: 'underline' }}>Read the refund policy</span></div>
      </div>
    </div>
  );
}
window.PaymentSuccessScreen = PaymentSuccessScreen;

// =====================================================================
// BLOG
// =====================================================================
function BlogScreen() {
  const posts = [
    { e: 'EDITORIAL', t: 'How we redesigned the bracket', a: 'Lena Park', d: 'May 6 · 8 min', tag: 'Behind the scenes' },
    { e: 'TACTICS',   t: 'Three resets every 4.5 should master', a: 'Maya Chen', d: 'May 3 · 6 min', tag: 'How to' },
    { e: 'REPORT',    t: 'Inside the Bay Open — what changed for organizers', a: 'Eli Hartwell', d: 'Apr 28 · 10 min', tag: 'Field notes' },
    { e: 'OPINION',   t: 'Pool play is a feature, not a fallback', a: 'Theo Walsh', d: 'Apr 20 · 5 min', tag: 'Hot takes' },
  ];
  return (
    <div style={{ width: 1440, minHeight: 1100, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="browse" />
      <div style={{ padding: '60px 32px 36px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
        <Eyebrow style={{ marginBottom: 14 }}>NO. 12 · MAY 2026 · NOTES FROM THE DRAW</Eyebrow>
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 96, letterSpacing: '-0.045em', lineHeight: 0.95 }}>
          The Draw.
        </div>
        <div style={{ fontSize: 16, color: TOKENS.ink2, marginTop: 20, maxWidth: 580, lineHeight: 1.55 }}>Match notes, tactics, organizer playbooks, and the occasional opinion. Edited by the PB Draw team.</div>
      </div>

      {/* Hero post */}
      <div style={{ padding: '36px 32px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'center' }}>
        <div>
          <Pill tone="amber" mono>FEATURED</Pill>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 56, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 18 }}>
            Three resets every 4.5 should master before next weekend.
          </div>
          <div style={{ fontSize: 15, color: TOKENS.ink2, marginTop: 18, lineHeight: 1.55, maxWidth: 560 }}>Soft hands win matches at 4.5. Here's the cross-court drop, the C-shape reset, and the lob defense — broken down rep by rep.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22 }}>
            <Avatar name="Maya Chen" size={36} tone="paper" />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Maya Chen</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted }}>MAY 3 · 6 MIN</span>
          </div>
        </div>
        <div style={{ aspectRatio: '4/3', background: TOKENS.court, borderRadius: 10, position: 'relative', overflow: 'hidden' }}>
          {/* Stylized court diagram */}
          <div style={{ position: 'absolute', inset: 32, border: '2px solid rgba(245,242,235,0.4)', borderRadius: 4 }} />
          <div style={{ position: 'absolute', left: 32, right: 32, top: '38%', height: 2, background: 'rgba(245,242,235,0.4)' }} />
          <div style={{ position: 'absolute', left: 32, right: 32, top: '62%', height: 2, background: 'rgba(245,242,235,0.4)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 32, bottom: 32, width: 2, background: 'rgba(245,242,235,0.4)' }} />
          <div style={{ position: 'absolute', left: '24%', top: '34%', width: 14, height: 14, borderRadius: '50%', background: TOKENS.amber }} />
          <div style={{ position: 'absolute', left: '70%', top: '64%', width: 14, height: 14, borderRadius: '50%', background: TOKENS.amber, opacity: 0.6 }} />
          <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 400 300" preserveAspectRatio="none">
            <path d="M100 110 Q 200 30 280 200" stroke="#F5F2EB" strokeWidth="2" fill="none" strokeDasharray="6 6" />
          </svg>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: 32, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 22 }}>
        {posts.map((p, i) => (
          <article key={i} style={{ padding: '22px 0', borderTop: `1px solid ${TOKENS.hairline}` }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <Pill tone="outline" mono>{p.e}</Pill>
              <Pill tone="court" mono>{p.tag}</Pill>
            </div>
            <h2 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 28, letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0 }}>{p.t}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
              <Avatar name={p.a} size={26} tone="paper" />
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>{p.a}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted }}>· {p.d}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
window.BlogScreen = BlogScreen;

// =====================================================================
// 404
// =====================================================================
function NotFoundScreen() {
  return (
    <div style={{ width: 1440, height: 900, background: TOKENS.paper, fontFamily: FONTS.body, display: 'grid', placeItems: 'center', padding: 40 }}>
      <div style={{ textAlign: 'center', maxWidth: 620 }}>
        <Eyebrow style={{ marginBottom: 18 }}>HTTP · NO. 404 · DRAW NOT FOUND</Eyebrow>
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 280, letterSpacing: '-0.06em', lineHeight: 0.85, color: TOKENS.ink, position: 'relative' }}>
          4<span style={{ color: TOKENS.amber, fontStyle: 'italic' }}>0</span>4
        </div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 32, letterSpacing: '-0.03em', marginTop: 18 }}>This bracket doesn't exist yet.</div>
        <div style={{ fontSize: 15, color: TOKENS.ink2, marginTop: 12, lineHeight: 1.55 }}>Maybe the tournament moved, the link aged out, or the draw hasn't been seeded. Pick a way back.</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 32 }}>
          <Btn variant="primary" size="lg" icon={<Icon name="arrow-right" size={14} color="#FFF" />}>Browse tournaments</Btn>
          <Btn variant="outline" size="lg" icon={<Icon name="bracket" size={14} />}>Live brackets</Btn>
          <Btn variant="ghost" size="lg">Contact organizer</Btn>
        </div>
      </div>
    </div>
  );
}
window.NotFoundScreen = NotFoundScreen;
