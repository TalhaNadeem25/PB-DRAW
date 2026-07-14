// THE MARQUEE — Bracket / Draw view, single-elimination, 16 teams.
// Visual goal: broadcast-grade, editorial typography, real time-stamped matches.

const SEEDS_16 = [
  // round of 16 (8 matches)
  [
    { seed: [1, 16],  a: { name: 'Hartwell / Vega',     rating: '4.5', score: [11, 11], won: true },  b: { name: 'Park / Ali',           rating: '4.0', score: [6, 8],   won: false }, court: 'Court 3', time: '09:00', state: 'final' },
    { seed: [8, 9],   a: { name: 'Okonkwo / Reyes',     rating: '4.0', score: [11, 9, 11], won: true }, b: { name: 'Brennan / Singh',     rating: '4.0', score: [9, 11, 7], won: false }, court: 'Court 2', time: '09:00', state: 'final' },
    { seed: [5, 12],  a: { name: 'Kapoor / Solberg',    rating: '4.5', score: [11, 11], won: true },  b: { name: 'Iverson / Reed',       rating: '4.0', score: [4, 7],   won: false }, court: 'Court 4', time: '09:30', state: 'final' },
    { seed: [4, 13],  a: { name: 'Cho / Marquez',       rating: '4.5', score: [11, 11], won: true },  b: { name: 'Larsen / Nakamura',    rating: '4.0', score: [9, 8],   won: false }, court: 'Court 1', time: '09:30', state: 'final' },
    { seed: [3, 14],  a: { name: 'Devereaux / Ito',     rating: '4.5', score: [11, 7, 11], won: true }, b: { name: 'Acosta / Brown',     rating: '4.0', score: [8, 11, 6], won: false }, court: 'Court 3', time: '10:00', state: 'final' },
    { seed: [6, 11],  a: { name: 'Walsh / Tanaka',      rating: '4.5', score: [11, 11], won: true },  b: { name: 'Khoury / Pierce',      rating: '4.0', score: [3, 9],   won: false }, court: 'Court 2', time: '10:00', state: 'final' },
    { seed: [7, 10],  a: { name: 'Beaumont / Sato',     rating: '4.5', score: [11, 11], won: true },  b: { name: 'Quinn / Halsey',       rating: '4.0', score: [8, 7],   won: false }, court: 'Court 4', time: '10:30', state: 'final' },
    { seed: [2, 15],  a: { name: 'Romano / Patel',      rating: '4.5', score: [11, 11], won: true },  b: { name: 'Becker / Gomez',       rating: '4.0', score: [5, 6],   won: false }, court: 'Court 1', time: '10:30', state: 'final' },
  ],
  // quarterfinals (4 matches)
  [
    { seed: [1, 8],   a: { name: 'Hartwell / Vega',     rating: '4.5', score: [11, 11], won: true },  b: { name: 'Okonkwo / Reyes',      rating: '4.0', score: [4, 7],   won: false }, court: 'Court 1', time: '12:00', state: 'final' },
    { seed: [5, 4],   a: { name: 'Kapoor / Solberg',    rating: '4.5', score: [9, 11, 8], won: false }, b: { name: 'Cho / Marquez',      rating: '4.5', score: [11, 9, 11], won: true },  court: 'Court 2', time: '12:00', state: 'final' },
    { seed: [3, 6],   a: { name: 'Devereaux / Ito',     rating: '4.5', score: [9, 7],  won: false }, b: { name: 'Walsh / Tanaka',       rating: '4.5', score: [8, 6],   won: false }, court: 'Court 1', time: '13:30', state: 'live', liveScore: { a: 8, b: 6, game: 2 } },
    { seed: [7, 2],   a: { name: 'Beaumont / Sato',     rating: '4.5', score: null, won: false }, b: { name: 'Romano / Patel',       rating: '4.5', score: null, won: false }, court: 'Court 2', time: '13:30', state: 'upcoming' },
  ],
  // semifinals (2 matches)
  [
    { seed: [1, 4],   a: { name: 'Hartwell / Vega',     rating: '4.5', score: null, won: false }, b: { name: 'Cho / Marquez',         rating: '4.5', score: null, won: false }, court: 'Center Ct', time: '15:30', state: 'upcoming' },
    { seed: ['—', '—'],   a: { name: 'TBD',                 rating: '',    score: null, won: false }, b: { name: 'TBD',                  rating: '',    score: null, won: false }, court: 'Center Ct', time: '15:30', state: 'tbd' },
  ],
  // final
  [
    { seed: ['—', '—'],   a: { name: 'TBD',                 rating: '',    score: null, won: false }, b: { name: 'TBD',                  rating: '',    score: null, won: false }, court: 'Center Ct', time: '17:00', state: 'tbd' },
  ],
];

