import axios from "axios";

const API_KEY = '7f3f7ef3-9264-4e1e-aef0-56d89dc5f3fa';
const BASE_URL = 'https://api.cricapi.com/v1/';
const IPL_SERIES_ID = 'd5a498c8-7596-4b93-8ab0-e0efc3345312'; // IPL 2025

// Fetch all matches (limited to 4)
async function fetchAllMatchesFromIPL(): Promise<any[]> {
  try {
    const response = await axios.get(`${BASE_URL}series_info`, {
      params: { apikey: API_KEY, id: IPL_SERIES_ID },
    });

    if (response.data.status !== 'success') {
      throw new Error('Series info API request failed: ' + response.data.info);
    }

    const seriesData = response.data.data || {};
    const matchList = seriesData.matchList || [];

    const limitedMatches = matchList.slice(0, 2); // Fetch only 2 matches
    console.log(`Fetched ${limitedMatches.length} IPL matches.`);
    return limitedMatches;
  } catch (error) {
    console.error('Failed to fetch IPL matches:', error);
    return [];
  }
}

async function fetchMatchSquad(matchId: string): Promise<Record<string, string[]>> {
  try {
    const response = await axios.get(`${BASE_URL}match_squad`, {
      params: { apikey: API_KEY, id: matchId },
    });

    if (response.data.status !== 'success') {
      throw new Error('Squad API request failed: ' + response.data.info);
    }

    const squadData = response.data.data || [];

    console.log(`\nDebugging squad data for match ${matchId}:`, JSON.stringify(squadData, null, 2));

    const teamPlayers: Record<string, string[]> = {};

    squadData.forEach((team: any) => {
      const teamName = team.teamInfo?.name || team.name; // Check both possible keys
      if (teamName) {
        teamPlayers[teamName] = team.players.map((p: any) => p.name);
      } else {
        console.warn(`Warning: Team name not found for match ${matchId}`);
      }
    });

    return teamPlayers;
  } catch (error) {
    console.error(`Failed to fetch squad for match ${matchId}:`, error);
    return {};
  }
}

async function fetchMatchesWithSquads() {
  const matches = await fetchAllMatchesFromIPL();

  for (const match of matches) {
    console.log(`\nMatch: ${match.name}`);

    const squad = await fetchMatchSquad(match.id);
    if (Object.keys(squad).length === 0) {
      console.warn(`Warning: No squad data available for match ${match.id}`);
      continue;
    }

    Object.entries(squad).forEach(([team, players]) => {
      console.log(`Team: ${team}`);
      console.log(`Players: ${players.join(', ')}`);
    });
  }
}

fetchMatchesWithSquads();