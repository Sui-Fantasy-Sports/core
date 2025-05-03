import axios from 'axios';

const API_KEY = '2301f876-9a6e-41ed-82aa-79cf6ce8e28b';
const BASE_URL = 'https://api.cricapi.com/v1/';
const IPL_SERIES_ID = 'd5a498c8-7596-4b93-8ab0-e0efc3345312'; // IPL 2025

export interface CricApiResponse {
  status: string;
  data?: any;
  info?: string;
}

export async function fetchAllMatchesFromIPL(): Promise<CricApiResponse> {
  console.log("apikey :",API_KEY);
  try {
    const response = await axios.get(`${BASE_URL}series_info`, {
      params: { apikey: API_KEY, id: IPL_SERIES_ID },
    });
    return response.data;
    console.log("response :",response.data);
  } catch (error) {
    console.error('Failed to fetch IPL matches from series_info:', error);
    return { status: 'error', info: (error as Error).message };
  }
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