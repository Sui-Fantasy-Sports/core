export interface Match {
    matchId: string;
    name: string;
    players: string[];
    tiers: number[];
    startTime: number;
  }
  
  export interface Contest {
    matchId: string;
    contestId: string;
    matchName: string;
    playerNames: string[];
    playerTiers: number[];
    startTime: number;
    matchEnded: boolean;
    poolBalance: number;
    feeBalance: number;
    playerNftCounts: number[];
    totalNftCount: number;
    redeemValues: number[];
  }