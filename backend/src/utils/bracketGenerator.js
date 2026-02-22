import Match from '../models/Match.js';

/**
 * Calculate bracket size (next power of 2)
 * @param {number} numTeams - Number of teams
 * @returns {object} - { bracketSize, byes }
 */
export const calculateBracketSize = (numTeams) => {
  if (numTeams < 2) {
    throw new Error('At least 2 teams required for bracket generation');
  }

  // Find next power of 2
  let bracketSize = 2;
  while (bracketSize < numTeams) {
    bracketSize *= 2;
  }

  const byes = bracketSize - numTeams;

  return { bracketSize, byes };
};

/**
 * Assign byes to top seeds
 * @param {Array} teams - Array of team objects
 * @param {number} numByes - Number of byes to assign
 * @returns {Array} - Teams with bye assignments
 */
export const assignByesForPowerOf2 = (teams, numByes) => {
  return teams.map((team, index) => ({
    ...team,
    hasBye: index < numByes
  }));
};

/**
 * Generate single elimination bracket
 * Works for any N >= 2 using a play-in compression approach.
 * @param {string} poolId - Pool ID
 * @param {string} eventId - Event ID
 * @param {Array} teams - Array of team objects/IDs, ordered by seed (best first)
 * @param {string} teamModel - 'Team' or 'User' for singles
 * @returns {Array} - Array of Match objects
 */
