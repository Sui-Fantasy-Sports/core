import { createContestTransaction, endMatchTransaction, rebalanceContestTransaction } from '../sui/index';
import { suiClient } from '../sui/client';
import { fetchAllMatchesFromIPL, fetchMatchSquad, fetchFantasyPoints } from './cricapi';
import { fetchContestDetails } from './sui';
import { Match, Contest } from './types/index';

let matches: Match[] = [];
let contests: Contest[] = [];
let previousMatches: Match[] = [];

function hasContest(matchId: string): boolean {
  return contests.some((contest) => contest.matchId === matchId);
}

function isNewMatch(match: Match, previousMatches: Match[]): boolean {
  return !previousMatches.some((prevMatch) => prevMatch.matchId === match.matchId);
}

async function createContestForMatch(match: Match): Promise<void> {
  console.log(`Creating contest for match: ${match.name} (${match.matchId})`);
  const output = await createContestTransaction(match.name, match.players, match.tiers, match.startTime);
  

  let contestId = "";
  const changes = output.objectChanges || [];


  for (const change of changes) {
    
    if (change.type === "created" && change.objectType.includes("::master::Contest")) {
      contestId = change.objectId;
      console.log(`Found Contest object ID: ${contestId}`);
      break;
    }
  }

  if (!contestId) {
    console.error('No Contest object found in objectChanges. Available types:', 
      changes.map((c: any) => `${c.type}: ${c.objectType}`).join(', '));
    throw new Error("Failed to find Contest object ID");
  }

  await suiClient.waitForTransaction({ digest: output.digest });
  const contestDetails = await fetchContestDetails(contestId);
  contests.push({ ...contestDetails, matchId: match.matchId });
  console.log(`Contest created: ${contestId}`);
}

async function endMatch(contest: Contest): Promise<void> {
  if (contest.matchEnded) return;
  console.log(`Ending match: ${contest.matchId} (${contest.contestId})`);
  const output = await endMatchTransaction(contest.contestId);
  await suiClient.waitForTransaction({ digest: output.digest });
  contest.matchEnded = true;
  console.log(`Match ended: ${contest.contestId}`);
}

async function rebalanceContest(contest: Contest): Promise<void> {
  if (!contest.matchEnded) return;
  console.log(`Rebalancing contest: ${contest.matchId} (${contest.contestId})`);
  const fantasyData = await fetchFantasyPoints(contest.matchId);
  const playerScores = contest.playerNames.map((playerName) => {
    const playerStats = fantasyData?.players?.find((p: any) => p.name === playerName);
    return playerStats?.points || 0;
  });
  const output = await rebalanceContestTransaction(contest.contestId, playerScores);
  await suiClient.waitForTransaction({ digest: output.digest });
  const updatedContest = await fetchContestDetails(contest.contestId);
  Object.assign(contest, updatedContest);
  console.log(`Contest rebalanced: ${contest.contestId} with scores:`, playerScores);
}

export async function syncMatchesAndCreateContests(): Promise<void> {
  console.log("Syncing IPL 2025 matches for the next 2 days...");
  const iplMatches = await fetchAllMatchesFromIPL();
  const now = Date.now();
  const twoDaysFromNow = now + 1 * 24 * 60 * 60 * 1000;

  const upcomingMatches = iplMatches.filter((m) => {
    const matchTime = new Date(m.dateTimeGMT).getTime();
    return !m.matchStarted && matchTime >= now && matchTime <= twoDaysFromNow;
  });

  console.log("Fetched IPL matches:", upcomingMatches);

  if (upcomingMatches.length === 0) {
    console.log("No IPL matches found in the next 2 days.");
    return;
  }

  const newMatches: Match[] = [];
  for (const m of upcomingMatches) {
    const squadPlayers = await fetchMatchSquad(m.id);
    let players = squadPlayers;
    if (squadPlayers.length === 0) {
      console.log(`No squad data for ${m.name}, using team names as fallback`);
      players = m.teamInfo?.map((t: any) => t.name) || m.teams || [];
    }

    const match: Match = {
      matchId: m.id,
      name: m.name,
      players,
      tiers: Array(players.length).fill(1),
      startTime: Math.floor(new Date(m.dateTimeGMT).getTime() / 1000),
    };

    if (isNewMatch(match, previousMatches) && !hasContest(match.matchId)) {
      try {
        await createContestForMatch(match);
        newMatches.push(match);
      } catch (error) {
        console.error(`Failed to create contest for ${match.matchId}:`, error);
      }
    } else {
      newMatches.push(match);
    }
  }

  previousMatches = [...matches];
  matches = newMatches;
  console.log(`Sync complete. Matches: ${matches.length}, Contests: ${contests.length}`);
}

export async function checkAndCompleteContests(): Promise<void> {
  console.log('Checking for ended IPL matches...');
  const iplMatches = await fetchAllMatchesFromIPL();

  for (const contest of contests) {
    const apiMatch = iplMatches.find((m) => m.id === contest.matchId);
    if (!apiMatch) continue;

    const matchEnded = apiMatch.matchEnded || 
                       apiMatch.status?.includes("won") || 
                       apiMatch.status?.includes("No result");
    if (matchEnded && !contest.matchEnded) {
      try {
        await endMatch(contest);
        await rebalanceContest(contest);
        console.log(`Contest ${contest.contestId} for ${contest.matchName} completed successfully`);
      } catch (error) {
        console.error(`Failed to end/rebalance ${contest.contestId}:`, error);
      }
    }
  }
}

export function getMatches(): Match[] {
  return matches;
}

export function getContests(): Contest[] {
  return contests;
}

export async function getContestDetails(contestId: string): Promise<Contest> {
  const contest = await fetchContestDetails(contestId);
  const match = matches.find((m) => contests.some((c) => c.contestId === contestId && c.matchId === m.matchId));
  return { ...contest, matchId: match?.matchId || "" };
}