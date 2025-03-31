// packages/server/data/contests.ts
export interface Match {
    matchId: string; // Unique identifier for the match
    name: string; // Match name (e.g., "TestMatch")
    players: string[]; // List of players (e.g., ["Player1"])
    tiers: number[]; // Player tiers (e.g., [1])
    startTime: number; // When the match starts (for filtering)
  }
  
  export interface Contest {
    matchId: string; // Corresponding match ID
    contestId: string; // On-chain contest ID (from Sui)
  }