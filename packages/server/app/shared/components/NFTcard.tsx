import { useState, useEffect } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Flag, User, Target, Users } from "lucide-react";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  playerId: string;
  playerIndex: number;
  packageId: string;
  isMatchCompleted: boolean;
  tier: number;
  playerName: string;
  ownedNfts?: Nft[];
  onQuantityChange?: (playerId: string, newQuantity: number) => void;
}

export default function NftCard({
  player,
  teamName,
  contestId,
  playerId,
  playerIndex,
  packageId,
  isMatchCompleted,
  tier,
  playerName,
  onQuantityChange,
}: NftCardProps) {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
  const [ownedNfts, setOwnedNfts] = useState<Nft[]>([]);
  const [nftCount, setNftCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const BASE_COST = 300; // MIST

  console.log("Wallet address in NftCard.tsx:", currentAccount?.address);
  console.log("Player index in of player in NftCard.tsx:", playerIndex);
  console.log("Player name in NftCard.tsx:", player.name);
  console.log("Number of tokens in NftCard.tsx:", nftCount);

  const contestCache: { [contestId: string]: ContestData } = {};
  const playerNftIdsCache: { [tableId: string]: any } = {};

  useEffect(() => {
    console.log("Current account in NftCard:", currentAccount);
    console.log("Fetching data for contestId:", contestId, "playerId:", playerId);
    const fetchPlayerData = async () => {
      setIsLoading(true);
      try {
        let contest = contestCache[contestId];
        if (!contest) {
          await delay(200);
          const response = await suiClient.getObject({
            id: contestId,
            options: { showContent: true },
          });
          if (!response.data) throw new Error(`No contest data for ID: ${contestId}`);
          contest = response.data as unknown as ContestData;
          contestCache[contestId] = contest;
        }

        const nfts = await fetchOwnedNfts();
        console.log("Fetched owned NFTs:", nfts);
        setOwnedNfts(nfts);
        const userOwnedCount = nfts.length;
        setNftCount(userOwnedCount);
        onQuantityChange?.(playerId, userOwnedCount);
      } catch (error) {
        console.error("Error fetching player data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerData();
  }, [currentAccount, contestId, playerId, suiClient]);

  const fetchOwnedNfts = async (): Promise<Nft[]> => {
    if (!currentAccount) {
      console.log("No current account, skipping fetchOwnedNfts");
      return [];
    }
    try {
      console.log("Fetching owned NFTs for address:", currentAccount.address);
      await delay(200);
      const objects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: `${packageId}::master::PlayerNFT` },
        options: { showContent: true, showType: true },
      });

      if (!objects.data || objects.data.length === 0) {
        console.log("No PlayerNFT objects found for this wallet.");
        return [];
      }

      let contest = contestCache[contestId];
      if (!contest) {
        await delay(200);
        const response = await suiClient.getObject({
          id: contestId,
          options: { showContent: true },
        });
        if (!response.data) throw new Error(`No contest data for ID: ${contestId}`);
        contest = response.data as unknown as ContestData;
        contestCache[contestId] = contest;
      }

      const playerNftIdsTableId = contest.content.fields.player_nft_ids.fields.id.id;
      let playerNftIds = playerNftIdsCache[playerNftIdsTableId];
      if (!playerNftIds) {
        await delay(200);
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
        const nftId = (entry.name as any).value;
        const playerIdx = Number((field.data?.content as any)?.fields?.value ?? -1);
        if (nftId) {
          nftIdToPlayerIndex[nftId] = playerIdx;
        }
      }

      const filteredNfts = objects.data
        .filter((obj) => {
          const nftId = obj.data?.objectId;
          if (!nftId) return false;
          const playerIdx = nftIdToPlayerIndex[nftId] ?? -1;
          return playerIdx === playerIndex;
        })
        .map((obj) => ({
          id: obj.data!.objectId,
          redeemValue: Number((obj.data?.content as any)?.fields?.redeem_value ?? 0),
        }));

      return filteredNfts;
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
            const newCount = updatedNfts.length;
            setNftCount(newCount);
            onQuantityChange?.(playerId, newCount);
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
      const contestObj = await suiClient.getObject({
        id: contestId,
        options: { showType: true, showContent: true },
      });
      if (!contestObj.data || contestObj.data.type !== `${packageId}::master::Contest`) {
        throw new Error(`Invalid contest object at ${contestId}`);
      }

      const txb = new Transaction();
      txb.moveCall({
        target: `${packageId}::master::sell`,
        arguments: [
          txb.object(contestId),
          txb.object(nftId),
        ],
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
            const newCount = updatedNfts.length;
            setNftCount(newCount);
            onQuantityChange?.(playerId, newCount);
          },
          onError: (error) => {
            console.error("Sell failed:", error);
            alert("Failed to sell NFT. Check console.");
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

  const borderClass = "border-gray-600";

  return (
    <div
      className={`relative group w-full max-w-[200px] aspect-[8/15] rounded-2xl bg-[#111] border ${borderClass} p-2 sm:p-3 lg:p-4 text-white 
      flex flex-col justify-between transition-transform duration-200 shadow-inner hover:-translate-y-1 hover:border-red-800 mx-auto
      min-h-[360px] sm:min-h-[400px] lg:min-h-[450px]`}
    >
      <div className="relative h-1/3 rounded-xl overflow-hidden">
        <img
          src={player.playerImg}
          alt={player.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute break-words max-w-[88px] top-1 sm:top-2 right-1 sm:right-2 bg-gray-800 text-white text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-0.5 rounded-full font-normal shadow-sm">
          {player.role}
        </div>
      </div>

      {nftCount > 0 && (
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center bg-[#8b0000] text-white text-[10px] px-2 sm:px-3 py-0.5 sm:py-1 rounded-br-xl font-semibold shadow-lg ">
          <Users size={12} className="mr-1" />
          {nftCount} NFTs
        </div>
      )}

      <div className="mt-2 sm:mt-3 px-1">
        <div className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 w-full break-words line-clamp-2">
          {player.name}
        </div>
        <div className="flex justify-between text-[10px] sm:text-xs items-center mb-1">
          <div className="flex items-center text-gray-500 gap-1">
            <Flag size={12} /> {player.country}
          </div>
          <div className="text-yellow-400 font-semibold">{BASE_COST} MIST</div>
        </div>
        <div className="text-right text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest">
          {teamName}
        </div>
      </div>

      <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-1 sm:gap-2 text-[10px] sm:text-[10px] text-gray-400">
        <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-[#181818] rounded-md">
          <User size={12} />
          {player.battingStyle}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-[#181818] rounded-md">
          <Target size={12} />
          {player.bowlingStyle || "N/A"}
        </div>
      </div>

      <div className="mt-2 sm:mt-3 flex flex-col gap-2">
        <button
          onClick={handleBuy}
          className="w-full rounded-md bg-[#8b0000] py-1 sm:py-1.5 text-xs sm:text-sm hover:bg-red-600 hover:text-white transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isMatchCompleted || isPending || isLoading}
        >
          {isLoading ? "Processing..." : "Buy"}
        </button>
        {ownedNfts.map((nft) => (
          <button
            key={nft.id}
            onClick={() => handleSell(nft.id)}
            className="w-full rounded-md bg-gray-600 py-1 sm:py-1.5 text-xs sm:text-sm hover:bg-gray-500 hover:text-white transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isPending || isLoading}
          >
            Sell NFT #{nft.id.slice(0, 6)}
          </button>
        ))}
      </div>
    </div>
  );
}
