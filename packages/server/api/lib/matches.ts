// ../server/api/lib/matches.ts
import { connectDB } from './mongoose';
import { Contest, IContest } from '../data/contests';
import { Match, IMatch } from '../data/match';
import { MatchSquad } from '../data/matchSquad';
import { fetchAllMatchesFromIPL, fetchMatchSquad, fetchFantasyPoints } from './cricapi';
import { createContestTransaction, endMatchTransaction, rebalanceContestTransaction } from '../sui';
import { suiClient } from '../sui/client';
import { fetchContestDetails } from './sui';
import { Match as MatchType, Contest as ContestType } from './types';

// In-memory cache (optional, can remove if fully DB-driven)
let matches: MatchType[] = [];
let contests: ContestType[] = [];
let previousMatches: MatchType[] = [];

function hasContest(matchId: string): boolean {
  return contests.some((c) => c.matchId === matchId);
}

function isNewMatch(match: MatchType, prevMatches: MatchType[]): boolean {
  return !prevMatches.some((prev) => prev.matchId === match.matchId);
}

async function createContestForMatch(match: MatchType): Promise<void> {
  console.log(`Creating contest for match: ${match.name} (${match.matchId})`);
  const output = await createContestTransaction(match.name, match.players, match.tiers, match.startTime);
  const contestId = output.objectChanges?.find((c: any) => c.type === 'created' && c.objectType.includes('::master::Contest'))?.objectId;
  if (!contestId) throw new Error('Failed to find Contest object ID');
  await suiClient.waitForTransaction({ digest: output.digest });
  const contestDetails = await fetchContestDetails(contestId);
  const contest: ContestType = {
    contestId,
    matchId: match.matchId,
    matchName: match.name,
    playerNames: match.players,
  };
  contests.push(contest);

  try {
    await Contest.create({
      contestId,
      matchId: match.matchId,
      matchName: match.name,
      playerNames: match.players,
      playerTiers: match.tiers,
      startTime: match.startTime,
      matchEnded: false,
    });
    console.log(`Contest saved to DB: ${contestId}`);
  } catch (error) {
    console.error(`Failed to save contest ${contestId} to DB:`, error);
    throw error;
  }
}

export async function syncMatchesAndCreateContests(): Promise<void> {
  await connectDB();
  console.log('Syncing IPL 2025 matches for the next 1 day...');
const rawResponse = await fetchAllMatchesFromIPL();

if (rawResponse.status !== 'success' || !rawResponse.data?.matchList) {
  console.log('Failed to fetch matches or invalid response:', rawResponse.info);
  return;
}

// 🕐 Get today 00:00 and tomorrow 23:59:59
const nowDate = new Date();
const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
const endOfTomorrow = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + 2).getTime() - 1;

// ✅ Get today's matches (regardless of started or not)
const todayMatches = rawResponse.data.matchList.filter((m: any) => {
  const matchTime = new Date(m.dateTimeGMT).getTime();
  return matchTime >= startOfToday && matchTime <= startOfToday + 24 * 60 * 60 * 1000 - 1;
});
console.log("✅ Today's Matches:", todayMatches);

