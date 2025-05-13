import { useState, useEffect } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Flag, User, Target } from "lucide-react";

// Simple utility to add a delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Player {
  id: string;
  name: string;
  role: string;
  battingStyle: string;
  bowlingStyle?: string;
  country: string;
  playerImg: string;
  tier: number;
}

interface Nft {
  id: string;
  redeemValue: number;
}

interface ContestFields {
  player_nft_counts: number[];
  player_nft_ids: { fields: { id: { id: string } } };
}

interface ContestData {
  content: { fields: ContestFields };
  type: string;
}

interface NftCardProps {
  player: Player;
  teamName: string;
  contestId: string;
  playerIndex: number;
  playerName: string;
  packageId: string;
  isMatchCompleted: boolean;
  ownedNfts: Nft[];
  tier: number;
  onQuantityChange: (count: number) => void;
}

export default function NftCard({
  player,
  teamName,
  contestId,
  playerIndex,
  packageId,
  isMatchCompleted,
  tier,
}: NftCardProps) {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
  const [ownedNfts, setOwnedNfts] = useState<Nft[]>([]);
  const [nftCount, setNftCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const BASE_COST = 300; // MIST

  // Cache within component to avoid leaks
  const [contestCache] = useState<{ [contestId: string]: ContestData }>({});
  const [playerNftIdsCache] = useState<{ [tableId: string]: any }>({});

  useEffect(() => {
    if (!currentAccount) return;

    const fetchPlayerData = async () => {
      setIsLoading(true);
      try {
        // Fetch contest data (cached)
        let contest = contestCache[contestId];
        if (!contest) {
          await delay(200 * playerIndex);
          const response = await suiClient.getObject({
            id: contestId,
            options: { showContent: true },
          });
          if (!response.data) throw new Error(`No contest data for ID: ${contestId}`);
          contest = response.data as unknown as ContestData;
          contestCache[contestId] = contest;
        }

        if (contest.content?.fields?.player_nft_counts) {
          const count = contest.content.fields.player_nft_counts[playerIndex] ?? 0;
          setNftCount(Number(count));
        } else {
          console.warn("Contest content or player_nft_counts missing:", contest);
        }

        const nfts = await fetchOwnedNfts();
        setOwnedNfts(nfts);
      } catch (error) {
        console.error("Error fetching player запускающий data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerData();
  }, [currentAccount, contestId, playerIndex, suiClient, contestCache, playerNftIdsCache]);

  const fetchOwnedNfts = async (): Promise<Nft[]> => {
    if (!currentAccount) {
      console.log("No current account, skipping fetchOwnedNfts");
      return [];
    }

    try {
      await delay(200 * playerIndex);
      const objects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: `${packageId}::master::PlayerNFT` },
        options: { showContent: true, showType: true },
      });

      if (!objects.data?.length) {
        console.log("No PlayerNFT objects found for this wallet.");
        return [];
      }

      let contest = contestCache[contestId];
      if (!contest) {
        await delay(200 * playerIndex);
        const response = await suiClient.getObject({
          id: contestId,
          options: { showContent: true },
        });
        if (!response.data) throw new Error(`No contest data for ID: ${contestId}`);
        contest = response.data as ContestData;
        contestCache[contestId] = contest;
      }

      const playerNftIdsTableId = contest.content?.fields?.player_nft_ids?.fields?.id?.id;
      if (!playerNftIdsTableId) {
        console.error("player_nft_ids table ID missing:", contest);
        return [];
      }

      let playerNftIds = playerNftIdsCache[playerNftIdsTableId];
      if (!playerNftIds) {
        await delay(200 * playerIndex);
        playerNftIds = await suiClient.getDynamicFields({
          parentId: playerNftIdsTableId,
        });
        playerNftIdsCache[playerNftIdsTableId] = playerNftIds;
      }

      const nftIdToPlayerIndex: { [key: string]: number } = {};
      for (const entry of playerNftIds.data) {
        await delay(100);
        const field = await suiClient.getObject({
          id: entry.objectId,
          options: { showContent: true },
        });
        const nftId = (entry.name as any)?.value;
        const playerIdx = Number((field.data?.content as any)?.fields?.value ?? -1);
        if (nftId && playerIdx >= 0) {
          nftIdToPlayerIndex[nftId] = playerIdx;
        }
      }

      return objects.data
        .filter((obj) => {
          const nftId = obj.data?.objectId;
          const playerIdx = nftIdToPlayerIndex[nftId] ?? -1;
          return playerIdx === playerIndex;
        })
        .map((obj) => ({
          id: obj.data?.objectId!,
          redeemValue: Number((obj.data?.content as any)?.fields?.redeem_value ?? 0),
        }));
    } catch (error) {
      console.error("Failed to fetch owned NFTs:", error);
      return [];
    }
  };

  const handleBuy = async () => {
    if (!currentAccount) {
      alert("Please connect your wallet!");
      return;
    }

    const amount = 1;
    const totalCostMist = BASE_COST * amount;

    try {
      setIsLoading(true);
      const contestObj = await suiClient.getObject({
        id: contestId,
        options: { showType: true, showContent: true },
      });

      if (!contestObj.data || contestObj.data.type !== `${packageId}::master::Contest`) {
        throw new Error(`Invalid contest object at ${contestId}`);
      }

      const balance = await suiClient.getBalance({ owner: currentAccount.address });
      if (Number(balance.totalBalance) < totalCostMist + 1000000) {
        throw new Error("Insufficient SUI balance");
      }

      const txb = new Transaction();
      const [coin] = txb.splitCoins(txb.gas, [totalCostMist]);

      txb.moveCall({
        target: `${packageId}::master::buy`,
        arguments: [
          txb.object(contestId),
          txb.pure.u64(playerIndex),
          txb.pure.u64(amount),
          txb.pure.string(player.playerImg),
          coin,
        ],
      });

      signAndExecuteTransaction(
        {
          transaction: txb,
          chain: "sui:testnet",
        },
        {
          onSuccess: async (result) => {
            console.log("Transaction success:", result);
            alert("NFT purchased successfully!");
            const updatedNfts = await fetchOwnedNfts();
            setOwnedNfts(updatedNfts);
            setNftCount((prev) => prev + 1);
          },
          onError: (error) => {
            console.error("Buy failed:", error);
            alert("Failed to buy NFT. Check console.");
          },
          onSettled: () => setIsLoading(false),
        }
      );
    } catch (error) {
      console.error("Pre-execution error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to prepare transaction: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  const handleSell = async (nftId: string) => {
    if (!currentAccount) {
      alert("Please connect your wallet!");
      return;
    }

    try {
      setIsLoading(true);
      const txb = new Transaction();
      txb.moveCall({
        target: `${packageId}::master::sell`,
        arguments: [txb.object(contestId), txb.object(nftId)],
      });

      signAndExecuteTransaction(
        {
          transaction: txb,
          chain: "sui:testnet",
        },
        {
          onSuccess: async (result) => {
            console.log("Sell transaction success:", result);
            alert("NFT sold successfully!");
            const updatedNfts = await fetchOwnedNfts();
            setOwnedNfts(updatedNfts);
            setNftCount((prev) => prev - 1);
          },
          onError: (error) => {
            console.error("Sell failed:", error);
            alert("Failed to sell NFT. Check console.");
          },
          onSettled: () => setIsLoading(false),
        }
      );
    } catch (error) {
      console.error("Sell error:", error);
      alert("Failed to prepare sell transaction.");
      setIsLoading(false);
    }
  };

  const borderClass = tier === 1 ? "border-yellow-600" : tier === 2 ? "border-blue-600" : "border-gray-600";

  return (
    <div
      className={`relative group w-56 h-[420px] rounded-2xl bg-[#111] border ${borderClass} p-4 text-white flex flex-col justify-between 
        transition-transform duration-200 shadow-inner hover:-translate-y-1 hover:border-red-800`}
    >
      {/* Player Image with Fixed Height */}
      <div className="relative h-[144px] rounded-xl overflow-hidden">
        <img src={player.playerImg} alt={player.name} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-3 py-1 rounded-full font-normal shadow-sm">
          {player.role}
        </div>
      </div>

      {/* Quantity badge */}
      {nftCount > 0 && (
        <div className="absolute top-2 left-2 bg-gray-800 text-xs text-white px-2 py-0.5 rounded-full font-bold shadow">
          {nftCount}x
        </div>
      )}

      {/* Name & Meta */}
      <div className="mt-3 px-1">
        <div className="text-sm font-semibold mb-2 w-full break-words line-clamp-2">{player.name}</div>
        <div className="flex justify-between text-sm items-center mb-1">
          <div className="flex items-center text-xs gap-1 text-gray-500">
            <Flag size={14} /> {player.country}
          </div>
          <div className="text-yellow-400 font-semibold">{BASE_COST} SUI</div>
        </div>
        <div className="text-right text-xs text-gray-500 uppercase tracking-widest">{teamName}</div>
      </div>

      {/* Skills */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-gray-400">
        <div className="flex items-center gap-2 p-2 bg-[#181818] rounded-md">
          <User size={14} /> {player.battingStyle}
        </div>
        <div className="flex items-center gap-2 p-2 bg-[#181818] rounded-md">
          <Target size={14} /> {player.bowlingStyle || "N/A"}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-col gap-2">
        <button
          onClick={handleBuy}
          className="w-full rounded-md bg-[#8b0000] py-1 text-sm hover:bg-red-600 hover:text-white transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isMatchCompleted || isPending || isLoading}
        >
          {isLoading ? "Processing..." : "Buy"}
        </button>
        {ownedNfts.map((nft) => (
          <button
            key={nft.id}
            onClick={() => handleSell(nft.id)}
            className="w-full rounded-md bg-gray-600 py-1 text-sm hover:bg-gray-500 hover:text-white transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isPending || isLoading}
          >
            Sell NFT #{nft.id.slice(0, 6)}
          </button>
        ))}
      </div>
    </div>
  );
}