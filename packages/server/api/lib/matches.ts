// matches.ts
import { connectDB } from './mongoose';
import { Contest, IContest } from '../data/contests';
import { Match, IMatch } from '../data/match';
import { MatchSquad, IMatchSquad } from '../data/matchSquad';
import { Player, IPlayer } from '../data/player';
import { FantasyPoints, IFantasyPoints } from '../data/fantasyPoints';
import { fetchAllMatchesFromSeries, fetchMatchSquad, fetchFantasyPoints, fetchPlayerStatsAndTier, fetchMatchInfo, SUPPORTED_SERIES } from './cricapi';
import { createContestTransaction, endMatchTransaction, rebalanceContestTransaction } from '../sui';
import { suiClient } from '../sui/client';
import { fetchContestDetails } from './sui';
import { MatchType, ContestType, Team } from './types';
import AsyncLock from 'async-lock';

// Define the structure of SuiObjectResponse for suiClient.getObject
interface SuiObjectResponse {
  error?: { code: string; message: string };
  data?: {
    content?: {
      fields: {
        match_ended: boolean;
        [key: string]: any;
      };
      [key: string]: any;
    };
    [key: string]: any;
  } | null;
}

const lock = new AsyncLock();

async function createContestForMatch(match: MatchType, seriesId: string): Promise<void> {
  console.log(`Creating contest for match: ${match.name} (${match.matchId}) in series ${seriesId}`);

  const existingContest = await Contest.findOne({ matchId: match.matchId }).lean<IContest>().exec();
  if (existingContest) {
    console.log(`Contest already exists for match ${match.matchId} with contestId: ${existingContest.contestId}, skipping creation...`);
    return;
  }

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
    seriesId,
  };

  try {
    await Contest.create({
      contestId,
      matchId: match.matchId,
      matchName: match.name,
      playerNames: match.players,
      playerTiers: match.tiers,
      startTime: match.startTime,
      matchEnded: false,
      seriesId,
    });
    console.log(`Contest saved to DB: ${contestId}`);
  } catch (error: any) {
    if (error.code === 11000) {
      console.log(`Contest ${contestId} already exists in DB, skipping save...`);
    } else {
      console.error(`Failed to save contest ${contestId} to DB:`, error);
      throw error;
    }
  }
}