// ✅ Get upcoming matches that have not started (today + tomorrow)
const upcomingMatches = rawResponse.data.matchList.filter((m: any) => {
  const matchTime = new Date(m.dateTimeGMT).getTime();
  return !m.matchStarted && matchTime >= startOfToday && matchTime <= endOfTomorrow;
});
console.log("⏳ Upcoming Matches (today + tomorrow, not started):", upcomingMatches);

  if (upcomingMatches.length === 0) {
    console.log('No IPL matches found in the next 1 day.');
    return;
  }
  
  const newMatches: MatchType[] = [];
  console.log(`Found ${upcomingMatches.length} upcoming matches.`);
  for (const m of upcomingMatches) {
    const squadResponse = await fetchMatchSquad(m.id);
    let team1Players: string[] = [];
    let team2Players: string[] = [];
    if (squadResponse.status === 'success' && squadResponse.data?.length === 2) {
      team1Players = squadResponse.data[0].players?.map((p: any) => p.name) || [];
      team2Players = squadResponse.data[1].players?.map((p: any) => p.name) || [];
    } else {
      const teams = m.teamInfo?.map((t: any) => t.name) || m.teams || [];
      team1Players = teams[0] ? [teams[0]] : [];
      team2Players = teams[1] ? [teams[1]] : [];
    }
    const allPlayers = [...team1Players, ...team2Players];
    const match: MatchType = {
      matchId: m.id,
      name: m.name,
      players: allPlayers,
      tiers: Array(allPlayers.length).fill(1),
      startTime: Math.floor(new Date(m.dateTimeGMT).getTime() / 1000),
    };

    if (isNewMatch(match, previousMatches) && !hasContest(match.matchId)) {
      try {
        console.log("Saving new match...");
        await Match.create({
          matchId: m.id,
          name: m.name,
          team1Players,
          team2Players,
          tiers: Array(allPlayers.length).fill(1),
          startTime: match.startTime,
          status: 'upcoming',
          dateTimeGMT: m.dateTimeGMT,
        });
        console.log(`Match saved to DB: ${m.id}`);

        if (squadResponse.status === 'success' && squadResponse.data?.length === 2) {
          await MatchSquad.create({
            matchId: m.id,
            teams: squadResponse.data,
            fetchedAt: new Date(),
          });
          console.log(`Squad data saved for match: ${m.id}`);
        }

        await createContestForMatch(match);
      } catch (error) {
        console.error(`Failed to process match ${match.matchId}:`, error);
      }
    }
    newMatches.push(match);
  }

  previousMatches = [...matches];
  matches = newMatches;
  console.log(`Sync complete. Matches: ${matches.length}, Contests: ${contests.length}`);
}

// server/api/lib/matches.ts
export async function checkAndCompleteContests(): Promise<void> {
  await connectDB();
  console.log('Checking for ended IPL matches...');
  const rawResponse = await fetchAllMatchesFromIPL();

  if (rawResponse.status !== 'success') {
    console.log('Failed to fetch matches:', rawResponse.info);
    return;
  }

  const dbContests = await Contest.find({ matchEnded: false }).lean().exec();
  for (const contest of dbContests) {
    const apiMatch = rawResponse.data.matchList.find((m: any) => m.id === contest.matchId);
    if (!apiMatch) continue;

    const matchEnded = apiMatch.matchEnded || apiMatch.status?.includes('won') || apiMatch.status?.includes('No result');
    if (matchEnded) {
      try {
        const contestType: ContestType = {
          contestId: contest.contestId,
          matchId: contest.matchId,
          matchName: contest.matchName,
          playerNames: contest.playerNames,
        };
        await endMatch(contestType);
        await rebalanceContest(contestType);
        await Contest.findOneAndUpdate(
          { contestId: contest.contestId },
          { matchEnded: true },
          { new: true }
        );
        await Match.findOneAndUpdate(
          { matchId: contest.matchId },
          { status: 'completed' },
          { new: true }
        );
        console.log(`Contest ${contest.contestId} for ${contest.matchName} completed and updated in DB`);
      } catch (error) {
        console.error(`Failed to end/rebalance ${contest.contestId}:`, error);
      }
    }
  }
}

export async function getMatches(): Promise<MatchType[]> {
  await connectDB();
  const dbMatches = await Match.find().lean().exec();
  return dbMatches.map((m) => ({
    matchId: m.matchId,
    name: m.name,
    players: [...m.team1Players, ...m.team2Players],
    tiers: m.tiers,
    startTime: m.startTime,
    status: m.status, // Include status
  })) as MatchType[];
}

export async function getContests(): Promise<ContestType[]> {
  await connectDB();
  const dbContests = await Contest.find().lean().exec();
  return dbContests.map((c) => ({
    contestId: c.contestId,
    matchId: c.matchId,
    matchName: c.matchName,
    playerNames: c.playerNames,
    matchEnded: c.matchEnded, // Include matchEnded
  })) as ContestType[];
}

export async function getContestDetails(contestId: string): Promise<ContestType> {
  await connectDB();
  const contest = await Contest.findOne({ contestId }).lean() as ContestType;
  if (!contest) throw new Error('Contest not found');
  const match = (await getMatches()).find((m) => m.matchId === contest.matchId);
  return { ...contest, matchId: match?.matchId || '', matchName: match?.name || contest.matchName };
}

