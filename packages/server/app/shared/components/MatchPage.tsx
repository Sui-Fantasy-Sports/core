// MatchPage.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { SuiClientProvider, WalletProvider, useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import NftCard from "../components/NFTcard";
import Navbar from "./Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

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
  teamName?: string;
}

interface SelectedPlayer extends Player {
  quantity: number;
  tokenAmount?: number;
}

interface Contest {
  contestId: string;
  matchId: string;
  matchName: string;
  playerNames: string[];
  matchEnded: boolean;
  seriesId: string;
}

const GameHeader = ({
  matchTitle,
  teamA,
  teamB,
  timeLeft,
  tokensLeft,
  totalTokens,
  suiSpent,
}: {
  matchTitle: string;
  teamA: string;
  teamB: string;
  timeLeft: string;
  tokensLeft: number;
  totalTokens: number;
  suiSpent: number;
}) => (
  <div className="col-span-full bg-black border border-[#2c2c2c] rounded-lg p-2 xs:p-3 sm:p-4 text-white font-orbitron">
    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 xs:gap-3">
      <div className="flex-1 space-y-1 xs:space-y-2 sm:space-y-3 pr-0 sm:pr-3">
        <div className="shine text-base xs:text-lg sm:text-xl md:text-2xl">{matchTitle}</div>
        <div className="flex items-center space-x-1 xs:space-x-2 text-xs xs:text-sm sm:text-base md:text-lg font-medium">
          <div>{teamA}</div>
          <div className="font-medium text-gray-400 text-[10px] xs:text-xs sm:text-sm">VS</div>
          <div>{teamB}</div>
        </div>
        <div className="text-xs xs:text-sm sm:text-base text-gray-400 flex items-center space-x-1 xs:space-x-2">
          <span>Match starts in:</span>
          <span className="text-[#8b0000] font-semibold">{timeLeft}</span>
        </div>
      </div>
      <div className="w-full sm:w-64 shrink-0 p-1 xs:p-2 sm:p-3 border-t sm:border-t-0 sm:border-l border-neutral-800 space-y-1">
        <div className="text-[10px] xs:text-xs sm:text-sm text-gray-400">Tokens left</div>
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-2 bg-gradient-to-r from-red-400 to-yellow-300"
            style={{ width: `${(tokensLeft / totalTokens) * 100}%` }}
          ></div>
        </div>
        <div className="text-[10px] xs:text-xs sm:text-sm text-gray-400 mt-1">
          {tokensLeft} / {totalTokens}
        </div>
        <div className="text-[10px] xs:text-xs sm:text-sm text-gray-400 mt-2 xs:mt-3">SUI Spent</div>
        <div className="text-xs xs:text-sm sm:text-base text-yellow-400">{suiSpent} SUI</div>
      </div>
    </div>
  </div>
);

const transformMatchData = (matchData: Team[]) => {
  const tiers: { [key: string]: { "TEAM A": Player[]; "TEAM B": Player[] } } = {
    "Tier 1": { "TEAM A": [], "TEAM B": [] },
    "Tier 2": { "TEAM A": [], "TEAM B": [] },
    "Tier 3": { "TEAM A": [], "TEAM B": [] },
  };

  if (matchData.length === 0) {
    console.log("No teams in matchData");
    return tiers;
  }

  if (matchData[0]?.players) {
    matchData[0].players.forEach((player) => {
      const tierKey = `Tier ${player.tier || 3}`;
      if (tiers[tierKey]) {
        tiers[tierKey]["TEAM A"].push({ ...player, teamName: matchData[0].teamName });
      }
    });
  } else {
    console.log("No players for TEAM A");
  }

  if (matchData[1]?.players) {
    matchData[1].players.forEach((player) => {
      const tierKey = `Tier ${player.tier || 3}`;
      if (tiers[tierKey]) {
        tiers[tierKey]["TEAM B"].push({ ...player, teamName: matchData[1].teamName });
      }
    });
  } else {
    console.log("No players for TEAM B");
  }

  console.log("Transformed playerData:", tiers);
  return tiers;
};