export async function syncMatchesAndCreateContests(): Promise<void> {
  await lock.acquire('syncMatches', async () => {
    await connectDB();
    console.log('Syncing matches for all supported series...');

    const rawResponses = await fetchAllMatchesFromSeries();
    const nowDate = new Date();
    const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
    const endOfTomorrow = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + 2).getTime() - 1;

    for (const rawResponse of rawResponses) {
      const seriesId = rawResponse.seriesId;
      const series = SUPPORTED_SERIES.find(s => s.id === seriesId);
      if (!series) {
        console.log(`Series not found for seriesId: ${seriesId}`);
        continue;
      }

      if (rawResponse.status !== 'success' || !rawResponse.data?.matchList) {
        console.log(`Failed to fetch matches for series ${series.name}:`, rawResponse.info);
        continue;
      }

      const todayMatches = rawResponse.data.matchList.filter((m: any) => {
        const matchTime = new Date(m.dateTimeGMT).getTime();
        return matchTime >= startOfToday && matchTime <= startOfToday + 24 * 60 * 60 * 1000 - 1;
      });
      console.log(`✅ Today's Matches for ${series.name}:`, todayMatches);

      const upcomingMatches = rawResponse.data.matchList.filter((m: any) => {
        const matchTime = new Date(m.dateTimeGMT).getTime();
        return !m.matchStarted && matchTime >= startOfToday && matchTime <= endOfTomorrow;
      });
      console.log(`⏳ Upcoming Matches for ${series.name} (today + tomorrow, not started):`, upcomingMatches);

      if (upcomingMatches.length === 0) {
        console.log(`No upcoming matches found for ${series.name} in the next 1 day.`);
        continue;
      }

      console.log(`Found ${upcomingMatches.length} upcoming matches for ${series.name}.`);
      for (const m of upcomingMatches) {
        if (!m.name || typeof m.name !== 'string') {
          console.error(`Invalid match name for matchId: ${m.id}. Name: ${m.name}. Skipping match.`);
          continue;
        }

        const squadResponse = await fetchMatchSquad(m.id);
        let team1Players: string[] = [];
        let team2Players: string[] = [];
        let allPlayers: string[] = [];
        let playerTiers: number[] = [];

        if (squadResponse.status === 'success' && squadResponse.data?.length === 2) {
          team1Players = squadResponse.data[0].players?.map((p: any) => p.name) || [];
          team2Players = squadResponse.data[1].players?.map((p: any) => p.name) || [];
          allPlayers = [...team1Players, ...team2Players];

          const playerMap: { [key: string]: string } = {};
          for (const team of squadResponse.data) {
            for (const player of team.players) {
              playerMap[player.name] = player.id;
            }
          }

          playerTiers = [];
          for (const playerName of allPlayers) {
            const playerId = playerMap[playerName];
            if (!playerId) {
              console.warn(`Player ID not found for ${playerName}, defaulting to Tier 3`);
              playerTiers.push(3);
              continue;
            }

            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            let playerRecord = await Player.findOne({ playerId, lastUpdated: { $gte: sevenDaysAgo } }).lean<IPlayer>().exec();

            if (playerRecord) {
              console.log(`Using cached data for ${playerName}: Tier ${playerRecord.tier}`);
              playerTiers.push(playerRecord.tier);
            } else {
              const { tier, stats } = await fetchPlayerStatsAndTier(playerId);
              console.log(`${playerName} assigned Tier: ${tier}`);

              await Player.findOneAndUpdate(
                { playerId },
                {
                  playerId,
                  name: playerName,
                  stats,
                  tier,
                  lastUpdated: new Date(),
                },
                { upsert: true, new: true }
              );
              console.log(`Saved tier and stats for ${playerName} to DB`);

              playerTiers.push(tier);
            }
          }
        } else {
          const teams = m.teamInfo?.map((t: any) => t.name) || m.teams || [];
          team1Players = teams[0] ? [teams[0]] : [];
          team2Players = teams[1] ? [teams[1]] : [];
          allPlayers = [...team1Players, ...team2Players];
          playerTiers = Array(allPlayers.length).fill(3);
          console.warn('Failed to fetch squad, defaulting all players to Tier 3');
        }

        const match: MatchType = {
          matchId: m.id,
          name: m.name,
          players: allPlayers,
          tiers: playerTiers,
          startTime: Math.floor(new Date(m.dateTimeGMT).getTime() / 1000),
          seriesId: seriesId || 'unknown',
        };

        const existingMatch = await Match.findOne({ matchId: m.id }).lean<IMatch>().exec();
        if (!existingMatch) {
          try {
            console.log("Saving new match...");
            const matchData = {
              matchId: m.id,
              name: m.name,
              team1Players,
              team2Players,
              tiers: playerTiers,
              startTime: match.startTime,
              status: 'upcoming' as const,
              dateTimeGMT: m.dateTimeGMT,
              seriesId,
            };
            console.log("Match data to save:", matchData);
            await Match.create(matchData);
            console.log(`Match saved to DB: ${m.id}`);

            if (squadResponse.status === 'success' && squadResponse.data?.length === 2) {
              await MatchSquad.create({
                matchId: m.id,
                teams: squadResponse.data,
                fetchedAt: new Date(),
              });
              console.log(`Squad data saved for match: ${m.id}`);
            }
          } catch (error: any) {
            console.error(`Failed to save match ${match.matchId} to DB:`, error);
            console.error("Error stack:", error.stack);
            throw error;
          }
        } else {
          console.log(`Match ${m.id} already exists in DB, checking for contest...`);
        }

        const existingContest = await Contest.findOne({ matchId: m.id }).lean<IContest>().exec();
        if (!existingContest) {
          try {
            if (!seriesId) {
              console.error(`Series ID is undefined for match ${match.matchId}, skipping contest creation.`);
              continue;
            }
            await createContestForMatch(match, seriesId);
          } catch (error: any) {
            console.error(`Failed to create contest for match ${match.matchId}:`, error);
            console.error("Error stack:", error.stack);
            throw error;
          }
        } else {
          console.log(`Contest already exists for match ${m.id}, skipping contest creation...`);
        }
      }
    }

    console.log(`Sync complete.`);
  });
}