// server/api/lib/matches.ts
export async function getMatchData(contestId?: string): Promise<Team[]> {
  await connectDB();

  if (contestId) {
    const contest = await Contest.findOne({ contestId }).lean().exec();
    if (!contest) throw new Error("Contest not found");

    const match = await Match.findOne({ matchId: contest.matchId }).lean().exec();
    if (!match) throw new Error(`Match not found for matchId: ${contest.matchId}`);

    const matchSquad = await MatchSquad.findOne({ matchId: contest.matchId }).lean().exec();
    if (matchSquad) {
      console.log(`Returning squad data for match: ${contest.matchId}`);
      return matchSquad.teams as Team[];
    }

    // Fallback to Match data if no squad is available
    const teams = match.name.split(" vs ");
    console.log(`Falling back to match data for ${contest.matchId}:`, teams);
    return [
      {
        teamName: teams[0],
        shortname: teams[0].slice(0, 3).toUpperCase(),
        img: "https://h.cricapi.com/img/icon512.png",
        players: match.team1Players.map((name: string, index: number) => ({
          id: `${match.matchId}-1-${index}`,
          name,
          role: "Unknown",
          battingStyle: "Unknown",
          bowlingStyle: "Unknown",
          country: "Unknown",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        })),
      },
      {
        teamName: teams[1] || "TBD",
        shortname: teams[1]?.slice(0, 3).toUpperCase() || "TBD",
        img: "https://h.cricapi.com/img/icon512.png",
        players: match.team2Players.map((name: string, index: number) => ({
          id: `${match.matchId}-2-${index}`,
          name,
          role: "Unknown",
          battingStyle: "Unknown",
          bowlingStyle: "Unknown",
          country: "Unknown",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        })),
      },
    ];
  }

  // Fallback for no contestId (shouldn’t happen in MatchPage.tsx)
  const matchSquad = await MatchSquad.findOne({}).sort({ fetchedAt: -1 }).lean().exec();
  if (matchSquad) {
    return matchSquad.teams as Team[];
  }

  const dbMatches = await Match.find({ status: "upcoming" }).limit(1).lean().exec();
  if (dbMatches.length > 0) {
    const match = dbMatches[0];
    const teams = match.name.split(" vs ");
    return [
      {
        teamName: teams[0],
        shortname: teams[0].slice(0, 3).toUpperCase(),
        img: "https://h.cricapi.com/img/icon512.png",
        players: match.team1Players.map((name: string, index: number) => ({
          id: `${match.matchId}-1-${index}`,
          name,
          role: "Unknown",
          battingStyle: "Unknown",
          bowlingStyle: "Unknown",
          country: "Unknown",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        })),
      },
      {
        teamName: teams[1] || "TBD",
        shortname: teams[1]?.slice(0, 3).toUpperCase() || "TBD",
        img: "https://h.cricapi.com/img/icon512.png",
        players: match.team2Players.map((name: string, index: number) => ({
          id: `${match.matchId}-2-${index}`,
          name,
          role: "Unknown",
          battingStyle: "Unknown",
          bowlingStyle: "Unknown",
          country: "Unknown",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        })),
      },
    ];
  }

  return [];
}
async function endMatch(contest: ContestType): Promise<void> {
  console.log(`Ending match: ${contest.matchId} (${contest.contestId})`);
  const output = await endMatchTransaction(contest.contestId);
  await suiClient.waitForTransaction({ digest: output.digest });
  console.log(`Match ended: ${contest.contestId}`);
}

async function rebalanceContest(contest: ContestType): Promise<void> {
  console.log(`Rebalancing contest: ${contest.matchId} (${contest.contestId})`);
  const fantasyResponse = await fetchFantasyPoints(contest.matchId);
  const playerScores = contest.playerNames.map((name) => {
    const player = fantasyResponse.data?.players?.find((p: any) => p.name === name);
    return player?.points || 0;
  });
  const output = await rebalanceContestTransaction(contest.contestId, playerScores);
  await suiClient.waitForTransaction({ digest: output.digest });
  console.log(`Contest rebalanced: ${contest.contestId} with scores:`, playerScores);
}

export default {
  syncMatchesAndCreateContests,
  checkAndCompleteContests,
  getMatches,
  getContests,
  getContestDetails,
  getMatchData,
};