const YourSelection = ({ selectedPlayers }: { selectedPlayers: SelectedPlayer[] }) => {
  const totalNFTs = selectedPlayers.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = selectedPlayers.reduce((sum, p) => sum + (p.tokenAmount || 0) * p.quantity, 0);

  return (
    <div className="bg-[#0E0E0E] text-white p-2 xs:p-3 sm:p-4 md:p-5 rounded-xl border border-[#2C2C2C] font-orbitron">
      <h2 className="text-base xs:text-lg sm:text-xl font-medium mb-2 xs:mb-3 sm:mb-4 border-b border-gray-700 pb-2">
        YOUR SELECTION
      </h2>
      {selectedPlayers.length === 0 ? (
        <p className="text-gray-500 text-xs xs:text-sm sm:text-base">No players selected.</p>
      ) : (
        <div className="space-y-2 xs:space-y-3 sm:space-y-4">
          {selectedPlayers.map((p) => (
            <div
              key={p.id}
              className="flex items-center bg-white/5 backdrop-blur-[4px] rounded-xl p-2 xs:p-3 sm:p-4 border border-[#8b0000]"
            >
              <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 bg-gray-700 rounded-lg mr-2 xs:mr-3 sm:mr-4" />
              <div className="flex-1 py-1">
                <div className="font-normal text-white text-xs xs:text-sm sm:text-base py-1 leading-tight">{p.name}</div>
                <div className="text-[10px] xs:text-xs sm:text-sm text-yellow-400 leading-tight">{p.teamName}</div>
                <div className="text-[10px] xs:text-xs sm:text-sm text-gray-400">{p.role}</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="bg-red-600 text-white text-[10px] xs:text-xs sm:text-sm font-bold px-1 xs:px-1.5 sm:px-2 py-0.5 rounded-full">
                  x{p.quantity}
                </div>
                <div className="text-red-400 text-[10px] xs:text-xs sm:text-sm font-semibold mt-1">{p.tokenAmount || 0} SUI</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 xs:mt-4 sm:mt-6 border-t border-gray-700 pt-2 xs:pt-3 sm:pt-4 text-xs xs:text-sm sm:text-base">
        <div className="flex justify-between text-gray-400">
          <span>Total NFTs</span>
          <span>{totalNFTs}</span>
        </div>
        <div className="flex justify-between mt-1 xs:mt-2 text-gray-400">
          <span>Total Value</span>
          <span className="text-yellow-400">{totalValue} SUI</span>
        </div>
      </div>
    </div>
  );
};

const TierTabs = ({
  playerData,
  matchData,
  onSelectPlayer,
  contestId,
  packageId,
  isMatchCompleted,
  ownedNfts,
}: {
  playerData: { [key: string]: { "TEAM A": Player[]; "TEAM B": Player[] } };
  matchData: Team[];
  onSelectPlayer: (player: Player, quantity: number) => void;
  contestId: string;
  packageId: string;
  isMatchCompleted: boolean;
  ownedNfts: { [playerIndex: number]: any[] };
}) => {
  const [activeTeams, setActiveTeams] = useState<{ [tier: string]: string }>({});

  const handleTeamSwitch = (tier: string, team: string) => {
    setActiveTeams((prev) => ({ ...prev, [tier]: team }));
  };

  return (
    <Tabs
      defaultValue="Tier 1"
      orientation="vertical"
      className="flex flex-col sm:grid sm:grid-cols-4 col-span-full gap-1 xs:gap-2 sm:gap-3 p-1 xs:p-2 sm:p-3 z-20 h-auto max-h-[70vh] sm:max-h-[80vh] border border-neutral-800 rounded-lg"
    >
      <div className="col-span-1 self-start bg-black border border-neutral-800 rounded-lg px-1 xs:px-2 sm:px-3 py-1 xs:py-2 sm:py-3 text-white overflow-y-auto max-h-[70vh] sm:max-h-[80vh]">
        <div className="flex items-center gap-1 text-base xs:text-lg sm:text-xl mb-1 xs:mb-2 sm:mb-3 border-b border-gray-700 pb-1 text-white tracking-wide">
          <span>SELECT TIER</span>
        </div>
        <TabsList className="flex flex-col items-start gap-2 xs:gap-3 sm:gap-4 pt-1 xs:pt-2 sm:pt-3 bg-black">
          {["Tier 1", "Tier 2", "Tier 3"].map((tier, index) => (
            <TabsTrigger
              key={tier}
              value={tier}
              className="
                relative w-full justify-start rounded-md border border-neutral-800
                bg-gradient-to-br from-black via-zinc-900 to-black px-1 xs:px-2 sm:px-3 py-1 xs:py-2 sm:py-3 text-white text-base xs:text-lg sm:text-xl
                transition duration-200 hover:brightness-110
                data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:font-semibold"
            >
              <div className="flex flex-col items-start space-y-1">
                <span className="text-white">{tier}</span>
                <span className="text-[10px] xs:text-xs sm:text-sm text-yellow-400">
                  Bet: {index === 0 ? "100 SUI" : index === 1 ? "500 SUI" : "1000 SUI"}
                </span>
              </div>
            </TabsTrigger>
          ))}
          <button
            className="glow-border mt-2 xs:mt-4 sm:mt-6 w-full rounded-md bg-[#8b0000] hover:bg-yellow-500 text-white font-semibold py-1 xs:py-1.5 sm:py-2 text-xs xs:text-sm sm:text-base transition duration-200"
            onClick={() => console.log("Bet Placed")}
          >
            Place Bet
          </button>
        </TabsList>
      </div>
      <div className="col-span-3 backdrop-blur-sm rounded-lg bg-white/10 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto">
        {["Tier 1", "Tier 2", "Tier 3"].map((tier) => {
          const allPlayers = [
            ...(playerData[tier]?.["TEAM A"] || []),
            ...(playerData[tier]?.["TEAM B"] || []),
          ];
          const uniqueTeams = [...new Set(allPlayers.map((p) => p.teamName).filter((team) => team !== undefined))];
          const activeTeam = activeTeams[tier] || (uniqueTeams.length > 0 ? uniqueTeams[0] : "No Team");
          const playersToShow = allPlayers.filter((p) => p.teamName === activeTeam);

          return (
            <TabsContent key={tier} value={tier} className="m-0 p-0">
              <div className="w-full relative">
                <div className="sticky top-0 z-10 flex w-full h-8 xs:h-10 sm:h-12 bg-black/50 backdrop-blur-md border border-[#2C2C2C] rounded-t-lg shadow-md">
                  {uniqueTeams.length > 0 ? (
                    uniqueTeams.map((team, index) => (
                      <button
                        key={team}
                        onClick={() => handleTeamSwitch(tier, team)}
                        className={`flex-1 flex items-center justify-center space-x-1 xs:space-x-2 px-1 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 transition-all duration-200
                          ${team === activeTeam ? "bg-[#8b0000]" : "bg-black hover:bg-[#222]"}
                          ${index === 0 ? "rounded-tl-lg" : index === uniqueTeams.length - 1 ? "rounded-tr-lg" : ""}`}
                      >
                        <span className="text-xs xs:text-sm sm:text-base font-medium text-white tracking-wider">{team}</span>
                      </button>
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 text-xs xs:text-sm sm:text-base">
                      No Teams Available
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 xs:gap-2 sm:gap-3 mt-1 xs:mt-2 sm:mt-3 px-1 xs:px-2 sm:px-3 py-1 min-h-[120px] xs:min-h-[150px] sm:min-h-[200px]">
                  {playersToShow.length > 0 ? (
                    playersToShow.map((p, index) => {
                      const teamIndex = matchData?.length > 0 && p.teamName === matchData[0]?.teamName ? 0 : 1;
                      const baseIndex = tier === "Tier 1" ? 0 : tier === "Tier 2" ? 11 : 22;
                      const globalPlayerIndex = matchData?.length > 0 ? baseIndex + (teamIndex * 11) + index : index;
                      return (
                        <div key={p.id} className="w-full xs:w-[48%] sm:w-[30%] lg:w-[22%]">
                          <NftCard
                            player={p}
                            teamName={p.teamName || "Unknown Team"}
                            contestId={contestId}
                            playerIndex={globalPlayerIndex}
                            playerName={p.name}
                            packageId={packageId}
                            isMatchCompleted={isMatchCompleted}
                            tier={parseInt(tier.split(" ")[1])}
                            ownedNfts={ownedNfts[globalPlayerIndex] || []}
                            onQuantityChange={(qty: number) => onSelectPlayer(p, qty)}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full flex items-center justify-center text-center text-gray-500 font-semibold text-xs xs:text-sm sm:text-base">
                      No players available in {activeTeam} for {tier}.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          );
        })}
      </div>
    </Tabs>
  );
};

const NFTSelectionView = ({
  playerData,
  matchData,
  contestId,
  packageId,
  isMatchCompleted,
  ownedNfts,
}: {
  playerData: { [tier: string]: { "TEAM A": Player[]; "TEAM B": Player[] } };
  matchData: Team[];
  contestId: string;
  packageId: string;
  isMatchCompleted: boolean;
  ownedNfts: { [playerIndex: number]: any[] };
}) => {
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);

  const handleSelectPlayer = (player: Player, quantity: number) => {
    setSelectedPlayers((prev) => {
      const exists = prev.find((p) => p.id === player.id);
      if (quantity === 0) {
        return prev.filter((p) => p.id !== player.id);
      }
      if (exists) {
        return prev.map((p) =>
          p.id === player.id ? { ...p, quantity, tokenAmount: getTokenAmount(p.tier || 3) } : p
        );
      }
      return [...prev, { ...player, quantity, tokenAmount: getTokenAmount(player.tier || 3) }];
    });
  };

  const getTokenAmount = (tier: number) => {
    switch (tier) {
      case 1:
        return 100;
      case 2:
        return 500;
      case 3:
        return 1000;
      default:
        return 1000;
    }
  };

  return (
    <div className="w-full font-orbitron">
      <div className="flex flex-col sm:grid sm:grid-cols-4 gap-1 xs:gap-2 sm:gap-3 pt-1">
        <div className="col-span-full sm:col-span-3">
          <TierTabs
            playerData={playerData}
            matchData={matchData}
            onSelectPlayer={handleSelectPlayer}
            contestId={contestId}
            packageId={packageId}
            isMatchCompleted={isMatchCompleted}
            ownedNfts={ownedNfts}
          />
        </div>
        <div className="col-span-full sm:col-span-1">
          <YourSelection selectedPlayers={selectedPlayers} />
        </div>
      </div>
    </div>
  );
};

// Function to fetch player tiers from the backend
async function fetchPlayerTiers(playerIds: string[]): Promise<Record<string, { tier: number; name: string }>> {
  try {
    const response = await fetch("http://localhost:5173/api/players/tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerIds }),
    });
    if (!response.ok) throw new Error("Failed to fetch player tiers");
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching player tiers:", error);
    return {};
  }
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
      if (!contestId) {
        setError("No contest ID provided");
        return;
      }

      try {
        console.log("Current contestId from URL:", contestId);
        const [contestsResponse, matchResponse] = await Promise.all([
          fetch(`http://localhost:5173/api/contests`),
          fetch(`/api/match-data?contestId=${contestId}`),
        ]);
        console.log("Contests response status:", contestsResponse.status);
        console.log("Match response status:", matchResponse.status);

        if (!contestsResponse.ok) throw new Error("Failed to fetch contest data");
        if (!matchResponse.ok) throw new Error("Failed to fetch match data");

        const contests: Contest[] = await contestsResponse.json();
        console.log("Contests from API:", contests);
        const contest = contests.find((c) => c.contestId === contestId);
        console.log("Found contest for contestId", contestId, ":", contest);

        if (!contest) {
          throw new Error(`Contest with contestId ${contestId} not found`);
        }

        const matchDataResponse = await matchResponse.json();
        console.log("Raw match data from API for contestId", contestId, ":", matchDataResponse);
        let matchData: Team[] = matchDataResponse;

        // Check for missing tiers and fetch as fallback
        const hasMissingTiers = matchData.some((team) =>
          team.players.some((player) => player.tier === undefined)
        );
        if (hasMissingTiers) {
          console.log("Some players are missing tiers, fetching from /api/players/tiers");
          const playerIds = matchData.flatMap((team) => team.players.map((p) => p.id));
          const playerTiers = await fetchPlayerTiers(playerIds);
          matchData = matchData.map((team) => ({
            ...team,
            players: team.players.map((player) => ({
              ...player,
              tier: playerTiers[player.id]?.tier || 3,
            })),
          }));
        }

        setMatchData(matchData);
        setIsMatchCompleted(contest?.matchEnded || false);
        console.log("Updated matchData:", matchData);

        if (currentAccount && contestId) {
          const nfts = await fetchOwnedNftsForAllPlayers(matchData, contestId);
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

      const contest = await suiClient.getObject({
        id: contestId,
        options: { showContent: true },
      });
      if (!contest.data) {
        console.error("Contest data is null for contestId:", contestId);
        return {};
      }
      if (!contest.data.content || !("fields" in contest.data.content)) {
        console.error("Contest content or fields missing for contestId:", contestId, "Content:", contest.data);
        return {};
      }
      const playerNftIdsTableId = (contest.data.content as any).fields.player_nft_ids.fields.id.id;
      console.log("player_nft_ids table ID:", playerNftIdsTableId);

      const playerNftIds = await suiClient.getDynamicFields({
        parentId: playerNftIdsTableId,
      });
      console.log("player_nft_ids entries:", JSON.stringify(playerNftIds.data, null, 2));

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

  const networks = {
    testnet: { url: getFullnodeUrl("testnet") },
  };

  const playerData = useMemo(() => transformMatchData(matchData), [matchData]);
  const matchTitle = `${matchData[0]?.teamName || "TBD"} vs ${matchData[1]?.teamName || "TBD"}`;
  const teamA = matchData[0]?.teamName || "TBD";
  const teamB = matchData[1]?.teamName || "TBD";
  const timeLeft = "10m 00s";
  const tokensLeft = 320;
  const totalTokens = 1000;
  const suiSpent = 1500;

  return (
    <SuiClientProvider networks={networks} defaultNetwork="testnet">
      <WalletProvider>
        <div className="flex justify-center items-center bg-black text-white min-h-screen pt-[64px] p-1 xs:p-2 sm:p-3 font-orbitron">
          <Navbar />
          <div className="max-w-[90%] xs:max-w-[85%] sm:max-w-[85%] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1920px] mx-auto p-1 xs:p-2 sm:p-3 md:p-4">
            {error ? (
              <div className="text-center py-4 xs:py-6 sm:py-8 text-red-500 text-xs xs:text-sm sm:text-base">
                Failed to load player data.
              </div>
            ) : matchData.length > 0 ? (
              <>
                <div className="gap-1 xs:gap-2 sm:gap-3 pt-[32px] text-white">
                  <GameHeader
                    matchTitle={matchTitle}
                    teamA={teamA}
                    teamB={teamB}
                    timeLeft={timeLeft}
                    tokensLeft={tokensLeft}
                    totalTokens={totalTokens}
                    suiSpent={suiSpent}
                  />
                </div>
                <NFTSelectionView
                  playerData={playerData}
                  matchData={matchData}
                  contestId={contestId || ""}
                  packageId={packageId}
                  isMatchCompleted={isMatchCompleted}
                  ownedNfts={ownedNfts}
                />
              </>
            ) : (
              <div className="text-center py-4 xs:py-6 sm:py-8 text-xs xs:text-sm sm:text-base">
                Loading player data...
              </div>
            )}
          </div>
        </div>
      </WalletProvider>
    </SuiClientProvider>
  );
}