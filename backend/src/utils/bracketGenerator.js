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
 * @param {string} poolId - Pool ID
 * @param {string} eventId - Event ID
 * @param {Array} teams - Array of team IDs
 * @param {string} teamModel - 'Team' or 'User' for singles
 * @returns {Array} - Array of Match objects
 */
export const generateSingleEliminationBracket = async (poolId, eventId, teams, teamModel = 'Team') => {
  const { bracketSize, byes } = calculateBracketSize(teams.length);
  const teamsWithByes = assignByesForPowerOf2(teams, byes);

  // Calculate number of rounds
  const numRounds = Math.log2(bracketSize);
  const matches = [];

  // Round 1 - Initial matches (with byes)
  const round1Teams = teamsWithByes.filter(t => !t.hasBye);
  let matchNumber = 1;
  let bracketPosition = 0;

  // Create round 1 matches (store ObjectIds for refs)
  for (let i = 0; i < round1Teams.length; i += 2) {
    const t1 = round1Teams[i];
    const t2 = round1Teams[i + 1] || null;
    const match = {
      pool: poolId,
      event: eventId,
      team1: t1?._id ?? t1,
      team1Model: teamModel,
      team2: t2?._id ?? t2,
      team2Model: teamModel,
      round: 1,
      bracket: numRounds === 1 ? 'finals' : numRounds === 2 ? 'semifinals' : 'winners',
      matchNumber: matchNumber++,
      bracketPosition: bracketPosition++,
      status: 'scheduled',
      isByeMatch: !round1Teams[i + 1]
    };
    matches.push(match);
  }

  // Create placeholder matches for subsequent rounds
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
        bracket: round === numRounds ? 'finals' : round === numRounds - 1 ? 'semifinals' : 'winners',
        matchNumber: matchNumber++,
        bracketPosition: bracketPosition++,
        status: 'scheduled'
      };
      matches.push(match);
    }
  }

  // Insert all matches
  const createdMatches = await Match.insertMany(matches);

  // Link matches (winner advances to next match)
  const matchesByRound = {};
  createdMatches.forEach(match => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    matchesByRound[match.round].push(match);
  });

  // Set nextMatchId for all matches except finals
  for (let round = 1; round < numRounds; round++) {
    const currentRoundMatches = matchesByRound[round];
    const nextRoundMatches = matchesByRound[round + 1];

    currentRoundMatches.forEach((match, index) => {
      const nextMatchIndex = Math.floor(index / 2);
      match.nextMatchId = nextRoundMatches[nextMatchIndex]._id;

      // Set previous match references
      if (index % 2 === 0) {
        nextRoundMatches[nextMatchIndex].previousMatch1Id = match._id;
      } else {
        nextRoundMatches[nextMatchIndex].previousMatch2Id = match._id;
      }
    });
  }

  // Handle byes - teams with byes auto-advance
  if (byes > 0) {
    const byeTeams = teamsWithByes.filter(t => t.hasBye);
    const round2Matches = matchesByRound[2] || [];

    byeTeams.forEach((byeTeam, index) => {
      if (round2Matches[index]) {
        const id = byeTeam._id ?? byeTeam;
        if (index % 2 === 0) {
          round2Matches[index].team1 = id;
        } else {
          round2Matches[index].team2 = id;
        }
      }
    });
  }

  // Bronze medal match: when we have 2 semifinals (round before final has 2 matches)
  const roundBeforeFinal = numRounds - 1;
  const semifinalsList = matchesByRound[roundBeforeFinal] || [];
  if (semifinalsList.length === 2) {
    const maxMatchNumber = createdMatches.reduce((max, m) => Math.max(max, m.matchNumber || 0), 0);
    const [bronzeMatch] = await Match.insertMany([{
      pool: poolId,
      event: eventId,
      team1: null,
      team1Model: teamModel,
      team2: null,
      team2Model: teamModel,
      round: numRounds,
      bracket: 'bronze',
      matchNumber: maxMatchNumber + 1,
      status: 'scheduled'
    }]);
    semifinalsList.forEach((semi) => {
      semi.loserNextMatchId = bronzeMatch._id;
    });
    createdMatches.push(bronzeMatch);
  }

  // Save all updated matches
  await Promise.all(createdMatches.map(match => match.save()));

  return createdMatches;
};

