export interface Match {
    matchId: string; // Unique identifier for the match
    name: string; // Match name (e.g., "TestMatch")
    players: string[]; // List of players (e.g., ["Player1", "Player2"])
    tiers: number[]; // Player tiers (e.g., [1, 2])
    startTime: number; // When the match starts (for filtering)
  }
  
  export interface Contest {
    matchId: string; // Corresponding match ID
    contestId: string; // On-chain contest ID (from Sui)
    matchName: string; // From Contest.match_name
    playerNames: string[]; // From Contest.player_names
    playerTiers: number[]; // From Contest.player_tiers
    startTime: number; // From Contest.start_time
    matchEnded: boolean; // From Contest.match_ended
    poolBalance: number; // From Contest.pool
    feeBalance: number; // From Contest.fee_controller
    playerNftCounts: number[]; // From Contest.player_nft_counts
    totalNftCount: number; // From Contest.total_nft_count
    redeemValues: number[]; // From Contest.redeem_values
  }