export const generateSingleEliminationBracket = async (poolId, eventId, teams, teamModel = 'Team') => {
  const N = teams.length;

  // Find largest power of 2 <= N
  let nextLowerPower = 1;
  while (nextLowerPower * 2 <= N) nextLowerPower *= 2;

  const playInMatchCount = N - nextLowerPower;          // 0 when N is already a power of 2
  const numByes = N - 2 * playInMatchCount;             // Top seeds that skip to round 2
  const numMainRounds = Math.log2(nextLowerPower);
  const mainRoundStart = playInMatchCount > 0 ? 2 : 1;
  const finalRound = mainRoundStart + numMainRounds - 1;

  const getBracketLabel = (round) => {
    if (round === finalRound) return 'finals';
    if (numMainRounds >= 2 && round === finalRound - 1) return 'semifinals';
    return 'winners';
  };

  // Move top seed to last bye slot so they face the play-in winner (weakest possible opponent)
  // e.g. for N=9: [S1,S2,S3,S4,S5,S6,S7] → [S2,S3,S4,S5,S6,S7,S1]
  // This pairs S1 with the play-in winner in round 2 rather than S2.
  let byeTeams = teams.slice(0, numByes);
  const playInTeams = teams.slice(numByes);
  if (playInMatchCount > 0 && numByes > 1) {
    byeTeams = [...byeTeams.slice(1), byeTeams[0]];
  }

  let matchNumber = 1;
  let bracketPosition = 0;
  const allMatchDefs = [];

  // Round 1: Play-in matches (only when N is not a power of 2)
  if (playInMatchCount > 0) {
    for (let i = 0; i < playInTeams.length; i += 2) {
      const t1 = playInTeams[i];
      const t2 = playInTeams[i + 1];
      allMatchDefs.push({
        pool: poolId,
        event: eventId,
        team1: t1?._id ?? t1,
        team1Model: teamModel,
        team2: t2?._id ?? t2,
        team2Model: teamModel,
        round: 1,
        bracket: 'winners',
        matchNumber: matchNumber++,
        bracketPosition: bracketPosition++,
        status: 'scheduled'
      });
    }
  }

  // Main bracket rounds
  for (let round = mainRoundStart; round <= finalRound; round++) {
    const matchesInRound = nextLowerPower / Math.pow(2, round - mainRoundStart + 1);
    const label = getBracketLabel(round);

    for (let i = 0; i < matchesInRound; i++) {
      let team1 = null;
      let team2 = null;

      // Pre-fill bye teams into round-2 (mainRoundStart) slots
      if (round === mainRoundStart) {
        const slotA = i * 2;
        const slotB = i * 2 + 1;
        if (slotA < numByes && byeTeams[slotA]) {
          const t = byeTeams[slotA];
          team1 = t?._id ?? t;
        }
        if (slotB < numByes && byeTeams[slotB]) {
          const t = byeTeams[slotB];
          team2 = t?._id ?? t;
        }
      }

      allMatchDefs.push({
        pool: poolId,
        event: eventId,
        team1,
        team1Model: teamModel,
        team2,
        team2Model: teamModel,
        round,
        bracket: label,
        matchNumber: matchNumber++,
        bracketPosition: bracketPosition++,
        status: 'scheduled'
      });
    }
  }

  const createdMatches = await Match.insertMany(allMatchDefs);

  const matchesByRound = {};
  createdMatches.forEach(match => {
    if (!matchesByRound[match.round]) matchesByRound[match.round] = [];
    matchesByRound[match.round].push(match);
  });

  // Link main bracket rounds
  for (let round = mainRoundStart; round < finalRound; round++) {
    const current = matchesByRound[round] || [];
    const next = matchesByRound[round + 1] || [];
    current.forEach((match, index) => {
      const nextIdx = Math.floor(index / 2);
      if (next[nextIdx]) {
        match.nextMatchId = next[nextIdx]._id;
        if (index % 2 === 0) next[nextIdx].previousMatch1Id = match._id;
        else next[nextIdx].previousMatch2Id = match._id;
      }
    });
  }

  // Link play-in matches to their round-2 slots
  if (playInMatchCount > 0) {
    const playInMatches = matchesByRound[1] || [];
    const round2Matches = matchesByRound[mainRoundStart] || [];

    playInMatches.forEach((playInMatch, pi) => {
      const slotIdx = numByes + pi;
      const round2MatchIdx = Math.floor(slotIdx / 2);
      const r2Match = round2Matches[round2MatchIdx];
      if (r2Match) {
        playInMatch.nextMatchId = r2Match._id;
        if (slotIdx % 2 === 0) r2Match.previousMatch1Id = playInMatch._id;
        else r2Match.previousMatch2Id = playInMatch._id;
      }
    });
  }

  // Bronze medal match when there are exactly 2 semifinals
  if (numMainRounds >= 2) {
    const semifinalsList = matchesByRound[finalRound - 1] || [];
    if (semifinalsList.length === 2) {
      const maxMatchNumber = createdMatches.reduce((max, m) => Math.max(max, m.matchNumber || 0), 0);
      const [bronzeMatch] = await Match.insertMany([{
        pool: poolId,
        event: eventId,
        team1: null,
        team1Model: teamModel,
        team2: null,
        team2Model: teamModel,
        round: finalRound,
        bracket: 'bronze',
        matchNumber: maxMatchNumber + 1,
        status: 'scheduled'
      }]);
      semifinalsList.forEach(semi => {
        semi.loserNextMatchId = bronzeMatch._id;
      });
      createdMatches.push(bronzeMatch);
    }
  }

  await Promise.all(createdMatches.map(match => match.save()));
  return createdMatches;
};

/**
 * Generate single-elimination bracket for event-tier playoffs (pool=null, bracketTier set).
 * Works for any N >= 2 using a play-in compression approach:
 *   - If N is a power of 2: standard bracket, all teams in round 1.
 *   - If N is NOT a power of 2: bottom (2 * playInCount) seeds play round 1 (play-in),
 *     top seeds get byes directly to round 2. After play-in, the bracket is a clean
 *     nextLowerPower-of-2 bracket.
 * Adds a bronze match whenever there are exactly 2 semifinals.
 * @param {string} eventId - Event ID
 * @param {Array} teams - Array of team objects { _id, name }, ordered by seed (best first)
 * @param {string} teamModel - 'Team' or 'User'
 * @param {string} bracketTier - 'gold' | 'silver' | 'bronze' | 'event'
 * @param {number} startMatchNumber - First match number for this tier
 * @returns {Array} Created matches
 */
