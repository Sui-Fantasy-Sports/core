export interface MatchType {
  matchId: string; // Unique identifier for the match
  name: string; // Match name (e.g., "TestMatch")
  players: string[]; // List of players (e.g., ["Player1", "Player2"])
  tiers: number[]; // Player tiers (e.g., [1, 2])
  startTime: number; // When the match starts (Unix timestamp in seconds)
  status?: 'upcoming' | 'live' | 'completed'; // Match status
}

export interface ContestType {
  contestId: string; // On-chain contest ID (from Sui)
  matchId: string; // Corresponding match ID
  matchName: string; // From Contest.match_name
  playerNames: string[]; // From Contest.player_names
  matchEnded?: boolean; // Whether the match has ended
  seriesId?: string; // Series ID (optional)
}

// Define Team type to match ITeam from matchSquad.ts
export interface Team {
  teamName: string;
  shortname: string;
  img: string;
  players: {
    id: string;
    name: string;
    role: string;
    battingStyle: string;
    bowlingStyle?: string; // Optional, as per IPlayer schema
    country: string;
    playerImg: string;
  }[];
}