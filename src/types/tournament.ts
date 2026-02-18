// Tournament and Pool Management Types

export type SkillLevel = "2.5" | "3.0" | "3.5" | "4.0" | "4.5" | "5.0" | "Open";

/** Skill level range for events (e.g. "3.5-4.0"). Stored as single string on Event. */
export const SKILL_LEVEL_RANGES = [
  "2.5-3.0",
  "3.0-3.5",
  "3.5-4.0",
  "4.0-4.5",
  "4.5-5.0",
  "5.0+",
  "Open",
] as const;
export type SkillLevelRange = (typeof SKILL_LEVEL_RANGES)[number];

/** Format event skill level for display (range as-is, single value with +) */
export function formatEventSkillLevel(skillLevel: string | undefined): string {
  if (!skillLevel) return "—";
  if (skillLevel === "Open") return "Open";
  if (skillLevel.includes("-")) return skillLevel;
  return `${skillLevel}+`;
}
export type GameType = "Singles" | "Doubles" | "Mixed Doubles";
export type TournamentFormat = "Round-Robin" | "Single Elimination" | "Double Elimination" | "Pool Play" | "Swiss" | "Pool+Knockout";
export type TournamentStatus = "draft" | "open" | "closed" | "in-progress" | "completed";
export type MatchStatus = "pending" | "in-progress" | "completed";

export interface TournamentEvent {
  id: string;
  name: string;
  gameType: GameType;
  format: TournamentFormat;
  /** Single value (e.g. "4.0+") or range (e.g. "3.5-4.0") or "Open" */
  skillLevel: string;
  maxPlayers: number;
  entryFee: number;
  registeredPlayers: number;
}

export interface Tournament {
  id: string;
  name: string;
  location: string;
  address: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  description: string;
  maxPlayers: number;
  status: TournamentStatus;
  events: TournamentEvent[];
  organizerId: string;
}

export interface Team {
  id: string;
  name: string;
  players: string[];
  seed?: number;
}

export interface Match {
  id: string;
  poolId: string;
  team1: Team;
  team2: Team;
  team1Score: number | null;
  team2Score: number | null;
  status: MatchStatus;
  court?: string;
  scheduledTime?: string;
  winner?: string;
}

export interface PoolStanding {
  team: Team;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
}

export interface Pool {
  id: string;
  name: string;
  eventId: string;
  teams: Team[];
  matches: Match[];
  standings: PoolStanding[];
}

// Helper function to generate round-robin matches
export function generateRoundRobinMatches(poolId: string, teams: Team[]): Match[] {
  const matches: Match[] = [];
  
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        id: `match-${poolId}-${i}-${j}`,
        poolId,
        team1: teams[i],
        team2: teams[j],
        team1Score: null,
        team2Score: null,
        status: "pending",
      });
    }
  }
  
  return matches;
}

// Calculate pool standings from matches
export function calculateStandings(teams: Team[], matches: Match[]): PoolStanding[] {
  const standingsMap = new Map<string, PoolStanding>();
  
  // Initialize standings
  teams.forEach(team => {
    standingsMap.set(team.id, {
      team,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDifferential: 0,
    });
  });
  
  // Calculate from completed matches
  matches.filter(m => m.status === "completed").forEach(match => {
    const team1Standing = standingsMap.get(match.team1.id);
    const team2Standing = standingsMap.get(match.team2.id);
    
    if (team1Standing && team2Standing && match.team1Score !== null && match.team2Score !== null) {
      team1Standing.pointsFor += match.team1Score;
      team1Standing.pointsAgainst += match.team2Score;
      team2Standing.pointsFor += match.team2Score;
      team2Standing.pointsAgainst += match.team1Score;
      
      if (match.team1Score > match.team2Score) {
        team1Standing.wins++;
        team2Standing.losses++;
      } else {
        team2Standing.wins++;
        team1Standing.losses++;
      }
    }
  });
  
  // Calculate point differential and sort
  const standings = Array.from(standingsMap.values()).map(s => ({
    ...s,
    pointDifferential: s.pointsFor - s.pointsAgainst,
  }));
  
  standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.pointDifferential - a.pointDifferential;
  });
  
  return standings;
}