export const generateSingleEliminationForEventTier = async (eventId, teams, teamModel, bracketTier, startMatchNumber = 1) => {
  if (!teams || teams.length < 2) {
    throw new Error('At least 2 teams required for tier bracket');
  }

  const N = teams.length;

  // Find largest power of 2 <= N
  let nextLowerPower = 1;
  while (nextLowerPower * 2 <= N) nextLowerPower *= 2;

  const playInMatchCount = N - nextLowerPower;          // 0 when N is already a power of 2
  const numByes = N - 2 * playInMatchCount;             // Top seeds that skip directly to round 2
  const numMainRounds = Math.log2(nextLowerPower);      // Rounds in the main bracket
  const mainRoundStart = playInMatchCount > 0 ? 2 : 1; // Round number where main bracket begins
  const finalRound = mainRoundStart + numMainRounds - 1;

  // Returns 'finals', 'semifinals', or 'winners' for a given round number
  const getBracketLabel = (round) => {
    if (round === finalRound) return 'finals';
    if (numMainRounds >= 2 && round === finalRound - 1) return 'semifinals';
    return 'winners';
  };

  // byeTeams: top numByes seeds — skip round 1, pre-filled into round 2 slots
  // playInTeams: bottom (2 * playInMatchCount) seeds — play in round 1
  // Move top seed to last bye slot so they face the play-in winner (weakest possible opponent)
  // e.g. for N=9: [S1,S2,S3,S4,S5,S6,S7] → [S2,S3,S4,S5,S6,S7,S1]
  let byeTeams = teams.slice(0, numByes);
  const playInTeams = teams.slice(numByes);
  if (playInMatchCount > 0 && numByes > 1) {
    byeTeams = [...byeTeams.slice(1), byeTeams[0]];
  }

  let matchNumber = startMatchNumber;
  let bracketPosition = 0;
  const allMatchDefs = [];

  // --- Round 1: Play-in matches (only when N is not a power of 2) ---
  if (playInMatchCount > 0) {
    for (let i = 0; i < playInTeams.length; i += 2) {
      const t1 = playInTeams[i];
      const t2 = playInTeams[i + 1];
      allMatchDefs.push({
        pool: null,
        event: eventId,
        team1: t1?._id ?? t1,
        team1Model: teamModel,
        team2: t2?._id ?? t2,
        team2Model: teamModel,
        round: 1,
        bracket: 'winners',
        bracketTier,
        matchNumber: matchNumber++,
        bracketPosition: bracketPosition++,
        status: 'scheduled'
      });
    }
  }

  // --- Main bracket rounds (round mainRoundStart through finalRound) ---
  // Slots for round 2 (mainRoundStart): [byeTeam0, byeTeam1, ..., byeTeam(numByes-1), null, null, ...]
  // The null slots are filled by play-in winners via nextMatchId linking.
  // Sequential pairing: slots [0,1] → match 0, [2,3] → match 1, etc.
  for (let round = mainRoundStart; round <= finalRound; round++) {
    const matchesInRound = nextLowerPower / Math.pow(2, round - mainRoundStart + 1);
    const label = getBracketLabel(round);

    for (let i = 0; i < matchesInRound; i++) {
      let team1 = null;
      let team2 = null;

      // Pre-fill bye teams into round-2 slots
      if (round === mainRoundStart) {
        const slotA = i * 2;
        const slotB = i * 2 + 1;
        if (slotA < numByes && byeTeams[slotA]) {
          team1 = byeTeams[slotA]._id ?? byeTeams[slotA];
        }
        if (slotB < numByes && byeTeams[slotB]) {
          team2 = byeTeams[slotB]._id ?? byeTeams[slotB];
        }
      }

      allMatchDefs.push({
        pool: null,
        event: eventId,
        team1,
        team1Model: teamModel,
        team2,
        team2Model: teamModel,
        round,
        bracket: label,
        bracketTier,
        matchNumber: matchNumber++,
        bracketPosition: bracketPosition++,
        status: 'scheduled'
      });
    }
  }

  const createdMatches = await Match.insertMany(allMatchDefs);

  // Build matchesByRound map
  const matchesByRound = {};
  createdMatches.forEach(match => {
    if (!matchesByRound[match.round]) matchesByRound[match.round] = [];
    matchesByRound[match.round].push(match);
  });

  // Link main bracket rounds (mainRoundStart → finalRound-1), skipping play-in round
  for (let round = mainRoundStart; round < finalRound; round++) {
    const current = matchesByRound[round] || [];
    const next = matchesByRound[round + 1] || [];
    current.forEach((match, index) => {
      const nextIdx = Math.floor(index / 2);
      if (next[nextIdx]) {
        match.nextMatchId = next[nextIdx]._id;
        if (index % 2 === 0) next[nextIdx].previousMatch1Id = match._id;
        else next[nextIdx].previousMatch2Id = match._id;
      }
    });
  }

  // Link play-in matches to their round-2 slots
  // Play-in winner i fills slot (numByes + i) in the round-2 slot array.
  // slotIdx determines which round-2 match and which team position (team1/team2).
  if (playInMatchCount > 0) {
    const playInMatches = matchesByRound[1] || [];
    const round2Matches = matchesByRound[mainRoundStart] || [];

    playInMatches.forEach((playInMatch, pi) => {
      const slotIdx = numByes + pi;
      const round2MatchIdx = Math.floor(slotIdx / 2);
      const r2Match = round2Matches[round2MatchIdx];
      if (r2Match) {
        playInMatch.nextMatchId = r2Match._id;
        if (slotIdx % 2 === 0) r2Match.previousMatch1Id = playInMatch._id;
        else r2Match.previousMatch2Id = playInMatch._id;
      }
    });
  }

  // Bronze medal match: created when there are exactly 2 semifinals
  if (numMainRounds >= 2) {
    const semifinalsList = matchesByRound[finalRound - 1] || [];
    if (semifinalsList.length === 2) {
      const maxMatchNumber = createdMatches.reduce((max, m) => Math.max(max, m.matchNumber || 0), 0);
      const [bronzeMatch] = await Match.insertMany([{
        pool: null,
        event: eventId,
        team1: null,
        team1Model: teamModel,
        team2: null,
        team2Model: teamModel,
        round: finalRound,
        bracket: 'bronze',
        bracketTier,
        matchNumber: maxMatchNumber + 1,
        status: 'scheduled',
        previousMatch1Id: semifinalsList[0]._id,
        previousMatch2Id: semifinalsList[1]._id
      }]);
      semifinalsList.forEach(semi => {
        semi.loserNextMatchId = bronzeMatch._id;
      });
      createdMatches.push(bronzeMatch);
    }
  }

  await Promise.all(createdMatches.map(match => match.save()));
  return createdMatches;
};

