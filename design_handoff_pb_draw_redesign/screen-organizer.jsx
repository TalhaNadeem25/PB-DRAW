// Organizer Command Center — workflow-based dashboard with progress checklist.

function OrgChecklist() {
  const phases = [
    { name: 'Setup', items: [
      { label: 'Tournament info', done: true },
      { label: 'Events configured', done: true, meta: '4 events' },
      { label: 'Pricing & refund policy', done: true },
    ]},
    { name: 'Pre-tournament', items: [
      { label: 'Player check-in', done: true, meta: '94 / 96' },
      { label: 'Pool assignments', done: true, meta: '8 pools' },
      { label: 'Court schedule', done: true, meta: '6 courts' },
      { label: 'Pre-event email sent', done: true },
    ]},
    { name: 'Day-of', items: [
      { label: 'Open courts at 08:00', done: true },
      { label: 'Pool play running', done: true, active: true, meta: '24 / 32 matches' },
      { label: 'Generate playoff bracket', done: false, active: true },
      { label: 'Live scoring active', done: false },
    ]},
    { name: 'Post-tournament', items: [
      { label: 'Final standings', done: false },
      { label: 'Prize distribution', done: false },
      { label: 'Payout to organizer', done: false },
    ]},
  ];

  return (
    <Card>
      <SectionHead eyebrow="WORKFLOW" title="Tournament progression" dense
        action={<Btn variant="ghost" size="sm" icon={<Icon name="spark" size={13} />}>Auto-advance</Btn>}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {phases.map((phase, pi) => {
          const allDone = phase.items.every(i => i.done);
          const someActive = phase.items.some(i => i.active);
          return (
            <div key={phase.name} style={{ paddingTop: pi === 0 ? 0 : 14, paddingBottom: 14, borderTop: pi === 0 ? 'none' : `1px solid ${TOKENS.hairline}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.faint, letterSpacing: '0.14em',
                    width: 18, textAlign: 'right',
                  }}>{String(pi + 1).padStart(2, '0')}</span>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.02em', color: TOKENS.ink }}>{phase.name}</div>
                  {someActive && <Pill tone="amber" mono><Dot color={TOKENS.amber} size={5} pulse /> ACTIVE</Pill>}
                  {allDone && <Pill tone="court" mono>COMPLETE</Pill>}
                </div>
              </div>
              <div style={{ paddingLeft: 28, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {phase.items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: 3,
                        border: `1px solid ${it.done ? TOKENS.court : (it.active ? TOKENS.amber : TOKENS.rule)}`,
                        background: it.done ? TOKENS.court : (it.active ? TOKENS.amberTint : 'transparent'),
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {it.done && <Icon name="check" size={9} color="#F5F2EB" strokeWidth={2.4} />}
                        {it.active && !it.done && <Dot color={TOKENS.amber} size={5} pulse />}
                      </span>
                      <span style={{
                        fontSize: 13,
                        color: it.done ? TOKENS.muted : TOKENS.ink,
                        textDecoration: it.done ? 'line-through' : 'none',
                        fontWeight: it.active ? 500 : 400,
                      }}>{it.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {it.meta && <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted }}>{it.meta}</span>}
                      {it.active && !it.done && <Btn variant="primary" size="sm">Start</Btn>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CourtsLive() {
  const courts = [
    { n: 1, status: 'live', match: 'Walsh / Tanaka v Devereaux / Ito', score: '8 – 6 · GM 2' },
    { n: 2, status: 'live', match: 'Beaumont / Sato v Romano / Patel', score: '4 – 2 · GM 1' },
    { n: 3, status: 'turnover', match: 'Cleaning · 4 min', score: 'Next: Hartwell/Vega v Cho/Marquez' },
    { n: 4, status: 'open', match: 'Open', score: 'Next: 14:00' },
    { n: 5, status: 'live', match: 'Park / Ali v Larsen / Nakamura', score: '11 – 9, 7 – 4 · GM 2' },
    { n: 6, status: 'open', match: 'Open', score: 'Next: 14:30' },
  ];
  const statusTone = { live: TOKENS.amber, turnover: TOKENS.muted, open: TOKENS.faint };
  return (
    <Card>
      <SectionHead eyebrow="6 COURTS" title="Court status" dense
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" size="sm">Reassign</Btn>
            <Btn variant="outline" size="sm" icon={<Icon name="court" size={13} />}>Court manager</Btn>
          </div>
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: TOKENS.hairline, border: `1px solid ${TOKENS.hairline}` }}>
        {courts.map(c => (
          <div key={c.n} style={{ background: TOKENS.surface, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.faint, letterSpacing: '0.12em' }}>COURT</span>
                <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, letterSpacing: '-0.025em', color: TOKENS.ink }}>{c.n}</span>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: statusTone[c.status], fontWeight: 600 }}>
                {c.status === 'live' && <Dot color={TOKENS.amber} size={5} pulse />}
                {c.status}
              </span>
            </div>
            <div style={{ fontSize: 13, color: TOKENS.ink, fontWeight: 500, lineHeight: 1.3, minHeight: 34 }}>{c.match}</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, marginTop: 8 }}>{c.score}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NextUp() {
  const matches = [
    { t: '14:00', c: 'CT 4', match: 'Hartwell / Vega vs Cho / Marquez', round: 'QF · MX 4.5' },
    { t: '14:00', c: 'CT 6', match: 'Kapoor / Solberg vs Iverson / Reed', round: 'QF · MN 4.0' },
    { t: '14:30', c: 'CT 3', match: 'Okonkwo / Reyes vs Brennan / Singh', round: 'CONS · MX 4.0' },
    { t: '15:30', c: 'CT 1', match: 'SF1 winner', round: 'SF · MX 4.5' },
  ];
  return (
    <Card>
      <SectionHead eyebrow="UP NEXT · NEXT 90 MIN" title="Schedule" dense
        action={<Btn variant="ghost" size="sm" icon={<Icon name="calendar" size={13} />}>Full schedule</Btn>}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {matches.map((m, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '60px 50px 1fr auto',
            alignItems: 'center', gap: 14,
            padding: '12px 0',
            borderBottom: i < matches.length - 1 ? `1px solid ${TOKENS.hairline}` : 'none',
          }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 500, color: TOKENS.ink }}>{m.t}</div>
            <Pill tone="outline" mono>{m.c}</Pill>
            <div>
              <div style={{ fontSize: 13, color: TOKENS.ink, fontWeight: 500 }}>{m.match}</div>
              <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 2 }}>{m.round}</div>
            </div>
            <Btn variant="ghost" size="sm" icon={<Icon name="chevron-right" size={13} />} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function Inbox() {
  const items = [
    { who: 'Marcus Reyes', what: 'requested a refund', time: '4m', urgent: true },
    { who: 'Jin Park',     what: 'reported a score dispute · CT 5', time: '12m', urgent: true },
    { who: 'Ana Solberg',  what: 'late check-in approved', time: '38m' },
    { who: 'Auto',         what: 'Pool A standings updated', time: '1h' },
  ];
  return (
    <Card>
      <SectionHead eyebrow="INBOX" title="Action queue" dense
        action={<span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted }}>4 OPEN</span>}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0',
            borderBottom: i < items.length - 1 ? `1px solid ${TOKENS.hairline}` : 'none',
          }}>
            <Avatar name={it.who === 'Auto' ? 'P B' : it.who} tone={it.who === 'Auto' ? 'paper' : 'paper'} size={28} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: TOKENS.ink }}>
                <strong style={{ fontWeight: 600 }}>{it.who}</strong>
                <span style={{ color: TOKENS.muted }}> {it.what}</span>
              </div>
            </div>
            {it.urgent && <Dot color={TOKENS.amber} size={6} />}
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.faint, width: 28, textAlign: 'right' }}>{it.time}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function OrganizerScreen() {
  return (
    <div style={{ width: 1440, minHeight: 1080, background: TOKENS.paper, fontFamily: FONTS.body, color: TOKENS.ink }}>
      <TopNav active="host" />
      {/* Top bar with tournament context */}
      <div style={{
        padding: '32px 32px 24px',
        borderBottom: `1px solid ${TOKENS.hairline}`,
        display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 24,
      }}>
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>HOSTING · DAY 2 OF 2 · 13:42 PT</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 40, letterSpacing: '-0.035em', lineHeight: 1, color: TOKENS.ink }}>The Bay Open</div>
            <Pill tone="amber"><Dot color={TOKENS.amber} size={6} pulse /> 3 matches live</Pill>
            <span style={{ fontSize: 13, color: TOKENS.muted }}>96 players · 6 courts · 4 events</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="outline" size="sm" icon={<Icon name="bracket" size={14} />}>View bracket</Btn>
          <Btn variant="outline" size="sm" icon={<Icon name="mail" size={14} />}>Message all</Btn>
          <Btn variant="primary" size="sm" icon={<Icon name="bracket" size={14} color="#FFF" />}>Generate playoff</Btn>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{
        padding: '0 32px',
        borderBottom: `1px solid ${TOKENS.hairline}`,
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
      }}>
        {[
          { l: 'CHECKED IN', v: '94', d: 'of 96 · 98%' },
          { l: 'MATCHES PLAYED', v: '24', d: 'of 32 today' },
          { l: 'AVG MATCH', v: '24m', d: '↓ 3 min vs day 1' },
          { l: 'REVENUE', v: '$6,240', d: '$4,800 prize · $1,440 net' },
          { l: 'ON-TIME', v: '92%', d: '2 courts running 7m late' },
        ].map((k, i) => (
          <div key={i} style={{ borderRight: i < 4 ? `1px solid ${TOKENS.hairline}` : 'none', padding: '20px 24px 22px', paddingLeft: i === 0 ? 0 : 24 }}>
            <KPI label={k.l} value={k.v} delta={k.d} />
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <OrgChecklist />
          <NextUp />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <CourtsLive />
          <Inbox />
          {/* Insight strip */}
          <Card style={{ background: TOKENS.ink, border: `1px solid ${TOKENS.ink}`, color: '#F5F2EB' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 4, background: '#1F4A2E', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name="spark" size={16} color="#F5E5D2" />
              </div>
              <div style={{ flex: 1 }}>
                <Eyebrow color="#9C9890" style={{ marginBottom: 6 }}>DRAW ASSISTANT</Eyebrow>
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: '#F5F2EB', marginBottom: 8 }}>
                  Pool A finished 4 minutes early. Move the 14:00 quarterfinal up?
                </div>
                <div style={{ fontSize: 12.5, color: '#C4C0B8', lineHeight: 1.5, marginBottom: 14 }}>
                  Reassigning Court 1 from cleaning to Hartwell/Vega vs Cho/Marquez puts you 11 minutes ahead by 16:00 — buffer for the final.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="amber" size="sm">Apply suggestion</Btn>
                  <Btn variant="ghost" size="sm" style={{ color: '#C4C0B8', borderColor: '#3A3833' }}>Dismiss</Btn>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

window.OrganizerScreen = OrganizerScreen;