/**
 * Generate single-elimination bracket for event-tier playoffs (pool=null, bracketTier set).
 * Works for any N >= 2. Adds bronze match when there are 2 semifinals.
 * @param {string} eventId - Event ID
 * @param {Array} teams - Array of team objects { _id, name }
 * @param {string} teamModel - 'Team' or 'User'
 * @param {string} bracketTier - 'gold' | 'silver' | 'bronze'
 * @param {number} startMatchNumber - First match number for this tier
 * @returns {Array} Created matches
 */
export const generateSingleEliminationForEventTier = async (eventId, teams, teamModel, bracketTier, startMatchNumber = 1) => {
  if (!teams || teams.length < 2) {
    throw new Error('At least 2 teams required for tier bracket');
  }
  const { bracketSize, byes } = calculateBracketSize(teams.length);
  const teamsWithByes = assignByesForPowerOf2(teams, byes);
  const numRounds = Math.log2(bracketSize);
  const matches = [];
  let matchNumber = startMatchNumber;
  let bracketPosition = 0;

  const round1Teams = teamsWithByes.filter(t => !t.hasBye);
  for (let i = 0; i < round1Teams.length; i += 2) {
    const t1 = round1Teams[i];
    const t2 = round1Teams[i + 1] || null;
    matches.push({
      pool: null,
      event: eventId,
      team1: t1?._id ?? t1,
      team1Model: teamModel,
      team2: t2?._id ?? t2,
      team2Model: teamModel,
      round: 1,
      bracket: numRounds === 1 ? 'finals' : numRounds === 2 ? 'semifinals' : 'winners',
      bracketTier,
      matchNumber: matchNumber++,
      bracketPosition: bracketPosition++,
      status: 'scheduled',
      isByeMatch: !round1Teams[i + 1]
    });
  }

  for (let round = 2; round <= numRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        pool: null,
        event: eventId,
        team1: null,
        team1Model: teamModel,
        team2: null,
        team2Model: teamModel,
        round,
        bracket: round === numRounds ? 'finals' : round === numRounds - 1 ? 'semifinals' : 'winners',
        bracketTier,
        matchNumber: matchNumber++,
        bracketPosition: bracketPosition++,
        status: 'scheduled'
      });
    }
  }

  const createdMatches = await Match.insertMany(matches);
  const matchesByRound = {};
  createdMatches.forEach(match => {
    if (!matchesByRound[match.round]) matchesByRound[match.round] = [];
    matchesByRound[match.round].push(match);
  });

  for (let round = 1; round < numRounds; round++) {
    const currentRoundMatches = matchesByRound[round];
    const nextRoundMatches = matchesByRound[round + 1];
    currentRoundMatches.forEach((match, index) => {
      const nextMatchIndex = Math.floor(index / 2);
      match.nextMatchId = nextRoundMatches[nextMatchIndex]._id;
      if (index % 2 === 0) {
        nextRoundMatches[nextMatchIndex].previousMatch1Id = match._id;
      } else {
        nextRoundMatches[nextMatchIndex].previousMatch2Id = match._id;
      }
    });
  }

  if (byes > 0) {
    const byeTeams = teamsWithByes.filter(t => t.hasBye);
    const round2Matches = matchesByRound[2] || [];
    byeTeams.forEach((byeTeam, index) => {
      if (round2Matches[index]) {
        const id = byeTeam._id ?? byeTeam;
        if (index % 2 === 0) round2Matches[index].team1 = id;
        else round2Matches[index].team2 = id;
      }
    });
  }

  const roundBeforeFinal = numRounds - 1;
  const semifinalsList = matchesByRound[roundBeforeFinal] || [];
  if (semifinalsList.length === 2) {
    const maxMatchNumber = createdMatches.reduce((max, m) => Math.max(max, m.matchNumber || 0), 0);
    const [bronzeMatch] = await Match.insertMany([{
      pool: null,
      event: eventId,
      team1: null,
      team1Model: teamModel,
      team2: null,
      team2Model: teamModel,
      round: numRounds,
      bracket: 'bronze',
      bracketTier,
      matchNumber: maxMatchNumber + 1,
      status: 'scheduled',
      previousMatch1Id: semifinalsList[0]._id,
      previousMatch2Id: semifinalsList[1]._id
    }]);
    semifinalsList.forEach((semi) => {
      semi.loserNextMatchId = bronzeMatch._id;
    });
    createdMatches.push(bronzeMatch);
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