/**
 * Generate a 4-team single-elimination bracket for one tier (gold/silver/bronze) in event-level playoffs.
 * Creates 2 semifinals, 1 final, 1 bronze. Matches have pool=null and bracketTier set.
 * @param {string} eventId - Event ID
 * @param {Array} teams - Array of 4 team objects { _id, name }
 * @param {string} teamModel - 'Team' or 'User'
 * @param {string} bracketTier - 'gold' | 'silver' | 'bronze'
 * @param {number} startMatchNumber - Starting match number for this tier
 * @returns {Array} Created matches
 */
export const generateFourTeamTierBracket = async (eventId, teams, teamModel, bracketTier, startMatchNumber = 1) => {
  if (!teams || teams.length !== 4) {
    throw new Error('generateFourTeamTierBracket requires exactly 4 teams');
  }
  const matchNumber = startMatchNumber;
  const semi1 = {
    pool: null,
    event: eventId,
    team1: teams[0]?._id ?? teams[0],
    team1Model: teamModel,
    team2: teams[1]?._id ?? teams[1],
    team2Model: teamModel,
    round: 1,
    bracket: 'semifinals',
    bracketTier,
    matchNumber,
    status: 'scheduled'
  };
  const semi2 = {
    pool: null,
    event: eventId,
    team1: teams[2]?._id ?? teams[2],
    team1Model: teamModel,
    team2: teams[3]?._id ?? teams[3],
    team2Model: teamModel,
    round: 1,
    bracket: 'semifinals',
    bracketTier,
    matchNumber: startMatchNumber + 1,
    status: 'scheduled'
  };
  const [semi1Doc, semi2Doc] = await Match.insertMany([semi1, semi2]);

  const finalMatch = {
    pool: null,
    event: eventId,
    team1: null,
    team1Model: teamModel,
    team2: null,
    team2Model: teamModel,
    round: 2,
    bracket: 'finals',
    bracketTier,
    matchNumber: startMatchNumber + 2,
    status: 'scheduled'
  };
  const bronzeMatch = {
    pool: null,
    event: eventId,
    team1: null,
    team1Model: teamModel,
    team2: null,
    team2Model: teamModel,
    round: 2,
    bracket: 'bronze',
    bracketTier,
    matchNumber: startMatchNumber + 3,
    status: 'scheduled'
  };
  const [finalDoc, bronzeDoc] = await Match.insertMany([finalMatch, bronzeMatch]);

  semi1Doc.nextMatchId = finalDoc._id;
  semi1Doc.loserNextMatchId = bronzeDoc._id;
  semi2Doc.nextMatchId = finalDoc._id;
  semi2Doc.loserNextMatchId = bronzeDoc._id;
  finalDoc.previousMatch1Id = semi1Doc._id;
  finalDoc.previousMatch2Id = semi2Doc._id;
  bronzeDoc.previousMatch1Id = semi1Doc._id;
  bronzeDoc.previousMatch2Id = semi2Doc._id;
  await semi1Doc.save();
  await semi2Doc.save();
  await finalDoc.save();
  await bronzeDoc.save();

  return [semi1Doc, semi2Doc, finalDoc, bronzeDoc];
};

