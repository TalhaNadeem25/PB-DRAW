// Test script for Circle Method round-robin scheduling
// Run with: node backend/scripts/testRoundRobin.js

const generateRoundRobinMatches = (teams) => {
  const matches = [];
  const teamList = [...teams];

  // If odd number of teams, add a "BYE" placeholder
  const hasBye = teamList.length % 2 !== 0;
  if (hasBye) {
    teamList.push(null);
  }

  const numTeams = teamList.length;
  const numRounds = numTeams - 1;
  const halfSize = numTeams / 2;

  const rotatingTeams = teamList.slice(1);

  for (let round = 0; round < numRounds; round++) {
    const currentArrangement = [teamList[0], ...rotatingTeams];

    console.log(`\n--- Round ${round + 1} ---`);

    for (let i = 0; i < halfSize; i++) {
      const team1 = currentArrangement[i];
      const team2 = currentArrangement[numTeams - 1 - i];

      if (team1 !== null && team2 !== null) {
        matches.push({ team1, team2, round: round + 1 });
        console.log(`  Match: ${team1} vs ${team2}`);
      } else {
        const byeTeam = team1 || team2;
        console.log(`  BYE: ${byeTeam} sits out`);
      }
    }

    const lastTeam = rotatingTeams.pop();
    rotatingTeams.unshift(lastTeam);
  }

  return matches;
};

// Test with 4 players
console.log('\n========== TEST: 4 Players ==========');
const players4 = ['Alice', 'Bob', 'Charlie', 'Diana'];
const matches4 = generateRoundRobinMatches(players4);

// Verify no consecutive matches
console.log('\n--- Verification: Match order per player ---');
players4.forEach(player => {
  const playerMatches = matches4
    .map((m, idx) => ({ ...m, globalIndex: idx + 1 }))
    .filter(m => m.team1 === player || m.team2 === player);
  console.log(`${player}: Matches at positions ${playerMatches.map(m => m.globalIndex).join(', ')} (Rounds: ${playerMatches.map(m => m.round).join(', ')})`);
});

// Test with 5 players (odd - has BYE)
console.log('\n\n========== TEST: 5 Players (with BYE) ==========');
const players5 = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
generateRoundRobinMatches(players5);

// Test with 6 players
console.log('\n\n========== TEST: 6 Players ==========');
const players6 = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
const matches6 = generateRoundRobinMatches(players6);

console.log('\n--- Verification: Match order per player ---');
players6.forEach(player => {
  const playerMatches = matches6
    .map((m, idx) => ({ ...m, globalIndex: idx + 1 }))
    .filter(m => m.team1 === player || m.team2 === player);
  console.log(`${player}: Matches at positions ${playerMatches.map(m => m.globalIndex).join(', ')} (Rounds: ${playerMatches.map(m => m.round).join(', ')})`);
});

console.log('\n\n✅ Test complete! Check that no player has consecutive global match positions.');
