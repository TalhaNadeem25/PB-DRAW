// Tournament Detail — premium player-facing tournament page

function DetailScreen() {
  return (
    <div style={{ width: 1440, minHeight: 1100, background: TOKENS.paper, fontFamily: FONTS.body, color: TOKENS.ink }}>
      <TopNav active="browse" />

      {/* Editorial hero with image */}
      <div style={{ padding: '32px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: TOKENS.muted, marginBottom: 18 }}>
          <span>Tournaments</span>
          <Icon name="chevron-right" size={11} color={TOKENS.faint} />
          <span>San Francisco, CA</span>
          <Icon name="chevron-right" size={11} color={TOKENS.faint} />
          <span style={{ color: TOKENS.ink }}>The Bay Open</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'end' }}>
          <div>
            <Eyebrow style={{ marginBottom: 14 }}>SAT 9 — SUN 10 MAY 2026 · 96 PLAYERS · 4 EVENTS</Eyebrow>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 800,
              fontSize: 80, letterSpacing: '-0.04em', lineHeight: 0.95, color: TOKENS.ink,
            }}>The Bay Open</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22, alignItems: 'center' }}>
              <Pill tone="amber"><Dot color={TOKENS.amber} size={6} pulse /> Live now</Pill>
              <Pill tone="court">Stripe Connect host</Pill>
              <Pill>DUPR-rated</Pill>
              <span style={{ fontSize: 13, color: TOKENS.muted }}>· hosted by Bay PB Co.</span>
            </div>
          </div>
          <ImgSlot label="Venue photo · 16:9" h={240} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        margin: '36px 32px 0',
        borderBottom: `1px solid ${TOKENS.hairline}`,
        display: 'flex', gap: 28,
      }}>
        {['Overview', 'Events', 'Draw & Bracket', 'Schedule', 'Players', 'Venue', 'Rules'].map((t, i) => (
          <span key={t} style={{
            padding: '14px 0',
            fontFamily: FONTS.body, fontSize: 13, fontWeight: 500,
            color: i === 0 ? TOKENS.ink : TOKENS.muted,
            borderBottom: i === 0 ? `2px solid ${TOKENS.ink}` : '2px solid transparent',
            marginBottom: -1, cursor: 'pointer',
          }}>{t}</span>
        ))}
      </div>

      {/* Body grid */}
      <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 36 }}>
        {/* Left: events + about */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <Card padded={false}>
            <div style={{ padding: '20px 22px 16px', borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
              <div>
                <Eyebrow style={{ marginBottom: 6 }}>4 EVENTS · 2 OPEN, 2 IN PROGRESS</Eyebrow>
                <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em' }}>Choose your event</div>
              </div>
              <Btn variant="ghost" size="sm" icon={<Icon name="filter" size={13} />}>All formats</Btn>
            </div>
            <div>
              {[
                { name: 'Mixed Doubles', skill: '4.5', state: 'live', filled: '16/16', fee: 65, format: 'Pool → Single elim', spots: 0 },
                { name: 'Mens Doubles', skill: '4.0', state: 'live', filled: '24/24', fee: 65, format: 'Pool → Single elim', spots: 0 },
                { name: 'Womens Doubles', skill: '3.5–4.0', state: 'open', filled: '14/24', fee: 55, format: 'Round-robin', spots: 10 },
                { name: 'Mixed Doubles', skill: '3.0–3.5', state: 'open', filled: '20/32', fee: 55, format: 'Pool → Bracket', spots: 12 },
              ].map((e, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.8fr 1fr', alignItems: 'center', gap: 16,
                  padding: '18px 22px',
                  borderBottom: i < 3 ? `1px solid ${TOKENS.hairline}` : 'none',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>{e.name}</div>
                      <Pill tone="court" mono>{e.skill}</Pill>
                    </div>
                    <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 4 }}>{e.format}</div>
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: TOKENS.ink2 }}>{e.filled}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: TOKENS.ink2 }}>${e.fee}</div>
                  <div>
                    {e.state === 'live'
                      ? <Pill tone="amber" mono><Dot color={TOKENS.amber} size={5} pulse /> LIVE</Pill>
                      : <Pill tone="outline" mono>OPEN · {e.spots} LEFT</Pill>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {e.state === 'live'
                      ? <Btn variant="outline" size="sm" icon={<Icon name="bracket" size={13} />}>View draw</Btn>
                      : <Btn variant="primary" size="sm">Register</Btn>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Card>
              <Eyebrow style={{ marginBottom: 12 }}>VENUE</Eyebrow>
              <div style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Crissy Field Courts</div>
              <div style={{ fontSize: 12.5, color: TOKENS.muted, marginTop: 6 }}>1199 East Beach, San Francisco</div>
              <div style={{ marginTop: 14 }}><ImgSlot label="Map · venue" h={120} /></div>
              <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 12 }}>
                <span style={{ color: TOKENS.muted }}>6 outdoor courts</span>
                <span style={{ color: TOKENS.muted }}>· Spectator seating</span>
                <span style={{ color: TOKENS.muted }}>· Shop on-site</span>
              </div>
            </Card>
            <Card>
              <Eyebrow style={{ marginBottom: 12 }}>FORMAT</Eyebrow>
              <div style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Pool → Bracket</div>
              <div style={{ fontSize: 12.5, color: TOKENS.muted, marginTop: 6 }}>Top 2 from each pool advance to single-elim playoffs</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                {[
                  ['Pool play', 'Best of 1 · to 15, win by 2'],
                  ['Bracket', 'Best of 3 · to 11, win by 2'],
                  ['Final', 'Best of 3 · to 15, win by 2'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${TOKENS.hairline}`, paddingBottom: 8, fontSize: 12.5 }}>
                    <span style={{ color: TOKENS.muted }}>{k}</span>
                    <span style={{ fontFamily: FONTS.mono, color: TOKENS.ink }}>{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <Eyebrow style={{ marginBottom: 12 }}>ABOUT</Eyebrow>
            <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 14, color: TOKENS.ink, lineHeight: 1.2, maxWidth: 620 }}>
              Two days of sanctioned doubles on the bay. 96 players, 6 courts, six bands of skill from social to scrappy 5.0.
            </div>
            <div style={{ fontSize: 13.5, color: TOKENS.ink2, lineHeight: 1.6, maxWidth: 640 }}>
              Now in its fourth edition, Bay Open is the city's largest open-entry pickleball tournament. Saturday is pool play; Sunday brings the playoff bracket and finals on Center Court. Stick around for the after-party at Presidio Bowl.
            </div>
          </Card>
        </div>

        {/* Right: registration sidecar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
          <Card>
            <Eyebrow style={{ marginBottom: 12 }}>WHEN</Eyebrow>
            <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em' }}>Sat 9 — Sun 10 May</div>
            <div style={{ fontSize: 12.5, color: TOKENS.muted, marginTop: 4 }}>Check-in opens 07:30 PT</div>
            <div style={{ height: 1, background: TOKENS.hairline, margin: '18px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Eyebrow style={{ marginBottom: 6 }}>ENTRY</Eyebrow>
                <div style={{ fontFamily: FONTS.mono, fontSize: 22, fontWeight: 500, color: TOKENS.ink, fontFeatureSettings: '"tnum" 1' }}>$55 – $65</div>
              </div>
              <div>
                <Eyebrow style={{ marginBottom: 6 }}>PURSE</Eyebrow>
                <div style={{ fontFamily: FONTS.mono, fontSize: 22, fontWeight: 500, color: TOKENS.ink, fontFeatureSettings: '"tnum" 1' }}>$4,800</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
              <Btn variant="primary" size="lg" full icon={<Icon name="arrow-right" size={14} color="#fff" />}>Register · find a partner</Btn>
              <Btn variant="outline" size="md" full icon={<Icon name="bracket" size={14} />}>View live bracket</Btn>
              <Btn variant="ghost" size="md" full icon={<Icon name="share" size={14} />}>Share spectator link</Btn>
            </div>
          </Card>
          <Card>
            <Eyebrow style={{ marginBottom: 12 }}>NEXT 3 MATCHES</Eyebrow>
            {[
              { t: '13:30', c: 'CT 1', m: 'Devereaux/Ito v Walsh/Tanaka', live: true },
              { t: '13:30', c: 'CT 2', m: 'Beaumont/Sato v Romano/Patel' },
              { t: '14:00', c: 'CT 4', m: 'Hartwell/Vega v Cho/Marquez' },
            ].map((m, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 50px 1fr', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i < 2 ? `1px solid ${TOKENS.hairline}` : 'none' }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 500 }}>{m.t}</div>
                <Pill tone="outline" mono>{m.c}</Pill>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  {m.live && <Dot color={TOKENS.amber} size={5} pulse />}
                  {m.m}
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <Eyebrow style={{ marginBottom: 12 }}>HOST</Eyebrow>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Avatar name="Bay PB Co" tone="court" size={42} />
              <div>
                <div style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>Bay PB Co.</div>
                <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 2 }}>11 tournaments · 4.9 ★ from 312 players</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

window.DetailScreen = DetailScreen;