/**
 * Generate double elimination bracket
 * @param {string} poolId - Pool ID
 * @param {string} eventId - Event ID
 * @param {Array} teams - Array of team IDs
 * @param {string} teamModel - 'Team' or 'User' for singles
 * @returns {object} - { winnersMatches, losersMatches, grandFinals }
 */
export const generateDoubleEliminationBracket = async (poolId, eventId, teams, teamModel = 'Team') => {
  const { bracketSize } = calculateBracketSize(teams.length);
  const numRounds = Math.log2(bracketSize);

  const winnersMatches = [];
  const losersMatches = [];
  let matchNumber = 1;
  let bracketPosition = 0;

  // Winners Bracket - Round 1
  for (let i = 0; i < teams.length; i += 2) {
    const match = {
      pool: poolId,
      event: eventId,
      team1: teams[i],
      team1Model: teamModel,
      team2: teams[i + 1] || null,
      team2Model: teamModel,
      round: 1,
      bracket: 'winners',
      matchNumber: matchNumber++,
      bracketPosition: bracketPosition++,
      status: 'scheduled'
    };
    winnersMatches.push(match);
  }

  // Winners Bracket - Subsequent rounds
  for (let round = 2; round <= numRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);

    for (let i = 0; i < matchesInRound; i++) {
      const match = {
        pool: poolId,
        event: eventId,
        team1: null,
        team1Model: teamModel,
        team2: null,
        team2Model: teamModel,
        round: round,
        bracket: 'winners',
        matchNumber: matchNumber++,
        bracketPosition: bracketPosition++,
        status: 'scheduled'
      };
      winnersMatches.push(match);
    }
  }

  // Losers Bracket - Double the rounds, half the initial matches
  const losersRounds = (numRounds - 1) * 2;
  for (let round = 1; round <= losersRounds; round++) {
    // Losers bracket alternates between dropdown from winners and losers advancement
    const matchesInRound = round === 1 ? teams.length / 4 : Math.ceil(teams.length / Math.pow(2, Math.ceil(round / 2) + 1));

    for (let i = 0; i < matchesInRound; i++) {
      const match = {
        pool: poolId,
        event: eventId,
        team1: null,
        team1Model: teamModel,
        team2: null,
        team2Model: teamModel,
        round: round,
        bracket: 'losers',
        matchNumber: matchNumber++,
        bracketPosition: bracketPosition++,
        status: 'scheduled'
      };
      losersMatches.push(match);
    }
  }

  // Grand Finals
  const grandFinals = {
    pool: poolId,
    event: eventId,
    team1: null, // Winner of winners bracket
    team1Model: teamModel,
    team2: null, // Winner of losers bracket
    team2Model: teamModel,
    round: numRounds + losersRounds + 1,
    bracket: 'finals',
    matchNumber: matchNumber++,
    bracketPosition: bracketPosition++,
    status: 'scheduled'
  };

  // Insert all matches
  const allMatches = [...winnersMatches, ...losersMatches, grandFinals];
  const createdMatches = await Match.insertMany(allMatches);

  // Link winners bracket matches
  const winnersOnly = createdMatches.filter(m => m.bracket === 'winners');
  const winnersByRound = {};
  winnersOnly.forEach(match => {
    if (!winnersByRound[match.round]) {
      winnersByRound[match.round] = [];
    }
    winnersByRound[match.round].push(match);
  });

  for (let round = 1; round < numRounds; round++) {
    const currentRoundMatches = winnersByRound[round];
    const nextRoundMatches = winnersByRound[round + 1];

    currentRoundMatches.forEach((match, index) => {
      const nextMatchIndex = Math.floor(index / 2);
      match.nextMatchId = nextRoundMatches[nextMatchIndex]._id;
    });
  }

  // Save all matches
  await Promise.all(createdMatches.map(match => match.save()));

  return {
    winnersMatches: winnersOnly,
    losersMatches: createdMatches.filter(m => m.bracket === 'losers'),
    grandFinals: createdMatches.find(m => m.bracket === 'finals')
  };
};

