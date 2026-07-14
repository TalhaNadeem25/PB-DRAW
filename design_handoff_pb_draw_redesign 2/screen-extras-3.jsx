// More screens: player profile, partner directory, checkout, settings, inbox, results

// =====================================================================
// PUBLIC PLAYER PROFILE
// =====================================================================
function PlayerProfileScreen() {
  return (
    <div style={{ width: 1440, minHeight: 1100, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="browse" />

      {/* Editorial hero */}
      <div style={{ padding: '48px 32px 36px', borderBottom: `1px solid ${TOKENS.hairline}`,
        display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 28, alignItems: 'center' }}>
        <Avatar name="Maya Chen" size={120} tone="paper" />
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>SAN FRANCISCO, CA · MEMBER SINCE 2023</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 64, letterSpacing: '-0.04em', lineHeight: 0.96 }}>
            Maya Chen
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 14, alignItems: 'center' }}>
            <Pill tone="court" mono>4.5 DUPR</Pill>
            <Pill tone="ink" mono>RANK #142</Pill>
            <span style={{ fontSize: 13, color: TOKENS.muted }}>Right-handed · Doubles preferred · Bay PB Co.</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="primary" size="md" icon={<Icon name="users" size={13} color="#FFF" />}>Ask to partner</Btn>
          <Btn variant="outline" size="md">Message</Btn>
          <Btn variant="ghost" size="md" icon={<Icon name="share" size={13} />} />
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: `1px solid ${TOKENS.hairline}` }}>
        {[
          { l: 'TOURNAMENTS', v: '47', d: 'Last 12 months' },
          { l: 'WIN RATE',    v: '68%', d: '142W · 67L' },
          { l: 'PODIUMS',     v: '11', d: '4 gold · 5 silver · 2 bronze' },
          { l: 'BEST FINISH', v: '🥇', d: 'Bay Open · 2025' },
          { l: 'RATING',      v: '4.52', d: '+0.08 ↗ last 30 days' },
        ].map((k, i) => (
          <div key={i} style={{ padding: '20px 24px', borderRight: i < 4 ? `1px solid ${TOKENS.hairline}` : 'none', background: TOKENS.surface }}>
            <KPI label={k.l} value={k.v} delta={k.d} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 32px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', gap: 28, background: TOKENS.surface2 }}>
        {['Overview', 'Match history', 'Partners', 'Tournaments', 'Achievements'].map((t, i) => (
          <span key={t} style={{ fontSize: 13, fontWeight: 500, color: i === 0 ? TOKENS.ink : TOKENS.muted,
            paddingBottom: 14, marginBottom: -14,
            borderBottom: i === 0 ? `2px solid ${TOKENS.ink}` : '2px solid transparent' }}>{t}</span>
        ))}
      </div>

      <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Form chart */}
          <Card>
            <SectionHead eyebrow="LAST 20 MATCHES" title="Form" dense
              action={<div style={{ display: 'flex', gap: 4 }}>{['1M','3M','6M','1Y'].map((p,i) => <span key={p} style={{ padding: '4px 10px', fontSize: 11.5, fontFamily: FONTS.mono, borderRadius: 4, background: i===2 ? TOKENS.ink : 'transparent', color: i===2 ? '#FFF' : TOKENS.muted, border: `1px solid ${i===2 ? TOKENS.ink : TOKENS.hairline}` }}>{p}</span>)}</div>} />
            {/* Bar chart of W/L */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, padding: '20px 0 14px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
              {['W','W','L','W','W','W','L','W','L','W','W','W','W','L','W','W','W','L','W','W'].map((r, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', height: r==='W' ? 90 + (i%5)*8 : 28 + (i%4)*6, background: r==='W' ? TOKENS.court : TOKENS.faint, borderRadius: '2px 2px 0 0' }} />
                  <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: r==='W' ? TOKENS.court : TOKENS.muted }}>{r}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted }}>
              <span>30 DAYS AGO</span><span>TODAY</span>
            </div>
          </Card>

          {/* Recent matches */}
          <Card padded={false}>
            <div style={{ padding: '16px 22px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SectionHead eyebrow="RECENT" title="Match history" dense />
              <Btn variant="ghost" size="sm">All matches →</Btn>
            </div>
            {[
              { d: 'Today',     o: 'Cho / Marquez',    s: '11–9, 11–7',  r: 'W', t: 'Bay Open · QF' },
              { d: 'May 5',     o: 'Park / Ali',        s: '8–11, 7–11',  r: 'L', t: 'Marin Mixers · SF' },
              { d: 'May 3',     o: 'Brennan / Singh',  s: '11–6, 11–9',  r: 'W', t: 'Marin Mixers · QF' },
              { d: 'Apr 27',    o: 'Walsh / Tanaka',    s: '11–8, 9–11, 11–7', r: 'W', t: 'Sonoma Series · SF' },
              { d: 'Apr 27',    o: 'Devereaux / Ito',  s: '6–11, 8–11',  r: 'L', t: 'Sonoma Series · F' },
              { d: 'Apr 12',    o: 'Larsen / Nakamura', s: '11–4, 11–6',  r: 'W', t: 'Pacific Heights · R16' },
            ].map((m, i, a) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto 80px 30px', alignItems: 'center',
                padding: '14px 22px', borderBottom: i < a.length-1 ? `1px solid ${TOKENS.hairline}` : 'none' }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.muted }}>{m.d}</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>vs {m.o}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.faint, letterSpacing: '0.08em', marginTop: 2 }}>{m.t}</div>
                </div>
                <span style={{ fontFamily: FONTS.mono, fontSize: 13, color: TOKENS.ink }}>{m.s}</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: m.r === 'W' ? TOKENS.court : TOKENS.muted }}>
                  {m.r === 'W' ? 'WIN' : 'LOSS'}
                </span>
                <Icon name="chevron-right" size={14} color={TOKENS.muted} />
              </div>
            ))}
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <Eyebrow style={{ marginBottom: 12 }}>FREQUENT PARTNERS</Eyebrow>
            {[
              { n: 'Eli Hartwell', d: '4.5', win: '14W 5L', tag: 'Doubles · 19 events' },
              { n: 'Rey Vega',     d: '4.4', win: '8W 4L',  tag: 'Mixed · 12 events' },
              { n: 'Sam Beaumont', d: '4.6', win: '5W 1L',  tag: 'Doubles · 6 events' },
            ].map((p, i, a) => (
              <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < a.length-1 ? `1px solid ${TOKENS.hairline}` : 'none' }}>
                <Avatar name={p.n} size={36} tone="paper" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.n} <span style={{ color: TOKENS.muted, fontFamily: FONTS.mono, fontSize: 11, marginLeft: 4 }}>{p.d}</span></div>
                  <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 2 }}>{p.tag}</div>
                </div>
                <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.court, fontWeight: 600 }}>{p.win}</span>
              </div>
            ))}
          </Card>

          <Card style={{ background: TOKENS.ink, color: '#F5F2EB', borderColor: TOKENS.ink }}>
            <Eyebrow color="#9C9890" style={{ marginBottom: 10 }}>STREAK</Eyebrow>
            <div style={{ fontFamily: FONTS.display, fontSize: 56, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: TOKENS.amber }}>W4</div>
            <div style={{ fontSize: 13, color: '#C4C0B8', marginTop: 8 }}>Four straight wins. Last loss to Park / Ali in Marin Mixers semi.</div>
          </Card>

          <Card>
            <Eyebrow style={{ marginBottom: 12 }}>ACHIEVEMENTS · 11</Eyebrow>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                {l:'GOLD', s:'Bay Open 25'}, {l:'GOLD', s:'Sonoma 24'}, {l:'GOLD', s:'Marin 24'}, {l:'GOLD', s:'PHP 23'},
                {l:'SILVER', s:'Bay Open 24'}, {l:'SILVER', s:'Sonoma 23'}, {l:'SILVER', s:'Marin 25'}, {l:'SILVER', s:'PHP 24'},
                {l:'SILVER', s:'NorCal 23'}, {l:'BRONZE', s:'Marin 23'}, {l:'BRONZE', s:'PHP 22'}, {l:'+0', s:''},
              ].map((b, i) => (
                <div key={i} style={{ aspectRatio: '1', background: b.l === 'GOLD' ? '#F5E6C9' : (b.l === 'SILVER' ? '#EDEDED' : (b.l === 'BRONZE' ? '#EBD9C3' : TOKENS.surface)),
                  border: `1px solid ${TOKENS.hairline}`, borderRadius: 4, padding: 6, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: '0.1em', color: TOKENS.ink, fontWeight: 600 }}>{b.l}</span>
                  <span style={{ fontSize: 9, color: TOKENS.muted, fontFamily: FONTS.mono }}>{b.s}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

window.PlayerProfileScreen = PlayerProfileScreen;

// =====================================================================
// PARTNER DIRECTORY
// =====================================================================
function PartnerScreen() {
  const players = [
    { n: 'Eli Hartwell', d: '4.5', loc: 'San Francisco · 2 mi', tag: 'Looking for Bay Open mixed', avail: 'Sat 09 May', match: 96 },
    { n: 'Jin Park',     d: '4.5', loc: 'Oakland · 8 mi',       tag: 'Open to weekend doubles',   avail: 'May 15–17',  match: 92 },
    { n: 'Ana Solberg',  d: '4.4', loc: 'San Francisco · 4 mi', tag: 'Mixed 4.0–4.5',              avail: 'Most weekdays',  match: 88 },
    { n: 'Theo Walsh',   d: '4.6', loc: 'Mill Valley · 14 mi',  tag: 'Tournament-ready, doubles',  avail: 'Sat–Sun',  match: 86 },
    { n: 'Sam Beaumont', d: '4.6', loc: 'Berkeley · 11 mi',     tag: 'Aggressive baseliner',       avail: 'Mornings',  match: 84 },
    { n: 'Lina Cho',     d: '4.5', loc: 'San Francisco · 1 mi', tag: 'Mixed only',                 avail: 'Eve · Wknds',  match: 82 },
  ];
  return (
    <div style={{ width: 1440, minHeight: 1000, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="partner" />
      <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>NEAR YOU · 184 PLAYERS · 4.0–4.7</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 56, letterSpacing: '-0.04em', lineHeight: 0.96 }}>
            Find a partner.
          </div>
          <div style={{ fontSize: 14, color: TOKENS.ink2, marginTop: 12, maxWidth: 560 }}>
            Matched on rating, geography, availability, and recent form. Send an ask, share a tournament, and lock it in.
          </div>
        </div>
        <Btn variant="primary" size="md" icon={<Icon name="plus" size={14} color="#FFF" />}>Post a partner ask</Btn>
      </div>

      {/* Filter rail */}
      <div style={{ padding: '16px 32px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', gap: 14, alignItems: 'center', background: TOKENS.surface2 }}>
        <Field label="" value="bay area · 4.4–4.7 · weekends" trailing="⌘K" />
        <div style={{ display: 'flex', gap: 6, marginLeft: 4 }}>
          {['Sort: best match', 'Doubles', 'Mixed', '4.4–4.7', '< 15 mi', 'Available this week'].map((f, i) => (
            <span key={f} style={{ padding: '7px 12px', borderRadius: 999, background: i === 0 ? TOKENS.ink : TOKENS.surface, color: i === 0 ? '#FFF' : TOKENS.ink2, border: `1px solid ${i === 0 ? TOKENS.ink : TOKENS.hairline}`, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>{f}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {players.map((p, i) => (
          <Card key={p.n} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
              <Avatar name={p.n} size={52} tone="paper" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>{p.n}</span>
                  <Pill tone="court" mono>{p.d}</Pill>
                </div>
                <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 4 }}>{p.loc}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 22, fontWeight: 500, color: TOKENS.court, lineHeight: 1 }}>{p.match}<span style={{ fontSize: 12, color: TOKENS.muted }}>%</span></div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: '0.12em', color: TOKENS.muted, marginTop: 2 }}>MATCH</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: TOKENS.ink2, lineHeight: 1.45, marginBottom: 14, padding: 12, background: TOKENS.surface2, borderRadius: 4 }}>
              "{p.tag}"
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: TOKENS.muted, marginBottom: 14 }}>
              <span><span style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.12em', color: TOKENS.faint }}>AVAILABLE </span>{p.avail}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.court }}>{i % 3 === 0 ? '● ONLINE' : ''}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="primary" size="sm" full>Ask to partner</Btn>
              <Btn variant="outline" size="sm">View</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

window.PartnerScreen = PartnerScreen;

// =====================================================================
// CHECKOUT — registration
// =====================================================================
function CheckoutScreen() {
  return (
    <div style={{ width: 1440, minHeight: 980, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="browse" />
      <div style={{ padding: '24px 32px 18px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
        <Eyebrow style={{ marginBottom: 8 }}>STEP 3 OF 3 · CHECKOUT</Eyebrow>
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 40, letterSpacing: '-0.035em', lineHeight: 1 }}>Confirm & pay</div>
      </div>

      <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Player + partner */}
          <Card>
            <SectionHead eyebrow="ROSTER" title="Hartwell / Vega · Mixed Doubles 4.5" dense />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
              {[
                { n: 'Eli Hartwell', d: '4.5', e: 'eli@hartwell.io', tag: 'You' },
                { n: 'Rey Vega',      d: '4.4', e: 'rey.vega@example.com', tag: 'Confirmed' },
              ].map(p => (
                <div key={p.n} style={{ padding: 14, background: TOKENS.surface2, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={p.n} size={42} tone="paper" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{p.n}</span>
                      <Pill tone="court" mono>{p.d}</Pill>
                    </div>
                    <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 2 }}>{p.e}</div>
                  </div>
                  <Pill tone="outline" mono>{p.tag}</Pill>
                </div>
              ))}
            </div>
          </Card>

          {/* Payment */}
          <Card>
            <SectionHead eyebrow="PAYMENT" title="How would you like to pay?" dense />
            <div style={{ display: 'flex', gap: 8, margin: '14px 0 18px' }}>
              {[
                { l: 'Apple Pay', selected: true },
                { l: 'Card' },
                { l: 'Stripe Link' },
                { l: 'Split (2 ways)' },
              ].map(p => (
                <span key={p.l} style={{ flex: 1, padding: '14px', textAlign: 'center', borderRadius: 6,
                  background: p.selected ? TOKENS.surface : TOKENS.surface2,
                  border: `1px solid ${p.selected ? TOKENS.ink : TOKENS.hairline}`,
                  fontSize: 13, fontWeight: 500, position: 'relative' }}>
                  {p.l}
                  {p.selected && <span style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: '50%', background: TOKENS.ink, display: 'inline-grid', placeItems: 'center' }}><Icon name="check" size={9} color="#fff" strokeWidth={2.6}/></span>}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Cardholder" value="Eli Hartwell" />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                <Field label="Card number" value="•••• •••• •••• 4429" trailing="VISA" />
                <Field label="Expiry" value="08 / 27" />
                <Field label="CVC" value="•••" />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: TOKENS.muted, marginTop: 14 }}>
              <span style={{ width: 14, height: 14, border: `1px solid ${TOKENS.rule}`, borderRadius: 3, background: TOKENS.surface, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={9} color={TOKENS.ink} strokeWidth={2.4} />
              </span>
              Save card for future tournaments
            </label>
          </Card>

          {/* Waivers */}
          <Card>
            <SectionHead eyebrow="WAIVERS" title="Acknowledge & sign" dense />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {[
                ['Liability waiver',          'Bay PB Co. standard release · v3.2'],
                ['Code of conduct',           'PB Draw player conduct policy'],
                ['Photo & broadcast release', 'Optional · uncheck to opt out'],
              ].map(([k, v], i) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: `1px solid ${TOKENS.hairline}`, borderRadius: 6 }}>
                  <span style={{ width: 16, height: 16, border: `1px solid ${TOKENS.rule}`, borderRadius: 3, background: i < 2 ? TOKENS.ink : TOKENS.surface, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i < 2 && <Icon name="check" size={10} color="#fff" strokeWidth={2.6}/>}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{k}</div>
                    <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 2 }}>{v}</div>
                  </div>
                  <Btn variant="ghost" size="sm">Read</Btn>
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* Order summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 24 }}>
          <Card>
            <Eyebrow style={{ marginBottom: 10 }}>ORDER · BAY OPEN</Eyebrow>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, letterSpacing: '-0.025em', lineHeight: 1.1 }}>The Bay Open</div>
            <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 4 }}>Sat 09 — Sun 10 May · Crissy Field</div>

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${TOKENS.hairline}` }}>
              {[
                ['Mixed Doubles 4.5 · 2 players',    '$130.00'],
                ['Bay PB Co. member discount',       '–$10.00'],
                ['Refundable insurance (optional)',  '$8.00'],
                ['Service fee',                      '$3.50'],
              ].map(([k, v], i) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, color: i === 1 ? TOKENS.court : TOKENS.ink2 }}>
                  <span>{k}</span>
                  <span style={{ fontFamily: FONTS.mono }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 4px', borderTop: `1px solid ${TOKENS.hairline}`, marginTop: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Total</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}>$131.50</span>
              </div>
            </div>
          </Card>

          <Btn variant="primary" size="lg" full icon={<Icon name="check" size={14} color="#FFF" strokeWidth={2.4}/>}>Confirm & pay $131.50</Btn>
          <div style={{ fontSize: 11.5, color: TOKENS.muted, textAlign: 'center', lineHeight: 1.5, marginTop: 4 }}>Free cancellation through May 4 · Stripe-secured · Bay PB Co. is the merchant of record.</div>
        </div>
      </div>
    </div>
  );
}

window.CheckoutScreen = CheckoutScreen;

// =====================================================================
// SETTINGS
// =====================================================================
function SettingsScreen() {
  return (
    <div style={{ width: 1440, minHeight: 1000, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="me" />
      <div style={{ padding: '32px 32px 16px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
        <Eyebrow style={{ marginBottom: 8 }}>ACCOUNT · MAYA CHEN</Eyebrow>
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 40, letterSpacing: '-0.035em' }}>Settings</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 800 }}>
        {/* Sidebar */}
        <div style={{ borderRight: `1px solid ${TOKENS.hairline}`, padding: 24 }}>
          {[
            { l: 'Profile', a: true },
            { l: 'Play preferences' },
            { l: 'Skill rating' },
            { l: 'Notifications' },
            { l: 'Payments & receipts' },
            { l: 'Privacy' },
            { l: 'Connected accounts' },
            { l: 'Plan & membership' },
          ].map(s => (
            <div key={s.l} style={{ padding: '10px 12px', fontSize: 13.5, fontWeight: s.a ? 600 : 500, color: s.a ? TOKENS.ink : TOKENS.muted,
              borderRadius: 6, background: s.a ? TOKENS.surface : 'transparent',
              border: `1px solid ${s.a ? TOKENS.hairline : 'transparent'}`, marginBottom: 2 }}>{s.l}</div>
          ))}
          <div style={{ marginTop: 16, padding: '10px 12px', fontSize: 13, color: '#9F2A2A', fontWeight: 500 }}>Delete account</div>
        </div>

        {/* Content */}
        <div style={{ padding: 40, maxWidth: 760 }}>
          <Eyebrow style={{ marginBottom: 12 }}>PROFILE</Eyebrow>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 28, letterSpacing: '-0.03em' }}>Public profile</div>
          <div style={{ fontSize: 13.5, color: TOKENS.muted, marginTop: 8, marginBottom: 28, maxWidth: 540 }}>How others see you in tournaments, partner search, and brackets.</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: 20, background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6, marginBottom: 18 }}>
            <Avatar name="Maya Chen" size={68} tone="paper" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Profile photo</div>
              <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 4 }}>JPG or PNG · square · at least 320×320</div>
            </div>
            <Btn variant="outline" size="sm">Replace</Btn>
            <Btn variant="ghost" size="sm">Remove</Btn>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Field label="First name" value="Maya" />
            <Field label="Last name" value="Chen" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <Field label="Display name" value="Maya Chen" trailing="Public" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Field label="City" value="San Francisco, CA" />
            <Field label="Home club" value="Bay PB Co." trailing="Verified" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <Field label="Bio" value="Mixed doubles · weekends · always rallying." />
          </div>

          <Eyebrow style={{ marginBottom: 14, marginTop: 28 }}>VISIBILITY</Eyebrow>
          <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6 }}>
            {[
              { l: 'Show my DUPR rating publicly', d: 'On profile, partner search, and bracket pages', on: true },
              { l: 'Show match history',           d: 'Recent results visible to anyone',          on: true },
              { l: 'Allow partner asks',           d: 'Players can request you as a partner',       on: true },
              { l: 'Searchable by email',          d: 'Friends can find you by email address',      on: false },
            ].map((t, i, a) => (
              <div key={t.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: i < a.length - 1 ? `1px solid ${TOKENS.hairline}` : 'none' }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t.l}</div>
                  <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 3 }}>{t.d}</div>
                </div>
                <span style={{ width: 36, height: 20, borderRadius: 99, background: t.on ? TOKENS.court : TOKENS.faint, position: 'relative', display: 'inline-block' }}>
                  <span style={{ position: 'absolute', top: 2, left: t.on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#FFF', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 28, paddingTop: 24, borderTop: `1px solid ${TOKENS.hairline}` }}>
            <Btn variant="primary" size="md">Save changes</Btn>
            <Btn variant="ghost" size="md">Discard</Btn>
            <span style={{ marginLeft: 'auto', fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, alignSelf: 'center' }}>AUTO-SAVED 2 MIN AGO</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.SettingsScreen = SettingsScreen;

// =====================================================================
// INBOX — messages & invites
// =====================================================================
function InboxScreen() {
  const threads = [
    { name: 'Eli Hartwell',  preview: "I'm in for Bay Open. Court 4 at 14:00 — meet at the gear tent?", time: '12 min', unread: true,  pinned: true },
    { name: 'Bay PB Co. (Lena, organizer)', preview: 'Heads up — your QF moved to Court 4. Same time.', time: '1 hr', unread: true,  org: true },
    { name: 'Jin Park',       preview: 'Asked you to partner for Sonoma Series. Mixed 4.5.', time: '3 hr', unread: true,  invite: true },
    { name: 'Rey Vega',       preview: 'Yeah let\u2019s do Marin Mixers. I\u2019ll register us.', time: 'Yest', unread: false },
    { name: 'Theo Walsh',     preview: 'Saw your match yesterday — clean cross-court.', time: 'Yest', unread: false },
    { name: 'PB Draw',        preview: 'Receipt for Bay Open · $131.50 · Card •••• 4429.', time: 'May 4', unread: false, system: true },
    { name: 'Ana Solberg',    preview: 'Maybe Pacific Heights Pro? You free June 5?', time: 'May 3', unread: false },
  ];
  const active = 0;
  return (
    <div style={{ width: 1440, height: 900, background: TOKENS.paper, fontFamily: FONTS.body, display: 'grid', gridTemplateRows: 'auto 1fr' }}>
      <TopNav active="me" />
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr 320px', overflow: 'hidden' }}>
        {/* Thread list */}
        <div style={{ borderRight: `1px solid ${TOKENS.hairline}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 22px 14px' }}>
            <Eyebrow style={{ marginBottom: 8 }}>3 UNREAD</Eyebrow>
            <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em' }}>Messages</div>
          </div>
          <div style={{ padding: '0 22px 12px' }}>
            <Field label="" value="Search messages" trailing="⌘K" />
          </div>
          <div style={{ padding: '4px 14px 8px', display: 'flex', gap: 6 }}>
            {['All', 'Players', 'Organizers', 'Invites', 'System'].map((t, i) => (
              <span key={t} style={{ padding: '5px 10px', borderRadius: 999, background: i === 0 ? TOKENS.ink : 'transparent', color: i === 0 ? '#FFF' : TOKENS.muted, fontSize: 11.5, fontWeight: 500 }}>{t}</span>
            ))}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {threads.map((t, i) => (
              <div key={i} style={{ padding: '14px 22px', display: 'flex', gap: 12, borderBottom: `1px solid ${TOKENS.hairline}`, background: i === active ? TOKENS.surface : 'transparent', borderLeft: i === active ? `3px solid ${TOKENS.ink}` : '3px solid transparent' }}>
                <Avatar name={t.name} size={40} tone="paper" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: t.unread ? 600 : 500, color: TOKENS.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: t.unread ? TOKENS.amber : TOKENS.faint, marginLeft: 6, flexShrink: 0 }}>{t.time}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    {t.invite && <Pill tone="court" mono>INVITE</Pill>}
                    {t.org && <Pill tone="amber" mono>ORG</Pill>}
                    {t.system && <Pill tone="outline" mono>SYS</Pill>}
                    <span style={{ fontSize: 12, color: t.unread ? TOKENS.ink2 : TOKENS.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.preview}</span>
                  </div>
                </div>
                {t.unread && <Dot color={TOKENS.amber} size={8} />}
              </div>
            ))}
          </div>
        </div>

        {/* Conversation */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '18px 28px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name="Eli Hartwell" size={40} tone="paper" />
              <div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>Eli Hartwell</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.court, letterSpacing: '0.06em' }}>● ONLINE · DUPR 4.5</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn variant="outline" size="sm">View profile</Btn>
              <Btn variant="ghost" size="sm" icon={<Icon name="settings" size={14}/>} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ textAlign: 'center', fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: '0.14em', color: TOKENS.faint }}>SAT 09 MAY · 13:14</div>
            <Bubble who="them" text="You ready for QF? Court 4 at 14:00 — Cho/Marquez took Pool B 3–0." />
            <Bubble who="me"   text="Yeah, locked in. Saw their pool — Cho's Erne is sharp but they hesitate at the kitchen on resets." />
            <Bubble who="me"   text="Plan: I'll stack right when they serve, you take middle." />
            <Bubble who="them" text="Cool. I'll bring extra Selkirks. Meet at the gear tent at 13:45?" />
            <Bubble who="them" text="Also — Lena said the court moved to 4. Original was 1." />
            {/* Match attachment */}
            <div style={{ background: TOKENS.surface2, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8, padding: 14, alignSelf: 'flex-start', maxWidth: 360 }}>
              <Eyebrow style={{ marginBottom: 8 }}>SHARED · BAY OPEN QF</Eyebrow>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Hartwell / Vega vs Cho / Marquez</div>
              <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 4 }}>Today 14:00 · Court 4 · Quarterfinal</div>
              <Btn variant="outline" size="sm" style={{ marginTop: 10 }}>View match →</Btn>
            </div>
            <div style={{ textAlign: 'center', fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: '0.14em', color: TOKENS.amber }}>● TYPING…</div>
          </div>

          <div style={{ padding: '14px 28px 22px', borderTop: `1px solid ${TOKENS.hairline}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8 }}>
              <Icon name="plus" size={16} color={TOKENS.muted} />
              <span style={{ flex: 1, fontSize: 13, color: TOKENS.muted }}>Sounds good — see you at 13:45.</span>
              <Btn variant="court" size="sm" icon={<Icon name="arrow-right" size={12} color="#FFF" />}>Send</Btn>
            </div>
          </div>
        </div>

        {/* Right rail — match context */}
        <div style={{ borderLeft: `1px solid ${TOKENS.hairline}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          <Card style={{ padding: 14, background: TOKENS.ink, color: '#F5F2EB', borderColor: TOKENS.ink }}>
            <Eyebrow color="#9C9890" style={{ marginBottom: 8 }}>NEXT MATCH · IN 18 MIN</Eyebrow>
            <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>QF · Cho/Marquez</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 28, color: TOKENS.amber, letterSpacing: '-0.02em', marginTop: 8 }}>14:00</div>
            <div style={{ fontSize: 11.5, color: '#C4C0B8', marginTop: 6 }}>Court 4 · Bay Open</div>
          </Card>
          <Card style={{ padding: 14 }}>
            <Eyebrow style={{ marginBottom: 8 }}>SHARED · 4 ITEMS</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { i: 'bracket', l: 'Bay Open bracket' },
                { i: 'qr', l: 'Match ticket' },
                { i: 'trophy', l: 'Sonoma Series' },
                { i: 'play', l: 'Court 1 highlight' },
              ].map(s => (
                <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, border: `1px solid ${TOKENS.hairline}` }}>
                  <Icon name={s.i} size={14} color={TOKENS.ink2} />
                  <span style={{ fontSize: 12.5, color: TOKENS.ink2 }}>{s.l}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ padding: 14 }}>
            <Eyebrow style={{ marginBottom: 8 }}>RECORD · TOGETHER</Eyebrow>
            <div style={{ fontFamily: FONTS.mono, fontSize: 28, fontWeight: 500, color: TOKENS.court, letterSpacing: '-0.02em' }}>14W · 5L</div>
            <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 4 }}>Doubles · 19 events · 74% wins</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Bubble({ who, text }) {
  const me = who === 'me';
  return (
    <div style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '70%', padding: '10px 14px',
        background: me ? TOKENS.ink : TOKENS.surface,
        color: me ? '#F5F2EB' : TOKENS.ink,
        border: me ? 'none' : `1px solid ${TOKENS.hairline}`,
        borderRadius: 14,
        borderBottomRightRadius: me ? 4 : 14,
        borderBottomLeftRadius: me ? 14 : 4,
        fontSize: 13.5, lineHeight: 1.5,
      }}>{text}</div>
    </div>
  );
}

