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
  const poolBalance = content.fields.pool?.fields?.value ? parseInt(content.fields.pool.fields.value) : 0;
  const feeBalance = content.fields.fee_controller?.fields?.value ? parseInt(content.fields.fee_controller.fields.value) : 0;
  return {
    matchId: "",
    contestId,
    matchName: content.fields.match_name || "",
    playerNames: content.fields.player_names || [],
    playerTiers: content.fields.player_tiers || [],
    startTime: content.fields.start_time ? parseInt(content.fields.start_time) : 0,
    matchEnded: content.fields.match_ended || false,
    poolBalance,
    feeBalance,
    playerNftCounts: content.fields.player_nft_counts?.map((count: string) => parseInt(count)) || [],
    totalNftCount: content.fields.total_nft_count ? parseInt(content.fields.total_nft_count) : 0,
    redeemValues: content.fields.redeem_values?.map((value: string) => parseInt(value)) || [],
  };
}