export async function checkAndCompleteContests(): Promise<void> {
  await connectDB();
  console.log('Checking for ended matches across all series...');
  const rawResponses = await fetchAllMatchesFromSeries();

  const dbContests: IContest[] = await Contest.find({ matchEnded: false }).lean<IContest>().exec();
  for (const contest of dbContests) {
    const rawResponse = rawResponses.find(r => r.seriesId === contest.seriesId);
    if (!rawResponse || rawResponse.status !== 'success') {
      console.log(`Failed to fetch matches for series ${contest.seriesId}:`, rawResponse?.info);
      continue;
    }

    const apiMatch = rawResponse.data.matchList.find((m: any) => m.id === contest.matchId);
    if (!apiMatch) {
      console.log(`Match ${contest.matchId} not found in API response, skipping...`);
      continue;
    }

    const matchEnded = apiMatch.matchEnded || apiMatch.status?.includes('won') || apiMatch.status?.includes('No result');
    console.log(`Match ${contest.matchId} - API matchEnded: ${apiMatch.matchEnded}, status: ${apiMatch.status}, determined as ended: ${matchEnded}`);

    if (matchEnded) {
      const contestType: ContestType = {
        contestId: contest.contestId,
        matchId: contest.matchId,
        matchName: contest.matchName,
        playerNames: contest.playerNames,
        matchEnded: contest.matchEnded,
        seriesId: contest.seriesId,
      };

      const contestObj: SuiObjectResponse = await suiClient.getObject({
        id: contest.contestId,
        options: { showContent: true },
      });

      if (contestObj.error) {
        console.error(`Failed to fetch contest ${contest.contestId} from blockchain:`, contestObj.error);
        continue;
      }

      if (!contestObj.data || !contestObj.data.content) {
        console.error(`Contest ${contest.contestId} data or content is missing from blockchain response`);
        continue;
      }

      const matchEndedOnChain = contestObj.data.content.fields.match_ended;
      console.log(`Contest ${contest.contestId} - match_ended on chain: ${matchEndedOnChain}`);

      if (!matchEndedOnChain) {
        console.log(`Calling endMatch for contest ${contest.contestId}...`);
        const output = await endMatchTransaction(contest.contestId);
        await suiClient.waitForTransaction({ digest: output.digest, options: { showEffects: true } });
        console.log(`endMatch transaction for contest ${contest.contestId} executed with digest: ${output.digest}`);

        const updatedContestObj: SuiObjectResponse = await suiClient.getObject({
          id: contest.contestId,
          options: { showContent: true },
        });

        if (!updatedContestObj.data || !updatedContestObj.data.content) {
          throw new Error(`Failed to fetch updated contest ${contest.contestId} data or content from blockchain`);
        }

        const updatedMatchEnded = updatedContestObj.data.content.fields.match_ended;
        if (!updatedMatchEnded) {
          throw new Error(`Failed to update match_ended for contest ${contest.contestId} on the blockchain`);
        }
        console.log(`Verified: match_ended is now true for contest ${contest.contestId}`);
      } else {
        console.log(`match_ended already true for contest ${contest.contestId}, skipping endMatch...`);
      }

      try {
        const fantasyResponse = await fetchFantasyPoints(contest.matchId);
        if (fantasyResponse.status === 'success' && fantasyResponse.data?.totals) {
          await rebalanceContest(contestType);
          console.log(`Successfully rebalanced contest ${contest.contestId}`);
        } else {
          console.warn(`Fantasy points not available for match ${contest.matchId}, skipping rebalance...`);
          const playerScores = Array(contest.playerNames.length).fill(0);
          const output = await rebalanceContestTransaction(contest.contestId, playerScores);
          await suiClient.waitForTransaction({ digest: output.digest });
          console.log(`Contest ${contest.contestId} rebalanced with default scores (all 0s):`, playerScores);
        }
      } catch (error: any) {
        console.error(`Failed to rebalance contest ${contest.contestId}:`, error);
        try {
          const playerScores = Array(contest.playerNames.length).fill(0);
          const output = await rebalanceContestTransaction(contest.contestId, playerScores);
          await suiClient.waitForTransaction({ digest: output.digest });
          console.log(`Contest ${contest.contestId} rebalanced with default scores (all 0s) after error:`, playerScores);
        } catch (rebalanceError: any) {
          console.error(`Failed to rebalance contest ${contest.contestId} with default scores:`, rebalanceError);
        }
      }

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
    } else {
      console.log(`Match ${contest.matchId} has not ended yet, skipping...`);
    }
  }
}

