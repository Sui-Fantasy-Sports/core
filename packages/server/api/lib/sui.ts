import { suiClient } from '../sui/client';
import { Contest } from './types/index';

export async function fetchContestDetails(contestId: string): Promise<Contest> {
  const contest = await suiClient.getObject({
    id: contestId,
    options: { showContent: true },
  });
  if (!contest.data || !contest.data.content) {
    throw new Error(`Contest object with ID ${contestId} not found`);
  }
  const content = contest.data.content as any;
  return {
    matchId: content.fields.match_id || "",
    contestId,
    matchName: content.fields.match_name || "",
    playerNames: content.fields.player_names || [],
  };
}