function MatchCard({ match, w = 248 }) {
  const isLive = match.state === 'live';
  const isFinal = match.state === 'final';
  const isUpcoming = match.state === 'upcoming';
  const isTbd = match.state === 'tbd';

  const renderRow = (team, seed, isWinner) => {
    const dim = isTbd || team.name === 'TBD';
    const fade = isFinal && !isWinner;
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '22px 1fr auto',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        background: isWinner && isFinal ? TOKENS.surface : TOKENS.surface,
        opacity: fade ? 0.55 : 1,
      }}>
        <div style={{
          fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.muted,
          letterSpacing: '0.04em', textAlign: 'center',
        }}>{dim ? '–' : seed}</div>
        <div style={{
          fontFamily: FONTS.body, fontSize: 12.5,
          fontWeight: isWinner && isFinal ? 600 : 500,
          color: dim ? TOKENS.faint : TOKENS.ink,
          letterSpacing: '-0.005em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{team.name}</div>
        <div style={{
          display: 'flex', gap: 7, alignItems: 'center',
          fontFamily: FONTS.mono, fontSize: 12,
          fontFeatureSettings: '"tnum" 1',
          fontWeight: 500,
        }}>
          {team.score && team.score.map((s, i) => (
            <span key={i} style={{
              color: isWinner ? TOKENS.ink : TOKENS.muted,
              minWidth: 12, textAlign: 'right',
            }}>{s}</span>
          ))}
          {isLive && (
            <span style={{
              color: isWinner ? TOKENS.amber : TOKENS.ink2,
              fontWeight: 600,
            }}>—</span>
          )}
          {(isUpcoming || isTbd) && <span style={{ color: TOKENS.faint }}>–</span>}
        </div>
      </div>
    );
  };

  const winnerA = match.a.won;
  const winnerB = match.b.won;

  return (
    <div style={{
      width: w,
      background: TOKENS.surface,
      border: `1px solid ${isLive ? TOKENS.amber : TOKENS.hairline}`,
      borderRadius: 4,
      overflow: 'hidden',
      boxShadow: isLive ? `0 0 0 2px ${TOKENS.amberTint}` : 'none',
      position: 'relative',
    }}>
      {/* header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px',
        borderBottom: `1px solid ${TOKENS.hairline}`,
        background: isLive ? TOKENS.amberTint : TOKENS.surface2,
      }}>
        <span style={{
          fontFamily: FONTS.mono, fontSize: 9.5,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: isLive ? '#7C3F0A' : TOKENS.muted, fontWeight: 500,
        }}>{match.court} · {match.time}</span>
        {isLive && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Dot color={TOKENS.amber} size={6} pulse />
            <span style={{
              fontFamily: FONTS.mono, fontSize: 9.5,
              letterSpacing: '0.14em', color: '#7C3F0A', fontWeight: 600,
            }}>LIVE · GM {match.liveScore.game}</span>
          </span>
        )}
        {isFinal && (
          <span style={{
            fontFamily: FONTS.mono, fontSize: 9.5,
            letterSpacing: '0.14em', color: TOKENS.muted, fontWeight: 500,
          }}>FINAL</span>
        )}
        {isUpcoming && (
          <span style={{
            fontFamily: FONTS.mono, fontSize: 9.5,
            letterSpacing: '0.14em', color: TOKENS.muted, fontWeight: 500,
          }}>NEXT</span>
        )}
        {isTbd && (
          <span style={{
            fontFamily: FONTS.mono, fontSize: 9.5,
            letterSpacing: '0.14em', color: TOKENS.faint, fontWeight: 500,
          }}>TBD</span>
        )}
      </div>
      {renderRow(match.a, match.seed[0], winnerA)}
      <div style={{ height: 1, background: TOKENS.hairline }} />
      {renderRow(match.b, match.seed[1], winnerB)}
    </div>
  );
}

function BracketScreen() {
  // Layout: 4 round columns, each column vertically centers its matches.
  // Connectors drawn with absolutely-positioned thin lines.

  const rounds = ['Round of 16', 'Quarterfinals', 'Semifinals', 'Final'];
  const cardW = 248;
  const colGap = 60;
  const cardH = 76;
  const baseSpacing = 14; // R16 spacing between cards

  // For each round, vertical center spacing doubles.
  const roundOffsets = [];
  let unit = cardH + baseSpacing;
  for (let r = 0; r < 4; r++) {
    const matches = SEEDS_16[r];
    const slotPitch = unit * Math.pow(2, r);
    const colHeight = SEEDS_16[0].length * unit;
    const offset = (slotPitch - unit) / 2;
    roundOffsets.push({ slotPitch, offset, colHeight });
  }

  const totalH = roundOffsets[0].colHeight + 6;

  const Round = ({ roundIdx }) => {
    const o = roundOffsets[roundIdx];
    const matches = SEEDS_16[roundIdx];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{
          paddingBottom: 10,
          marginBottom: 14,
          borderBottom: `1px solid ${TOKENS.hairline}`,
        }}>
          <Eyebrow style={{ marginBottom: 4 }}>{`Round ${['I', 'II', 'III', 'IV'][roundIdx]}`}</Eyebrow>
          <div style={{
            fontFamily: FONTS.display, fontWeight: 700,
            fontSize: 17, letterSpacing: '-0.025em', color: TOKENS.ink,
          }}>{rounds[roundIdx]}</div>
        </div>
        <div style={{ position: 'relative', height: totalH - 50 }}>
          {matches.map((m, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: o.offset + i * o.slotPitch,
              left: 0, width: cardW,
            }}>
              <MatchCard match={m} w={cardW} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // SVG connectors between rounds
  const connectorH = totalH - 50;
  const Connectors = ({ between }) => {
    const o1 = roundOffsets[between];
    const o2 = roundOffsets[between + 1];
    const matches = SEEDS_16[between];
    const lines = [];
    for (let i = 0; i < matches.length; i += 2) {
      const y1 = o1.offset + i * o1.slotPitch + cardH / 2;
      const y2 = o1.offset + (i + 1) * o1.slotPitch + cardH / 2;
      const yMid = (y1 + y2) / 2;
      const isLive = matches[i].state === 'live' || matches[i + 1]?.state === 'live';
      const stroke = isLive ? TOKENS.amber : TOKENS.rule;
      lines.push(
        <g key={i} stroke={stroke} strokeWidth="1" fill="none">
          <path d={`M 0 ${y1} H 26`} />
          <path d={`M 0 ${y2} H 26`} />
          <path d={`M 26 ${y1} V ${y2}`} />
          <path d={`M 26 ${yMid} H ${colGap}`} />
        </g>
      );
    }
    return (
      <svg width={colGap} height={connectorH} style={{ display: 'block' }}>
        {lines}
      </svg>
    );
  };

  return (
    <div style={{
      width: 1600, minHeight: 1100, background: TOKENS.paper,
      fontFamily: FONTS.body, color: TOKENS.ink,
    }}>
      <TopNav active="live" />
      {/* Tournament context bar */}
      <div style={{
        padding: '24px 32px 18px',
        borderBottom: `1px solid ${TOKENS.hairline}`,
        background: TOKENS.paper,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'end',
        gap: 32,
      }}>
        <div>
          <Eyebrow style={{ marginBottom: 8 }}>SAT 09 MAY · DAY 2 OF 2 · BRACKET PLAY</Eyebrow>
          <div style={{
            fontFamily: FONTS.display, fontWeight: 800,
            fontSize: 44, letterSpacing: '-0.035em', lineHeight: 1,
            color: TOKENS.ink,
          }}>The Bay Open</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12 }}>
            <span style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink2, fontWeight: 500 }}>Mixed Doubles · 4.5</span>
            <span style={{ width: 3, height: 3, background: TOKENS.faint, borderRadius: '50%' }} />
            <span style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.muted }}>16 teams</span>
            <span style={{ width: 3, height: 3, background: TOKENS.faint, borderRadius: '50%' }} />
            <span style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.muted }}>Single elim, 2 of 3 to 11</span>
          </div>
        </div>
        <div />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Pill tone="amber"><Dot color={TOKENS.amber} size={6} pulse /> 1 match live</Pill>
          <Btn variant="outline" size="sm" icon={<Icon name="share" size={14} />}>Public link</Btn>
          <Btn variant="outline" size="sm" icon={<Icon name="qr" size={14} />}>Print bracket</Btn>
          <Btn variant="primary" size="sm" icon={<Icon name="settings" size={14} />}>Manage draw</Btn>
        </div>
      </div>

      {/* Sub-tabs: Format selector */}
      <div style={{
        padding: '14px 32px',
        borderBottom: `1px solid ${TOKENS.hairline}`,
        display: 'flex', alignItems: 'center', gap: 24,
        background: TOKENS.surface2,
      }}>
        <div style={{ display: 'flex', gap: 0, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6, overflow: 'hidden', background: TOKENS.surface }}>
          {['Pool play', 'Bracket', 'Schedule', 'Standings'].map((t, i) => (
            <span key={t} style={{
              padding: '7px 14px',
              fontFamily: FONTS.body, fontSize: 12.5, fontWeight: 500,
              background: i === 1 ? TOKENS.ink : 'transparent',
              color: i === 1 ? '#FFF' : TOKENS.ink2,
              borderRight: i < 3 ? `1px solid ${TOKENS.hairline}` : 'none',
              cursor: 'pointer',
            }}>{t}</span>
          ))}
        </div>
        <span style={{ width: 1, height: 18, background: TOKENS.hairline }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONTS.body, fontSize: 12.5, color: TOKENS.muted }}>
          <span>Bracket size <strong style={{ color: TOKENS.ink, fontWeight: 600 }}>16</strong></span>
          <span>·</span>
          <span>Format <strong style={{ color: TOKENS.ink, fontWeight: 600 }}>Single elim</strong></span>
          <span>·</span>
          <span>Match <strong style={{ color: TOKENS.ink, fontWeight: 600 }}>Best of 3 · win by 2</strong></span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Btn variant="ghost" size="sm" icon={<Icon name="filter" size={14} />}>Filter</Btn>
          <Btn variant="ghost" size="sm" icon={<Icon name="chevron-down" size={14} />}>Mixed Doubles 4.5</Btn>
        </div>
      </div>

      {/* Bracket grid */}
      <div style={{ padding: '32px 32px 24px', display: 'flex', alignItems: 'flex-start' }}>
        <Round roundIdx={0} />
        <div style={{ marginTop: 50 }}><Connectors between={0} /></div>
        <Round roundIdx={1} />
        <div style={{ marginTop: 50 }}><Connectors between={1} /></div>
        <Round roundIdx={2} />
        <div style={{ marginTop: 50 }}><Connectors between={2} /></div>
        <Round roundIdx={3} />
        {/* Trophy block at far right */}
        <div style={{
          marginLeft: 28,
          marginTop: 50 + roundOffsets[3].offset + 4,
          width: 200,
        }}>
          <div style={{
            border: `1px solid ${TOKENS.ink}`,
            background: TOKENS.ink,
            color: '#F5F2EB',
            padding: '18px 16px',
            borderRadius: 4,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <Icon name="trophy" size={22} color="#F5E5D2" />
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: '0.14em', color: '#9C9890' }}>CHAMPIONS</div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', marginTop: 4 }}>Awaiting final</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: '#9C9890', letterSpacing: '0.06em' }}>PURSE · $4,800</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: '#9C9890', letterSpacing: '0.06em' }}>17:00 · CENTER COURT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer rule + legend */}
      <div style={{
        margin: '0 32px',
        padding: '18px 0 28px',
        borderTop: `1px solid ${TOKENS.hairline}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontFamily: FONTS.body, fontSize: 12, color: TOKENS.muted }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 18, height: 8, background: TOKENS.amberTint, border: `1px solid ${TOKENS.amber}`, borderRadius: 2 }} /> Live
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 18, height: 8, background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 2 }} /> Upcoming / TBD
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 18, height: 8, background: TOKENS.surface2, border: `1px solid ${TOKENS.hairline}`, borderRadius: 2 }} /> Final
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: TOKENS.muted, padding: '1px 4px', border: `1px solid ${TOKENS.hairline}`, borderRadius: 3 }}>1</span> Seed
          </span>
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: '0.1em', color: TOKENS.faint }}>
          AS OF 13:42 PT · UPDATED IN REAL-TIME
        </div>
      </div>
    </div>
  );
}

window.BracketScreen = BracketScreen;