export async function updateMatchStatuses(): Promise<void> {
  await connectDB();
  console.log('Updating match statuses across all series...');
  const rawResponses = await fetchAllMatchesFromSeries();

  for (const rawResponse of rawResponses) {
    const seriesId = rawResponse.seriesId;
    const series = SUPPORTED_SERIES.find(s => s.id === seriesId);
    if (!series) {
      console.log(`Series not found for seriesId: ${seriesId}`);
      continue;
    }

    if (rawResponse.status !== 'success' || !rawResponse.data?.matchList) {
      console.log(`Failed to fetch matches for series ${series.name}:`, rawResponse.info);
      continue;
    }

    const nowDate = new Date();
    const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
    const endOfTomorrow = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + 2).getTime() - 1;

    const relevantMatches = rawResponse.data.matchList.filter((m: any) => {
      const matchTime = new Date(m.dateTimeGMT).getTime();
      return matchTime >= startOfToday && matchTime <= endOfTomorrow;
    });
    console.log(`Found ${relevantMatches.length} relevant matches for ${series.name} to update.`);

    for (const apiMatch of relevantMatches) {
      const matchId = apiMatch.id;
      let newStatus: 'completed' | 'live' | 'upcoming';

      const matchInfo = await fetchMatchInfo(matchId);
      if (matchInfo.status === 'success' && matchInfo.data?.status) {
        if (apiMatch.matchEnded || matchInfo.data.status?.includes('won') || matchInfo.data.status?.includes('No result')) {
          newStatus = 'completed';
        } else if (matchInfo.data.status?.includes('In Progress') || matchInfo.data.status?.includes('Innings Break')) {
          newStatus = 'live';
        } else {
          newStatus = 'upcoming';
        }
      } else {
        console.warn(`Failed to fetch detailed info for match ${matchId}, falling back to apiMatch data:`, matchInfo.info);
        if (apiMatch.matchEnded || apiMatch.status?.includes('won') || apiMatch.status?.includes('No result')) {
          newStatus = 'completed';
        } else if (apiMatch.matchStarted) {
          newStatus = 'live';
        } else {
          newStatus = 'upcoming';
        }
      }

      try {
        const existingMatch = await Match.findOne({ matchId }).lean<IMatch>().exec();
        if (existingMatch) {
          await Match.findOneAndUpdate(
            { matchId },
            { status: newStatus, dateTimeGMT: apiMatch.dateTimeGMT },
            { new: true }
          );
          console.log(`Updated status for match ${matchId} to ${newStatus}`);
        } else {
          console.log(`Match ${matchId} not found in DB, skipping status update...`);
        }
      } catch (error: any) {
        console.error(`Failed to update match ${matchId} in DB:`, error);
      }
    }
  }
}

