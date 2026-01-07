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

  // Create round 1 matches
  for (let i = 0; i < round1Teams.length; i += 2) {
    const match = {
      pool: poolId,
      event: eventId,
      team1: round1Teams[i],
      team1Model: teamModel,
      team2: round1Teams[i + 1] || null,
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
        // Assign bye team to round 2 match
        if (index % 2 === 0) {
          round2Matches[index].team1 = byeTeam;
        } else {
          round2Matches[index].team2 = byeTeam;
        }
      }
    });
  }

  // Save all updated matches
  await Promise.all(createdMatches.map(match => match.save()));

  return createdMatches;
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
