// Mobile screens (in iOS frame) + Create Tournament Wizard + Find Partner

// ---------- MOBILE BROWSE ----------
function MobileBrowse() {
  return (
    <div style={{ background: TOKENS.paper, fontFamily: FONTS.body, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo size={15} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ width: 32, height: 32, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8, background: TOKENS.surface, display: 'grid', placeItems: 'center' }}><Icon name="search" size={14} /></button>
          <button style={{ width: 32, height: 32, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8, background: TOKENS.surface, display: 'grid', placeItems: 'center' }}><Icon name="bell" size={14} /></button>
        </div>
      </div>
      <div style={{ padding: '10px 18px 16px' }}>
        <Eyebrow style={{ marginBottom: 8 }}>NEAR YOU · 12 OPEN</Eyebrow>
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 38, letterSpacing: '-0.04em', lineHeight: 1 }}>Find a draw.</div>
      </div>
      <div style={{ padding: '0 18px 8px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {['All', 'This week', 'Doubles', 'Singles', 'Mixed', '4.0+'].map((f, i) => (
          <span key={f} style={{ padding: '6px 12px', borderRadius: 999, background: i === 1 ? TOKENS.ink : TOKENS.surface, color: i === 1 ? '#FFF' : TOKENS.ink2, border: `1px solid ${i === 1 ? TOKENS.ink : TOKENS.hairline}`, fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap' }}>{f}</span>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 100px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Featured */}
        <div style={{ background: TOKENS.ink, color: '#F5F2EB', borderRadius: 12, padding: 18, position: 'relative', overflow: 'hidden' }}>
          <Pill tone="amber" mono><Dot color={TOKENS.amber} size={5} pulse /> LIVE NOW</Pill>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 26, letterSpacing: '-0.025em', lineHeight: 1.05, marginTop: 12 }}>The Bay Open</div>
          <div style={{ fontSize: 12, color: '#C4C0B8', marginTop: 4 }}>Crissy Field · 6 courts · 96 players</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: '#9C9890', letterSpacing: '0.14em' }}>QUARTERFINALS</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 14, color: '#F5F2EB', marginTop: 4 }}>3 matches · CT 1, 2, 4</div>
            </div>
            <Btn variant="amber" size="sm" icon={<Icon name="play" size={11} color="#FFF" />}>Watch</Btn>
          </div>
        </div>
        {[
          { n: 'Sonoma Series', c: 'Healdsburg · 7 days', f: '$80', s: '38 / 128' },
          { n: 'Indoor Winter Cup', c: 'Reno · 14 days', f: '$55', s: '4 / 64', urgent: true },
          { n: 'Marin Mixers', c: 'Mill Valley · 21 days', f: '$45', s: '22 / 48' },
          { n: 'Pacific Heights Pro', c: 'San Francisco · 28 days', f: '$110', s: '6 / 64', urgent: true },
        ].map((t, i) => (
          <div key={i} style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>{t.n}</div>
                <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 3 }}>{t.c}</div>
              </div>
              <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 500 }}>{t.f}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: t.urgent ? TOKENS.amber : TOKENS.muted, letterSpacing: '0.06em' }}>{t.urgent && '● '}{t.s} REGISTERED</span>
              <Icon name="arrow-right" size={14} color={TOKENS.ink} />
            </div>
          </div>
        ))}
      </div>
      {/* Bottom tab bar */}
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, padding: '10px 14px' }}>
        <div style={{ background: TOKENS.ink, borderRadius: 16, padding: '12px 8px', display: 'flex', justifyContent: 'space-around' }}>
          {[
            { name: 'trophy', label: 'Explore', active: true },
            { name: 'play', label: 'Live' },
            { name: 'plus', label: 'Host' },
            { name: 'users', label: 'Partner' },
            { name: 'settings', label: 'Me' },
          ].map(t => (
            <div key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: t.active ? '#F5F2EB' : '#6B6863' }}>
              <Icon name={t.name} size={18} color={t.active ? '#F5F2EB' : '#6B6863'} />
              <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: '0.1em' }}>{t.label.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- MOBILE TICKET ----------
function MobileTicket() {
  return (
    <div style={{ background: TOKENS.paper, fontFamily: FONTS.body, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="chevron-right" size={18} strokeWidth={1.6} color={TOKENS.ink} />
        <span style={{ fontSize: 14, fontWeight: 500 }}>Your ticket</span>
      </div>
      <div style={{ padding: '20px 18px 8px' }}>
        <Eyebrow style={{ marginBottom: 8 }}>SAT 09 MAY · DAY 1 · 13:42 PT</Eyebrow>
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 32, letterSpacing: '-0.035em', lineHeight: 1 }}>Bay Open</div>
        <div style={{ fontSize: 13, color: TOKENS.muted, marginTop: 6 }}>Mixed Doubles 4.5 · Hartwell / Vega</div>
      </div>
      {/* Ticket card */}
      <div style={{ margin: '20px 18px 0', background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ background: TOKENS.ink, color: '#F5F2EB', padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <Eyebrow color="#9C9890" style={{ marginBottom: 6 }}>NEXT MATCH · IN 18 MIN</Eyebrow>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, letterSpacing: '-0.025em' }}>Quarterfinal · CT 4</div>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 32, fontWeight: 500, color: TOKENS.amber }}>14:00</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px dashed #3A3833' }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: '#9C9890', letterSpacing: '0.12em' }}>YOU</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>Hartwell / Vega</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: '#9C9890', letterSpacing: '0.12em' }}>OPPONENT</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>Cho / Marquez</div>
            </div>
          </div>
        </div>
        <div style={{ padding: 28, display: 'grid', placeItems: 'center', borderBottom: `1px dashed ${TOKENS.hairline}` }}>
          <div style={{ width: 180, height: 180, background: '#fff', display: 'grid', placeItems: 'center', border: `1px solid ${TOKENS.hairline}`, borderRadius: 4 }}>
            <Icon name="qr" size={140} color={TOKENS.ink} strokeWidth={1.4} />
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.18em', color: TOKENS.muted, marginTop: 14 }}>SCAN AT CHECK-IN</div>
        </div>
        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[['ENTRY', '$65 PAID'], ['SEED', '#1'], ['POOL', 'A · 1ST'], ['BRACKET', 'QF']].map(([k,v]) => (
            <div key={k}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.14em', color: TOKENS.muted }}>{k}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 500, color: TOKENS.ink, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '18px 18px 100px' }}>
        <Btn variant="primary" size="lg" full icon={<Icon name="arrow-right" size={14} color="#FFF" />}>I'm at Court 4</Btn>
        <Btn variant="ghost" size="md" full style={{ marginTop: 8 }}>Add to Apple Wallet</Btn>
      </div>
    </div>
  );
}

window.MobileBrowse = MobileBrowse;
window.MobileTicket = MobileTicket;

// =====================================================================
// CREATE TOURNAMENT WIZARD
// =====================================================================
function CreateScreen() {
  const steps = ['Basics', 'Events', 'Format', 'Courts & Schedule', 'Pricing', 'Review'];
  return (
    <div style={{ width: 1440, minHeight: 1000, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="host" />
      <div style={{ padding: '24px 32px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
        <div>
          <Eyebrow style={{ marginBottom: 8 }}>NEW DRAFT · LAST SAVED 2 MIN AGO</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 36, letterSpacing: '-0.035em' }}>Build a tournament</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm">Save & exit</Btn>
          <Btn variant="outline" size="sm">Preview public page</Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 800 }}>
        {/* Step rail */}
        <div style={{ borderRight: `1px solid ${TOKENS.hairline}`, padding: 32 }}>
          <Eyebrow style={{ marginBottom: 18 }}>STEPS · 3 OF 6</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {steps.map((s, i) => {
              const done = i < 2;
              const active = i === 2;
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 12px', borderRadius: 6, background: active ? TOKENS.surface : 'transparent', border: `1px solid ${active ? TOKENS.hairline : 'transparent'}` }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: `1px solid ${done ? TOKENS.court : (active ? TOKENS.ink : TOKENS.rule)}`,
                    background: done ? TOKENS.court : (active ? TOKENS.ink : 'transparent'),
                    color: done || active ? '#fff' : TOKENS.muted,
                    fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>{done ? <Icon name="check" size={11} color="#fff" strokeWidth={2.5} /> : i + 1}</span>
                  <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 500, color: done ? TOKENS.muted : TOKENS.ink }}>{s}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 36, padding: 16, background: TOKENS.courtTint, borderRadius: 6, border: `1px solid #CCDAC9` }}>
            <Eyebrow color={TOKENS.courtInk} style={{ marginBottom: 8 }}>DRAW ASSISTANT</Eyebrow>
            <div style={{ fontSize: 13, color: TOKENS.courtInk, lineHeight: 1.5 }}>
              For 32 players over 2 days on 6 courts, we'd suggest <strong>4 pools of 8 → top 2 advance</strong>. This finishes by 16:30.
            </div>
            <Btn variant="ghost" size="sm" style={{ marginTop: 10, color: TOKENS.courtInk }}>Apply layout</Btn>
          </div>
        </div>

        {/* Form pane — Format step */}
        <div style={{ padding: 40, maxWidth: 820 }}>
          <Eyebrow style={{ marginBottom: 8 }}>STEP 3 OF 6</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 32, letterSpacing: '-0.03em', marginBottom: 8 }}>Format</div>
          <div style={{ fontSize: 14, color: TOKENS.muted, maxWidth: 560, marginBottom: 28 }}>How does the draw progress? You can mix formats per event later.</div>

          <Eyebrow style={{ marginBottom: 12 }}>STRUCTURE</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 36 }}>
            {[
              { name: 'Pool → Bracket', desc: 'Round-robin pools, top N advance to single elim', selected: true },
              { name: 'Single elim', desc: 'Straight bracket with optional consolation' },
              { name: 'Double elim', desc: 'Winners + losers brackets, full reset on grand final' },
              { name: 'Round-robin', desc: 'Everyone plays everyone in their division' },
              { name: 'Ladder', desc: 'Continuous play; rankings updated live' },
              { name: 'Custom', desc: 'Stage-by-stage builder' },
            ].map((opt, i) => (
              <div key={i} style={{
                padding: 18,
                border: `1px solid ${opt.selected ? TOKENS.ink : TOKENS.hairline}`,
                background: opt.selected ? TOKENS.surface : TOKENS.surface,
                borderRadius: 8, position: 'relative',
              }}>
                {opt.selected && (
                  <span style={{ position: 'absolute', top: 14, right: 14, width: 18, height: 18, borderRadius: '50%', background: TOKENS.ink, display: 'grid', placeItems: 'center' }}>
                    <Icon name="check" size={10} color="#fff" strokeWidth={2.6} />
                  </span>
                )}
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>{opt.name}</div>
                <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 6, lineHeight: 1.4 }}>{opt.desc}</div>
              </div>
            ))}
          </div>

          <Eyebrow style={{ marginBottom: 12 }}>POOL CONFIG</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
            {[
              { l: 'NUMBER OF POOLS', v: '4', d: 'auto-balanced' },
              { l: 'TEAMS PER POOL', v: '4', d: '16 teams total' },
              { l: 'ADVANCE PER POOL', v: '2', d: 'top 2 to bracket' },
            ].map(c => (
              <div key={c.l} style={{ padding: 16, background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6 }}>
                <Eyebrow style={{ marginBottom: 6 }}>{c.l}</Eyebrow>
                <div style={{ fontFamily: FONTS.mono, fontSize: 28, fontWeight: 500, color: TOKENS.ink, fontFeatureSettings: '"tnum" 1' }}>{c.v}</div>
                <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 4 }}>{c.d}</div>
              </div>
            ))}
          </div>

          <Eyebrow style={{ marginBottom: 12 }}>MATCH FORMAT</Eyebrow>
          <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6, padding: '4px 0' }}>
            {[
              ['Pool play', 'Best of 1 · to 15, win by 2', true],
              ['Bracket', 'Best of 3 · to 11, win by 2', true],
              ['Semifinal', 'Best of 3 · to 11, win by 2', false],
              ['Bronze', 'Best of 1 · to 15, win by 2', false],
              ['Final', 'Best of 3 · to 15, win by 2', true],
            ].map(([k, v, custom], i, a) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: i < a.length - 1 ? `1px solid ${TOKENS.hairline}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.faint, width: 70, letterSpacing: '0.1em' }}>{k.toUpperCase()}</span>
                  <span style={{ fontSize: 13.5, color: TOKENS.ink, fontFamily: FONTS.mono }}>{v}</span>
                  {custom && <Pill tone="court" mono>CUSTOM</Pill>}
                </div>
                <Btn variant="ghost" size="sm">Edit</Btn>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, paddingTop: 24, borderTop: `1px solid ${TOKENS.hairline}` }}>
            <Btn variant="outline" size="md">Back · Events</Btn>
            <Btn variant="primary" size="md" icon={<Icon name="arrow-right" size={14} color="#FFF" />}>Continue · Courts & schedule</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

window.CreateScreen = CreateScreen;

// =====================================================================
// COMPONENT REFERENCE — design system page
// =====================================================================
function ComponentsScreen() {
  return (
    <div style={{ width: 1440, minHeight: 1100, background: TOKENS.paper, fontFamily: FONTS.body, color: TOKENS.ink }}>
      <div style={{ padding: '40px 40px 24px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
        <Eyebrow style={{ marginBottom: 12 }}>PB DRAW · DESIGN SYSTEM v0.1</Eyebrow>
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 56, letterSpacing: '-0.04em', lineHeight: 1 }}>Components</div>
        <div style={{ fontSize: 14, color: TOKENS.muted, marginTop: 12, maxWidth: 580 }}>The atoms that build every screen. Bricolage display + Geist body + Geist Mono numerics. Cream paper, white surfaces, court green & amber accents.</div>
      </div>

      <div style={{ padding: '32px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

        {/* Type */}
        <Card>
          <Eyebrow style={{ marginBottom: 16 }}>TYPE</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { f: FONTS.display, w: 800, s: 64, label: 'Display · Bricolage 800', text: 'The draw, resolved.' },
              { f: FONTS.display, w: 700, s: 32, label: 'Heading · Bricolage 700', text: 'Quarterfinals' },
              { f: FONTS.body, w: 500, s: 16, label: 'Body · Geist 500', text: 'Two days of doubles on the bay.' },
              { f: FONTS.body, w: 400, s: 14, label: 'Caption · Geist 400', text: 'Updated 13:42 PT' },
              { f: FONTS.mono, w: 500, s: 22, label: 'Mono · Geist Mono', text: '11 — 9 · 4.52 DUPR' },
              { f: FONTS.mono, w: 500, s: 11, label: 'Eyebrow · Mono 11/0.14em', text: 'SAT 09 MAY · LIVE NOW' },
            ].map(t => (
              <div key={t.label} style={{ borderTop: `1px solid ${TOKENS.hairline}`, paddingTop: 12 }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.14em', color: TOKENS.muted, marginBottom: 8 }}>{t.label.toUpperCase()}</div>
                <div style={{ fontFamily: t.f, fontWeight: t.w, fontSize: t.s, letterSpacing: t.s > 30 ? '-0.03em' : (t.s < 14 ? '0.14em' : '-0.005em'), lineHeight: 1.05, color: TOKENS.ink, textTransform: t.s < 14 ? 'uppercase' : 'none' }}>{t.text}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Color */}
        <Card>
          <Eyebrow style={{ marginBottom: 16 }}>COLOR</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            {[
              { l: 'Paper', v: TOKENS.paper, hex: '#F5F2EB' },
              { l: 'Surface', v: TOKENS.surface, hex: '#FFFFFF' },
              { l: 'Surface 2', v: TOKENS.surface2, hex: '#FBF9F4' },
              { l: 'Ink', v: TOKENS.ink, hex: '#0F0F0E' },
              { l: 'Muted', v: TOKENS.muted, hex: '#6B6863' },
              { l: 'Hairline', v: TOKENS.hairline, hex: '#E5E0D5' },
              { l: 'Court', v: TOKENS.court, hex: '#1F4A2E' },
              { l: 'Court tint', v: TOKENS.courtTint, hex: '#E6EDE6' },
              { l: 'Amber · LIVE', v: TOKENS.amber, hex: '#C2691A' },
            ].map(c => (
              <div key={c.l}>
                <div style={{ width: '100%', height: 70, background: c.v, border: `1px solid ${TOKENS.hairline}`, borderRadius: 4 }} />
                <div style={{ fontSize: 12, fontWeight: 500, marginTop: 8 }}>{c.l}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, marginTop: 2 }}>{c.hex}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Buttons */}
        <Card>
          <Eyebrow style={{ marginBottom: 16 }}>BUTTONS</Eyebrow>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '14px 0', borderBottom: `1px solid ${TOKENS.hairline}` }}>
            <Btn variant="primary">Primary</Btn>
            <Btn variant="court">Court green</Btn>
            <Btn variant="amber">Amber · live</Btn>
            <Btn variant="outline">Outline</Btn>
            <Btn variant="ghost">Ghost</Btn>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '14px 0', borderBottom: `1px solid ${TOKENS.hairline}` }}>
            <Btn variant="primary" size="sm">Small</Btn>
            <Btn variant="primary" size="md">Medium</Btn>
            <Btn variant="primary" size="lg">Large</Btn>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 14 }}>
            <Btn variant="primary" icon={<Icon name="arrow-right" size={13} color="#FFF" />}>With icon</Btn>
            <Btn variant="outline" icon={<Icon name="bracket" size={13} />}>View bracket</Btn>
            <Btn variant="ghost" icon={<Icon name="filter" size={13} />}>Filter</Btn>
          </div>
        </Card>

        {/* Pills */}
        <Card>
          <Eyebrow style={{ marginBottom: 16 }}>PILLS · BADGES</Eyebrow>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 0', borderBottom: `1px solid ${TOKENS.hairline}` }}>
            <Pill>Default</Pill>
            <Pill tone="court">Court</Pill>
            <Pill tone="amber"><Dot color={TOKENS.amber} size={5} pulse /> LIVE</Pill>
            <Pill tone="blue">Upcoming</Pill>
            <Pill tone="ink">Featured</Pill>
            <Pill tone="outline">Outline</Pill>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 14 }}>
            <Pill tone="court" mono>4.5</Pill>
            <Pill tone="outline" mono>SEED 1</Pill>
            <Pill tone="amber" mono>GAME 2</Pill>
            <Pill tone="outline" mono>CT 1</Pill>
          </div>
        </Card>

        {/* Inputs */}
        <Card>
          <Eyebrow style={{ marginBottom: 16 }}>INPUTS</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Email" value="maya.chen@example.com" />
            <Field label="Search" value="bay open" trailing="⌘K" />
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: '0.14em', color: TOKENS.muted, fontWeight: 500, marginBottom: 6, textTransform: 'uppercase' }}>SEGMENTED</div>
              <div style={{ display: 'flex', gap: 0, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6, overflow: 'hidden', width: 'fit-content', background: TOKENS.surface }}>
                {['Pool play', 'Bracket', 'Schedule', 'Standings'].map((t, i) => (
                  <span key={t} style={{ padding: '7px 14px', fontSize: 12.5, fontWeight: 500, background: i === 1 ? TOKENS.ink : 'transparent', color: i === 1 ? '#FFF' : TOKENS.ink2, borderRight: i < 3 ? `1px solid ${TOKENS.hairline}` : 'none' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Match card */}
        <Card>
          <Eyebrow style={{ marginBottom: 16 }}>MATCH CARD</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <MatchCard match={{ seed: [1, 8], a: { name: 'Hartwell / Vega', score: [11, 11], won: true }, b: { name: 'Okonkwo / Reyes', score: [4, 7], won: false }, court: 'Court 1', time: '12:00', state: 'final' }} w={300} />
            <MatchCard match={{ seed: [3, 6], a: { name: 'Devereaux / Ito', score: [9, 7], won: false }, b: { name: 'Walsh / Tanaka', score: [8, 6], won: false }, court: 'Court 1', time: '13:30', state: 'live', liveScore: { a: 8, b: 6, game: 2 } }} w={300} />
            <MatchCard match={{ seed: ['—', '—'], a: { name: 'TBD', score: null, won: false }, b: { name: 'TBD', score: null, won: false }, court: 'Center', time: '17:00', state: 'tbd' }} w={300} />
          </div>
        </Card>

      </div>
    </div>
  );
}

window.ComponentsScreen = ComponentsScreen;