export async function getMatches(seriesId?: string, status?: string): Promise<MatchType[]> {
  await connectDB();
  const query: any = {};
  if (seriesId) query.seriesId = seriesId;
  if (status) query.status = status;
  const dbMatches = await Match.find(query).lean<IMatch[]>().exec();
  console.log(`getMatches - seriesId: ${seriesId}, status: ${status}, found matches:`, dbMatches.map(m => ({
    matchId: m.matchId,
    name: m.name,
    status: m.status,
    seriesId: m.seriesId
  })));
  return dbMatches.map((m) => ({
    matchId: m.matchId,
    name: m.name,
    players: [...m.team1Players, ...m.team2Players],
    tiers: m.tiers,
    startTime: m.startTime,
    status: m.status,
    seriesId: m.seriesId,
  }));
}

export async function getContests(seriesId?: string): Promise<ContestType[]> {
  await connectDB();
  const query = seriesId ? { seriesId } : {};
  const dbContests: IContest[] = await Contest.find(query).lean<IContest>().exec();
  return dbContests.map((c) => ({
    contestId: c.contestId,
    matchId: c.matchId,
    matchName: c.matchName,
    playerNames: c.playerNames,
    matchEnded: c.matchEnded,
    seriesId: c.seriesId,
  }));
}

export async function getContestDetails(contestId: string): Promise<ContestType> {
  await connectDB();
  const contest: IContest | null = await Contest.findOne({ contestId }).lean<IContest>().exec();
  if (!contest) throw new Error('Contest not found');
  const match = (await getMatches()).find((m) => m.matchId === contest.matchId);
  return { ...contest, matchId: match?.matchId || '', matchName: match?.name || contest.matchName, seriesId: contest.seriesId };
}

export async function getMatchData(contestId?: string): Promise<Team[]> {
  await connectDB();

  if (contestId) {
    console.log(`Fetching match data for contestId: ${contestId}`);
    const contest = await Contest.findOne({ contestId }).lean<IContest>().exec();
    if (!contest) {
      console.error(`Contest not found for contestId: ${contestId}`);
      throw new Error("Contest not found");
    }

    const match = await Match.findOne({ matchId: contest.matchId }).lean<IMatch>().exec();
    if (!match) {
      console.error(`Match not found for matchId: ${contest.matchId} in contest ${contestId}`);
      throw new Error(`Match not found for matchId: ${contest.matchId}`);
    }

    const matchSquad = await MatchSquad.findOne({ matchId: contest.matchId }).lean<IMatchSquad>().exec();
    if (matchSquad) {
      console.log(`Returning squad data for match: ${contest.matchId}`);
      const teams = matchSquad.teams as Team[];
      return teams.map((team, teamIndex) => ({
        ...team,
        players: team.players.map((player, index) => ({
          ...player,
          tier: match.tiers[teamIndex * team.players.length + index] || 3,
        })),
      }));
    }

    if (!match.name) {
      console.error(`Match name is undefined for matchId: ${contest.matchId}`);
      throw new Error(`Match name is undefined for matchId: ${contest.matchId}`);
    }

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
          tier: match.tiers[index] || 3,
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
          tier: match.tiers[match.team1Players.length + index] || 3,
        })),
      },
    ];
  }

  const matchSquad = await MatchSquad.findOne({}).sort({ fetchedAt: -1 }).lean<IMatchSquad>().exec();
  if (matchSquad) {
    return matchSquad.teams as Team[];
  }

  const dbMatches = await Match.find({ status: "upcoming" }).limit(1).lean<IMatch>().exec();
  if (dbMatches.length > 0) {
    const match = dbMatches[0];
    if (!match.name) {
      console.error(`Match name is undefined for matchId: ${match.matchId} in fallback`);
      throw new Error(`Match name is undefined for matchId: ${match.matchId}`);
    }

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
          tier: match.tiers[index] || 3,
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
          tier: match.tiers[match.team1Players.length + index] || 3,
        })),
      },
    ];
  }

  console.log("No matches or squads found, returning empty array");
  return [];
}

