export interface Match {
  matchId: string; // Unique identifier for the match
  name: string; // Match name (e.g., "TestMatch")
  players: string[]; // List of players (e.g., ["Player1", "Player2"])
  tiers: number[]; // Player tiers (e.g., [1, 2])
  startTime: number; // When the match starts (Unix timestamp in seconds)
  teams:string[];
}

export interface Contest {
  matchId: string; // Corresponding match ID
  contestId: string; // On-chain contest ID (from Sui)
  matchName: string; // From Contest.match_name
  playerNames: string[]; // From Contest.player_names
}