window.InboxScreen = InboxScreen;

// =====================================================================
// FINAL RESULTS
// =====================================================================
function ResultsScreen() {
  return (
    <div style={{ width: 1440, minHeight: 1100, background: TOKENS.paper, fontFamily: FONTS.body }}>
      <TopNav active="browse" />
      {/* Editorial closer hero */}
      <div style={{ background: TOKENS.ink, color: '#F5F2EB', padding: '56px 32px 48px', position: 'relative', overflow: 'hidden' }}>
        <Eyebrow color={TOKENS.amber} style={{ marginBottom: 14 }}>SUN 10 MAY · CHAMPIONSHIP DAY · FINAL RESULTS</Eyebrow>
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 96, letterSpacing: '-0.045em', lineHeight: 0.95, color: '#F5F2EB' }}>
          The Bay Open<br/>
          <span style={{ fontStyle: 'italic', color: TOKENS.amber }}>is in the books.</span>
        </div>
        <div style={{ display: 'flex', gap: 36, marginTop: 36 }}>
          {[
            { l: 'TEAMS', v: '64' },
            { l: 'MATCHES', v: '127' },
            { l: 'COURTS', v: '6' },
            { l: 'PRIZE PURSE', v: '$8.4k' },
            { l: 'WINNING MARGIN', v: '11–9, 11–8' },
          ].map(k => (
            <div key={k.l}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', color: '#F5F2EB' }}>{k.v}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.16em', color: '#9C9890', marginTop: 4 }}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Podium */}
      <div style={{ padding: '48px 32px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
        <Eyebrow style={{ marginBottom: 16 }}>MIXED DOUBLES 4.5 · PODIUM</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, alignItems: 'end' }}>
          <PodiumCard rank={1} medal="GOLD" team="Hartwell / Vega" score="11–9, 11–8" prize="$2,400" big />
          <PodiumCard rank={2} medal="SILVER" team="Cho / Marquez" score="9–11, 8–11" prize="$1,200" />
          <PodiumCard rank={3} medal="BRONZE" team="Devereaux / Ito" score="11–6 (consolation)" prize="$600" />
        </div>
      </div>

      {/* Final standings table + awards */}
      <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
        <Card padded={false}>
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${TOKENS.hairline}` }}>
            <SectionHead eyebrow="MIXED DOUBLES 4.5" title="Final standings · 16 teams" dense
              action={<Btn variant="outline" size="sm" icon={<Icon name="share" size={13}/>}>Share results</Btn>} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 110px 80px 70px', padding: '8px 22px', borderBottom: `1px solid ${TOKENS.hairline}`, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.1em', color: TOKENS.faint, fontWeight: 500 }}>
            <div>#</div><div>TEAM</div><div style={{ textAlign: 'right' }}>SEED</div><div style={{ textAlign: 'right' }}>RECORD</div><div style={{ textAlign: 'right' }}>±</div><div></div>
          </div>
          {[
            ['1', 'Hartwell / Vega',     '1', '5–0', '+27', 'gold'],
            ['2', 'Cho / Marquez',       '4', '4–1', '+18'],
            ['3', 'Devereaux / Ito',     '3', '4–1', '+14', 'bronze'],
            ['4', 'Walsh / Tanaka',      '6', '3–2', '+9'],
            ['5', 'Park / Ali',          '5', '3–2', '+6'],
            ['6', 'Beaumont / Sato',     '7', '2–2', '+2'],
            ['7', 'Romano / Patel',      '8', '2–2', '0'],
            ['8', 'Kapoor / Solberg',    '2', '2–2', '–4'],
            ['9', 'Brennan / Singh',    '11', '1–3', '–7'],
            ['10', 'Larsen / Nakamura', '10', '1–3', '–9'],
            ['11', 'Acosta / Brown',    '12', '1–3', '–11'],
            ['12', 'Becker / Gomez',    '13', '0–3', '–14'],
          ].map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 110px 80px 70px', alignItems: 'center', padding: '12px 22px', borderBottom: i < 11 ? `1px solid ${TOKENS.hairline}` : 'none',
              background: r[5] === 'gold' ? '#FAF4E5' : (r[5] === 'bronze' ? '#FAF1E5' : TOKENS.surface) }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: r[5] ? 600 : 500, color: r[5] ? TOKENS.ink : TOKENS.muted }}>{r[0]}</span>
              <span style={{ fontSize: 13.5, fontWeight: r[5] ? 600 : 500 }}>{r[1]}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.muted, textAlign: 'right' }}>#{r[2]}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 12.5, textAlign: 'right' }}>{r[3]}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 12.5, textAlign: 'right', color: r[4].startsWith('+') ? TOKENS.court : TOKENS.muted }}>{r[4]}</span>
              <span style={{ textAlign: 'right' }}>{r[5] && <Pill tone={r[5]==='gold' ? 'amber' : 'outline'} mono>{r[5].toUpperCase()}</Pill>}</span>
            </div>
          ))}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <Eyebrow style={{ marginBottom: 12 }}>MATCH OF THE TOURNAMENT</Eyebrow>
            <div style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>SF · Hartwell/Vega over Walsh/Tanaka</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: 500, color: TOKENS.court, marginTop: 8 }}>11–8, 9–11, 11–9</div>
            <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 8, lineHeight: 1.5 }}>3-game thriller, fourth-game-point reversal, 47-shot rally in the third.</div>
            <Btn variant="outline" size="sm" style={{ marginTop: 12 }}>Watch replay →</Btn>
          </Card>

          <Card>
            <Eyebrow style={{ marginBottom: 12 }}>AWARDS</Eyebrow>
            {[
              { l: 'MVP',                v: 'Maya Chen (Hartwell/Vega)' },
              { l: 'Best 4th seed',      v: 'Cho / Marquez (made final)' },
              { l: 'Sportsmanship',     v: 'Iverson / Reed' },
              { l: 'Comeback of the day', v: 'Walsh / Tanaka (down 8 in 3)' },
            ].map((a, i, arr) => (
              <div key={a.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${TOKENS.hairline}` : 'none' }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.1em', color: TOKENS.muted }}>{a.l.toUpperCase()}</span>
                <span style={{ fontSize: 13, color: TOKENS.ink, fontWeight: 500 }}>{a.v}</span>
              </div>
            ))}
          </Card>

          <Card style={{ background: TOKENS.courtTint, borderColor: '#CCDAC9' }}>
            <Eyebrow color={TOKENS.courtInk} style={{ marginBottom: 8 }}>NEXT UP</Eyebrow>
            <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: TOKENS.courtInk }}>Sonoma Series · May 15</div>
            <div style={{ fontSize: 12, color: TOKENS.courtInk, opacity: 0.8, marginTop: 4 }}>11 of your opponents are already in.</div>
            <Btn variant="court" size="sm" style={{ marginTop: 10 }}>Register team →</Btn>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PodiumCard({ rank, medal, team, score, prize, big }) {
  const colors = { GOLD: '#C28B1A', SILVER: '#8C8C8C', BRONZE: '#9F6B3F' };
  return (
    <div style={{
      background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`,
      borderRadius: 8, padding: big ? 28 : 20, position: 'relative',
      borderTop: `4px solid ${colors[medal]}`,
      transform: big ? 'translateY(-12px)' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.16em', color: colors[medal], fontWeight: 600 }}>{medal}</span>
        <span style={{ fontFamily: FONTS.display, fontSize: big ? 56 : 40, fontWeight: 800, color: colors[medal], letterSpacing: '-0.04em', lineHeight: 1 }}>{rank}</span>
      </div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: big ? 26 : 20, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 10 }}>{team}</div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: TOKENS.ink2, marginBottom: 16 }}>{score}</div>
      <div style={{ paddingTop: 14, borderTop: `1px solid ${TOKENS.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.12em', color: TOKENS.muted }}>PURSE</span>
        <span style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: 500, color: TOKENS.ink }}>{prize}</span>
      </div>
    </div>
  );
}

window.ResultsScreen = ResultsScreen;