async function endMatch(contest: ContestType): Promise<void> {
  console.log(`Ending match: ${contest.matchId} (${contest.contestId})`);
  const output = await endMatchTransaction(contest.contestId);
  await suiClient.waitForTransaction({ digest: output.digest, options: { showEffects: true } });
  console.log(`Match ended: ${contest.contestId}, transaction digest: ${output.digest}`);
}

async function rebalanceContest(contest: ContestType): Promise<void> {
  console.log(`Rebalancing contest: ${contest.matchId} (${contest.contestId})`);
  const fantasyResponse = await fetchFantasyPoints(contest.matchId);
  if (fantasyResponse.status !== 'success' || !fantasyResponse.data?.totals) {
    console.error(`Failed to fetch fantasy points for match ${contest.matchId}:`, fantasyResponse.info);
    throw new Error('Failed to fetch fantasy points');
  }

  const fantasyPointsData: IFantasyPoints[] = [];
  for (const player of fantasyResponse.data.totals) {
    const { id: playerId, name: playerName, points: totalPoints } = player;

    const typedPlayerId = String(playerId);
    const typedPlayerName = String(playerName);
    const typedTotalPoints = Number(totalPoints);

    let battingPoints = 0;
    let bowlingPoints = 0;
    let catchingPoints = 0;

    for (const inning of fantasyResponse.data.innings) {
      const batting = inning.batting.find((b: any) => b.id === playerId);
      const bowling = inning.bowling.find((b: any) => b.id === playerId);
      const catching = inning.catching.find((c: any) => c.id === playerId);

      battingPoints += batting?.points || 1;
      bowlingPoints += bowling?.points || 1;
      catchingPoints += catching?.points || 1;
    }

    fantasyPointsData.push({
      matchId: contest.matchId,
      playerId: typedPlayerId,
      playerName: typedPlayerName,
      battingPoints,
      bowlingPoints,
      catchingPoints,
      totalPoints: typedTotalPoints,
      fetchedAt: new Date(),
    });
  }

  try {
    await FantasyPoints.insertMany(fantasyPointsData, { ordered: false });
    console.log(`Saved fantasy points for match ${contest.matchId} to DB`);
  } catch (error: any) {
    if (error.code === 11000) {
      console.log(`Fantasy points for match ${contest.matchId} already exist in DB, updating...`);
      for (const data of fantasyPointsData) {
        await FantasyPoints.findOneAndUpdate(
          { matchId: data.matchId, playerId: data.playerId },
          data,
          { upsert: true }
        );
      }
    } else {
      console.error(`Failed to save fantasy points for match ${contest.matchId}:`, error);
      throw error;
    }
  }

  const playerScores: number[] = [];
  const unmatchedPlayers: string[] = [];

  for (const playerName of contest.playerNames) {
    let player = fantasyResponse.data.totals.find((p: any) => p.name === playerName);

    if (!player) {
      player = fantasyResponse.data.totals.find((p: any) => {
        if (p.altnames) {
          return p.altnames.includes(playerName);
        }
        return false;
      });
    }

    if (player) {
      const points = player.points || 0;
      playerScores.push(points);
    } else {
      unmatchedPlayers.push(playerName);
      playerScores.push(0);
    }
  }

  if (unmatchedPlayers.length > 0) {
    console.warn(`Could not match the following players in fantasy points for match ${contest.matchId}:`, unmatchedPlayers);
  }

  console.log(`Player scores for contest ${contest.contestId}:`, playerScores);
  const output = await rebalanceContestTransaction(contest.contestId, playerScores);
  await suiClient.waitForTransaction({ digest: output.digest });
  console.log(`Contest rebalanced: ${contest.contestId} with scores:`, playerScores);
}

export default {
  syncMatchesAndCreateContests,
  checkAndCompleteContests,
  updateMatchStatuses,
  getMatches,
  getContests,
  getContestDetails,
  getMatchData,
};