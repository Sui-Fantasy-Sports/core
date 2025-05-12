import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import NftCard from "../components/NFTcard";
import Navbar from "./Navbar";
import { fetchPlayerStatsAndTier } from "../../../api/lib/cricapi";

interface Team {
  teamName: string;
  shortname: string;
  img: string;
  players: Player[];
}

interface Player {
  id: string;
  name: string;
  role: string;
  battingStyle: string;
  bowlingStyle?: string;
  country: string;
  playerImg: string;
  tier?: number;
}

export default function MatchPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [matchData, setMatchData] = useState<Team[]>([]);
  const [isMatchCompleted, setIsMatchCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownedNfts, setOwnedNfts] = useState<{ [playerIndex: number]: any[] }>({});
  const packageId = "0x85cd910e9f4dd3720bdbf654d371ad5e2a8b5fbe52064f1c21f4a03682ad1846";

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        const [matchResponse, contestResponse] = await Promise.all([
          fetch(`/api/match-data?contestId=${contestId}`),
          fetch(`http://localhost:5173/api/contests`),
        ]);
        console.log("Match response:", matchResponse);
        console.log("Contest response:", contestResponse);

        if (!matchResponse.ok) throw new Error("Failed to fetch match data");
        if (!contestResponse.ok) throw new Error("Failed to fetch contest data");

        const matchData: Team[] = await matchResponse.json();
        const contests = await contestResponse.json();
        const contest = contests.find((c: any) => c.contestId === contestId);

        // Fetch tiers for each player
        const updatedMatchData = await Promise.all(
          matchData.map(async (team) => ({
            ...team,
            players: await Promise.all(
              team.players.map(async (player) => {
                const { tier } = await fetchPlayerStatsAndTier(player.id);
                return { ...player, tier };
              })
            ),
          }))
        );

        setMatchData(updatedMatchData);
        setIsMatchCompleted(contest?.matchEnded || false);
        console.log("anfusdaufb:",matchData)

        // Fetch owned NFTs for all players
        if (currentAccount && contestId) {
          const nfts = await fetchOwnedNftsForAllPlayers(updatedMatchData, contestId);
          setOwnedNfts(nfts);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load player data.");
      }
    };
    fetchMatchData();
  }, [contestId, currentAccount]);

  const fetchOwnedNftsForAllPlayers = async (teams: Team[], contestId: string) => {
    if (!currentAccount) {
      console.log("No current account, skipping fetchOwnedNftsForAllPlayers");
      return {};
    }

    try {
      console.log("Fetching owned NFTs for address:", currentAccount.address);

      // Fetch all PlayerNFT objects owned by the wallet
      const objects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: `${packageId}::master::PlayerNFT` },
        options: { showContent: true, showType: true },
      });
      console.log("Raw owned objects:", JSON.stringify(objects.data, null, 2));

      if (!objects.data || objects.data.length === 0) {
        console.log("No PlayerNFT objects found for this wallet.");
        return {};
      }

      // Fetch the Contest object to get the player_nft_ids table
      const contest = await suiClient.getObject({
        id: contestId,
        options: { showContent: true },
      });
      if (!contest.data) {
        console.error("Contest data is null for contestId:", contestId);
        return {};
      }
      if (!contest.data.content || !('fields' in contest.data.content)) {
        console.error("Contest content or fields missing for contestId:", contestId, "Content:", contest.data);
        return {};
      }
      const playerNftIdsTableId = (contest.data.content as any).fields.player_nft_ids.fields.id.id;
      console.log("player_nft_ids table ID:", playerNftIdsTableId);

      // Fetch all entries in player_nft_ids table
      const playerNftIds = await suiClient.getDynamicFields({
        parentId: playerNftIdsTableId,
      });
      console.log("player_nft_ids entries:", JSON.stringify(playerNftIds.data, null, 2));

      // Create a map of NFT ID to playerIndex
      const nftIdToPlayerIndex: { [key: string]: number } = {};
      for (const entry of playerNftIds.data) {
        const field = await suiClient.getObject({
          id: entry.objectId,
          options: { showContent: true },
        });
        console.log("Dynamic field object:", JSON.stringify(field.data, null, 2));
        const nftId = (entry.name as any).value;
        const playerIdx = Number((field.data?.content as any)?.fields?.value ?? -1);
        nftIdToPlayerIndex[nftId] = playerIdx;
        console.log(`NFT ${nftId} maps to playerIndex ${playerIdx}`);
      }

      // Organize NFTs by playerIndex
      const nftsByPlayerIndex: { [playerIndex: number]: any[] } = {};
      objects.data.forEach((obj) => {
        const nftId = obj.data?.objectId;
        const playerIdx = nftId ? nftIdToPlayerIndex[nftId] ?? -1 : -1;
        if (playerIdx === -1) return;

        if (!nftsByPlayerIndex[playerIdx]) {
          nftsByPlayerIndex[playerIdx] = [];
        }
        nftsByPlayerIndex[playerIdx].push({
          id: nftId,
          redeemValue: Number((obj.data?.content as any)?.fields?.redeem_value ?? 0),
        });
      });

      return nftsByPlayerIndex;
    } catch (error) {
      console.error("Failed to fetch owned NFTs for all players:", error);
      return {};
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <div className="p-6">
        {error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : matchData.length > 0 ? (
          <>
            <h1 className="text-4xl font-bold text-center mb-8">
              {matchData[0].teamName} vs {matchData[1]?.teamName || "TBD"}
            </h1>
            <div className="space-y-12 max-w-6xl mx-auto">
              {matchData.map((team, teamIndex) => (
                <div key={team.teamName} className="bg-gray-900 rounded-lg p-6 shadow-lg">
                  <div className="flex items-center space-x-4 mb-6">
                    <img src={team.img} alt={team.shortname} className="w-16 h-16 object-contain" />
                    <h2 className="text-2xl font-semibold">
                      {team.teamName} ({team.shortname})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {team.players.map((player, playerIndex) => {
                      const globalPlayerIndex = teamIndex * 11 + playerIndex;
                      return (
                        <NftCard
                          key={player.id}
                          player={player}
                          teamName={team.teamName}
                          contestId={contestId || ""}
                          playerIndex={globalPlayerIndex}
                          playerName={player.name}
                          packageId={packageId}
                          isMatchCompleted={isMatchCompleted}
                          tier={player.tier || 3}
                          ownedNfts={ownedNfts[globalPlayerIndex] || []}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-10">Loading player data...</div>
        )}
      </div>
    </div>
  );
}