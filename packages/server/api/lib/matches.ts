// packages/server/lib/matches.ts

import { createContestTransaction } from './sui';
import { Match, Contest } from '../data/contests';

// In-memory storage (replace with a database in production)
let matches: Match[] = [];
let contests: Contest[] = [];
let previousMatches: Match[] = []; // To track previous matches

// Function to fetch matches from an external API
async function fetchMatches(): Promise<Match[]> {
  // For testing, using mock data
  return [
    {
      matchId: "match4",
      name: "TestMatch3",
      players: ["Playerf", "Player2"],
      tiers: [1, 2],
      startTime: Math.floor(Date.now() / 1000),
    },
    {
      matchId: "match2",
      name: "TestMatch2",
      players: ["Player3", "Player4"],
      tiers: [1, 1],
      startTime: Math.floor(Date.now() / 1000) + 3600,
    },
    {
        matchId: "match5",
        name: "TestMatch2",
        players: ["Player3", "Player4"],
        tiers: [1, 1],
        startTime: Math.floor(Date.now() / 1000) + 3600,
      },
  ];
}

// Function to check if a contest exists for a match
function hasContest(matchId: string): boolean {
  return contests.some((contest) => contest.matchId === matchId);
}

// Function to check if a match is new (not in previous matches)
function isNewMatch(match: Match, previousMatches: Match[]): boolean {
  return !previousMatches.some((prevMatch) => prevMatch.matchId === match.matchId);
}

// Function to create a contest for a match
async function createContestForMatch(match: Match): Promise<void> {
  try {
    console.log(`Creating contest for match: ${match.name} (${match.matchId})`);
    const output = await createContestTransaction(
      match.name,
      match.players,
      match.tiers,
      match.startTime
    );
    contests.push({
      matchId: match.matchId,
      contestId: output.digest,
    });
    console.log(`Contest created for match ${match.matchId}: ${output.digest}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to create contest for match ${match.matchId}:`, error.message);
    } else {
      console.error(`Failed to create contest for match ${match.matchId}:`, error);
    }
  }
}

// Main function to sync matches and create contests for new matches
export async function syncMatchesAndCreateContests(): Promise<void> {
  console.log('Syncing matches...');
  const newMatches = await fetchMatches();
  console.log('Fetched matches:', newMatches);

  // Identify new matches by comparing with previousMatches
  const newMatchesToProcess = newMatches.filter((match) =>
    isNewMatch(match, previousMatches) && !hasContest(match.matchId)
  );
  console.log('New matches to process:', newMatchesToProcess);

  // Create contests for new matches
  for (const match of newMatchesToProcess) {
    await createContestForMatch(match);
  }

  // Update matches and previousMatches
  previousMatches = [...matches]; // Store the current matches as previous
  matches = newMatches; // Update matches with the new fetch
  console.log('Updated matches array:', matches);
  console.log(`Sync complete. Total matches: ${matches.length}, Contests: ${contests.length}`);
}

export function getMatches(): Match[] {
  return matches;
}

export function getContests(): Contest[] {
  return contests;
}