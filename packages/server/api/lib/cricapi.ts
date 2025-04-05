import axios from 'axios';

const API_KEY = '034fcfbb-3006-45da-818f-2ce888d9b3fa';
const BASE_URL = 'https://api.cricapi.com/v1/';
const IPL_SERIES_ID = 'd5a498c8-7596-4b93-8ab0-e0efc3345312'; // IPL 2025

export async function fetchAllMatchesFromIPL(): Promise<any[]> {
  try {
    const response = await axios.get(`${BASE_URL}series_info`, {
      params: { apikey: API_KEY, id: IPL_SERIES_ID },
    });

    if (response.data.status !== 'success') {
      throw new Error('Series info API request failed: ' + response.data.info);
    }

    const seriesData = response.data.data || {};
    const matchList = seriesData.matchList || [];
    
    return matchList;
  } catch (error) {
    console.error('Failed to fetch IPL matches from series_info:', error);
    return [];
  }
}

export async function fetchMatchSquad(matchId: string): Promise<string[]> {
  try {
    const response = await axios.get(`${BASE_URL}match_squad`, {
      params: { apikey: API_KEY, id: matchId },
    });

    if (response.data.status !== 'success') {
      throw new Error('Squad API request failed: ' + response.data.info);
    }

    const squadData = response.data.data || [];


    const players = squadData.flatMap((team: any) =>
      team.players.map((p: any) => p.name)
    );

    if (players.length === 0) {
      console.warn(`No players found in squad data for match ${matchId}`);
    }

    return players;
  } catch (error) {
    console.error(`Failed to fetch squad for match ${matchId}:`, error);
    return [];
  }
}

export async function fetchFantasyPoints(matchId: string): Promise<any> {
  try {
    const response = await axios.get(`${BASE_URL}fantasy`, {
      params: { apikey: API_KEY, id: matchId },
    });
    if (response.data.status !== 'success') {
      throw new Error('Fantasy API request failed: ' + response.data.info);
    }
    return response.data.data || {};
  } catch (error) {
    console.error(`Failed to fetch fantasy points for match ${matchId}:`, error);
    return {};
  }
}