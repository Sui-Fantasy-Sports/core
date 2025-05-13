import axios from 'axios';
import env from '../../env'
const API_KEY = env.CRIC_API_KEY
const BASE_URL = 'https://api.cricapi.com/v1/';

export const SUPPORTED_SERIES = [
  { id: 'd5a498c8-7596-4b93-8ab0-e0efc3345312', name: 'IPL 2025', matchType: 'T20' },
  { id: '7124ea9a-d213-4d0e-8f21-5392fb244eb3', name: 'Germany Women tour of Greece, 2025', matchType: 'T20' },
  { id: 'd7f39636-282f-4b75-81da-1570aa9734e6', name: 'Japan T20I series', matchType: 'T20' },
];

export interface CricApiResponse {
  status: string;
  data?: any;
  info?: string;
  seriesId?: string;
}

export async function fetchAllMatchesFromSeries(): Promise<CricApiResponse[]> {
  console.log("Fetching matches for all supported series...");
  const responses: CricApiResponse[] = [];

  for (const series of SUPPORTED_SERIES) {
    try {
      console.log(`Fetching matches for series: ${series.name} (${series.id})`);
      const response = await axios.get(`${BASE_URL}series_info`, {
        params: { apikey: API_KEY, id: series.id },
      });
      responses.push({ ...response.data, seriesId: series.id });
      console.log(`Response for ${series.name}:`, response.data);
    } catch (error) {
      console.error(`Failed to fetch matches for series ${series.name}:`, error);
      responses.push({ status: 'error', info: (error as Error).message, seriesId: series.id });
    }
  }

  return responses;
}

export async function fetchMatchSquad(matchId: string): Promise<CricApiResponse> {
  try {
    const response = await axios.get(`${BASE_URL}match_squad`, {
      params: { apikey: API_KEY, id: matchId },
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch squad for match ${matchId}:`, error);
    return { status: 'error', info: (error as Error).message };
  }
}

export async function fetchFantasyPoints(matchId: string): Promise<CricApiResponse> {
  try {
    const response = await axios.get(`${BASE_URL}fantasy`, {
      params: { apikey: API_KEY, id: matchId },
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch fantasy points for match ${matchId}:`, error);
    return { status: 'error', info: (error as Error).message };
  }
}

export async function fetchMatchInfo(matchId: string): Promise<CricApiResponse> {
  try {
    const response = await axios.get(`${BASE_URL}match_info`, {
      params: { apikey: API_KEY, id: matchId },
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch match info for ${matchId}:`, error);
    return { status: 'error', info: (error as Error).message };
  }
}

export async function fetchPlayerStatsAndTier(playerId: string): Promise<{ playerId: string; stats: any; tier: number }> {
  try {
    const response = await axios.get(`${BASE_URL}players_info`, {
      params: { apikey: API_KEY, id: playerId },
    });
    const data = response.data;
    
    if (data.status !== 'success' || !data.data) {
      throw new Error('Failed to fetch player stats');
    }

    const playerStats = data.data.stats;
    const battingStats = playerStats.filter((s: any) => s.fn === "batting" && s.matchtype === "ipl");
    const bowlingStats = playerStats.filter((s: any) => s.fn === "bowling" && s.matchtype === "ipl");
    const odiRuns = playerStats.find((s: any) => s.fn === "batting" && s.matchtype === "odi" && s.stat === "runs")?.value || 0;
    const t20iRuns = playerStats.find((s: any) => s.fn === "batting" && s.matchtype === "t20i" && s.stat === "runs")?.value || 0;

    const runs = Number(battingStats.find((s: any) => s.stat === "runs")?.value || 0);
    const avg = Number(battingStats.find((s: any) => s.stat === "avg")?.value || 0);
    const sr = Number(battingStats.find((s: any) => s.stat === "sr")?.value || 0);
    const centuries = Number(battingStats.find((s: any) => s.stat === "100s")?.value || 0);
    const fifties = Number(battingStats.find((s: any) => s.stat === "50s")?.value || 0);
    const wickets = Number(bowlingStats.find((s: any) => s.stat === "wkts")?.value || 0);
    const econ = Number(bowlingStats.find((s: any) => s.stat === "econ")?.value || 0);

    const score =
      (runs * 0.1) +
      (avg > 30 ? 10 * (avg - 30) : 0) +
      (sr > 120 ? 1 * (sr - 120) : 0) +
      (centuries * 50) +
      (fifties * 20) +
      (wickets * 25) +
      (econ < 9 ? 10 * (9 - econ) : 0) +
      (odiRuns * 0.05) +
      (t20iRuns * 0.05);

    const tier = score > 2500 ? 1 : score >= 1500 ? 2 : 3;

    return { playerId, stats: data.data, tier };
  } catch (error) {
    console.error(`Failed to fetch stats for player ${playerId}:`, error);
    return { playerId, stats: null, tier: 3 }; // Default to Tier 3 on error
  }
}