/**
 * Generate round robin matches (all vs all)
 * @param {string} poolId - Pool ID
 * @param {string} eventId - Event ID
 * @param {Array} teams - Array of team IDs
 * @param {string} teamModel - 'Team' or 'User' for singles
 * @returns {Array} - Array of Match objects
 */
export const generateRoundRobinMatches = async (poolId, eventId, teams, teamModel = 'Team') => {
  const matches = [];
  let matchNumber = 1;
  let bracketPosition = 0;

  // Generate all possible pairings
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const match = {
        pool: poolId,
        event: eventId,
        team1: teams[i],
        team1Model: teamModel,
        team2: teams[j],
        team2Model: teamModel,
        round: 1,
        bracket: null,
        matchNumber: matchNumber++,
        bracketPosition: bracketPosition++,
        status: 'scheduled'
      };
      matches.push(match);
    }
  }

  // Insert all matches
  const createdMatches = await Match.insertMany(matches);

  return createdMatches;
};

/**
 * Generate playoff bracket based on format
 * @param {string} poolId - Pool ID
 * @param {string} eventId - Event ID
 * @param {Array} teams - Array of team IDs (sorted by seed)
 * @param {string} playFormat - 'single-elimination', 'double-elimination', 'round-robin'
 * @param {string} teamModel - 'Team' or 'User'
 * @returns {Array|object} - Generated matches
 */
export const generatePlayoffBracket = async (poolId, eventId, teams, playFormat, teamModel = 'Team') => {
  switch (playFormat) {
    case 'single-elimination':
      return await generateSingleEliminationBracket(poolId, eventId, teams, teamModel);

    case 'double-elimination':
      return await generateDoubleEliminationBracket(poolId, eventId, teams, teamModel);

    case 'round-robin':
    case 'pool-play':
      return await generateRoundRobinMatches(poolId, eventId, teams, teamModel);

    default:
      throw new Error(`Unsupported play format: ${playFormat}`);
  }
};
