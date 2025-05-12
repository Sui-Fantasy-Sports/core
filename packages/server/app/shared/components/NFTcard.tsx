import { useState, useEffect } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

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
}

interface NftCardProps {
  player: Player;
  teamName: string;
  contestId: string;
  playerIndex: number;
  packageId: string;
  isMatchCompleted: boolean;
  tier: number;
  playerName: string;
  ownedNfts?: any[];
}

export default function NftCard({
  player,
  teamName,
  contestId,
  playerIndex,
  packageId,
  isMatchCompleted,
  tier,
  playerName,
}: NftCardProps) {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
  const [ownedNfts, setOwnedNfts] = useState<any[]>([]);
  const [nftCount, setNftCount] = useState(0);

  const BASE_COST = 300; // MIST

  // Log the wallet address and playerIndex
  console.log("Wallet address in NftCard.tsx:", currentAccount?.address);
  console.log("Player index in NftCard.tsx:", playerIndex);
  console.log("Player name in NftCard.tsx:", player.name);

  // Cache for contest data to avoid redundant requests
  const contestCache: { [contestId: string]: any } = {};
  const playerNftIdsCache: { [tableId: string]: any } = {};

  useEffect(() => {
    console.log("Current account in NftCard:", currentAccount);
    console.log("Fetching data for contestId:", contestId, "playerIndex:", playerIndex);
    const fetchPlayerData = async () => {
      try {
        // Fetch contest data (cached)
        let contest = contestCache[contestId];
        if (!contest) {
          await delay(200 * playerIndex); // Stagger requests to avoid rate-limiting
          contest = await suiClient.getObject({
            id: contestId,
            options: { showContent: true },
          });
          contestCache[contestId] = contest;
        }
        console.log("Contest data:", JSON.stringify(contest.data, null, 2));
        if (contest.data) {
          if (contest.data?.content && 'fields' in contest.data.content) {
            const playerNftCounts = (contest.data.content as any).fields?.player_nft_counts;
            const count = playerNftCounts?.[playerIndex] ?? 0;
            console.log(`NFT count for playerIndex ${playerIndex}:`, count);
            setNftCount(Number(count));
          } else {
            console.warn("Contest content or fields missing:", contest.data);
          }
        } else {
          console.warn("No contest data found for contestId:", contestId);
        }

        const nfts = await fetchOwnedNfts();
        console.log("Fetched owned NFTs:", nfts);
        setOwnedNfts(nfts);
      } catch (error) {
        console.error("Error fetching player data:", error);
      }
    };

    fetchPlayerData();
  }, [currentAccount, contestId, playerIndex, suiClient]);

  const fetchOwnedNfts = async () => {
    if (!currentAccount) {
      console.log("No current account, skipping fetchOwnedNfts");
      return [];
    }
    try {
      console.log("Fetching owned NFTs for address:", currentAccount.address);

      // Fetch all PlayerNFT objects owned by the wallet
      await delay(200 * playerIndex); // Stagger requests to avoid rate-limiting
      const objects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: `${packageId}::master::PlayerNFT` },
        options: { showContent: true, showType: true },
      });
      console.log("Raw owned objects:", JSON.stringify(objects.data, null, 2));

      if (!objects.data || objects.data.length === 0) {
        console.log("No PlayerNFT objects found for this wallet.");
        return [];
      }

      // Fetch the Contest object to get the player_nft_ids table (cached)
      let contest = contestCache[contestId];
      if (!contest) {
        await delay(200 * playerIndex);
        contest = await suiClient.getObject({
          id: contestId,
          options: { showContent: true },
        });
        contestCache[contestId] = contest;
      }
      if (!contest.data) {
        console.error("Contest data is null for contestId:", contestId);
        return [];
      }
      if (!contest.data.content || !('fields' in contest.data.content)) {
        console.error("Contest content or fields missing for contestId:", contestId, "Content:", contest.data);
        return [];
      }
      const playerNftIdsTableId = (contest.data.content as any).fields.player_nft_ids.fields.id.id;
      console.log("player_nft_ids table ID:", playerNftIdsTableId);

      // Fetch all entries in player_nft_ids table (cached)
      let playerNftIds = playerNftIdsCache[playerNftIdsTableId];
      if (!playerNftIds) {
        await delay(200 * playerIndex);
        playerNftIds = await suiClient.getDynamicFields({
          parentId: playerNftIdsTableId,
        });
        playerNftIdsCache[playerNftIdsTableId] = playerNftIds;
      }
      console.log("player_nft_ids entries:", JSON.stringify(playerNftIds.data, null, 2));

      // Create a map of NFT ID to playerIndex
      const nftIdToPlayerIndex: { [key: string]: number } = {};
      for (const entry of playerNftIds.data) {
        await delay(100); // Small delay for each dynamic field fetch
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

      // Filter NFTs that match the playerIndex
      const filteredNfts = objects.data
        .filter((obj) => {
          const nftId = obj.data?.objectId;
          const playerIdx = nftIdToPlayerIndex[nftId] ?? -1;
          const idxMatch = playerIdx === playerIndex;
          console.log(`Object ${nftId}: idxMatch=${idxMatch}, playerIndexFromTable=${playerIdx}, playerIndexProp=${playerIndex}`);
          return idxMatch;
        })
        .map((obj) => {
          const nft = {
            id: obj.data?.objectId,
            redeemValue: Number((obj.data?.content as any)?.fields?.redeem_value ?? 0),
          };
          console.log("Mapped NFT:", nft);
          return nft;
        });

      return filteredNfts;
    } catch (error) {
      console.error("Failed to fetch owned NFTs:", error);
      return [];
    }
  };

  const handleBuy = async () => {
    console.log("Buy clicked", {
      currentAccount: currentAccount?.address,
      contestId,
      playerIndex,
      amount: 1,
      packageId,
      imageUrl: player.playerImg,
    });
    if (!currentAccount) {
      alert("Please connect your wallet!");
      return;
    }

    const amount = 1;
    const totalCostMist = BASE_COST * amount;

    try {
      const contestObj = await suiClient.getObject({
        id: contestId,
        options: { showType: true, showContent: true },
      });
      console.log("Contest object raw:", JSON.stringify(contestObj, null, 2));
      console.log("Expected type:", `${packageId}::master::Contest`);
      console.log("Actual type:", contestObj.data?.type);
      if (!contestObj.data || contestObj.data.type !== `${packageId}::master::Contest`) {
        throw new Error(`Invalid contest object at ${contestId}`);
      }

      const balance = await suiClient.getBalance({ owner: currentAccount.address });
      console.log("Wallet balance:", balance.totalBalance);
      if (Number(balance.totalBalance) < totalCostMist + 1000000) {
        throw new Error("Insufficient SUI balance");
      }

      const txb = new Transaction();
      const [coin] = txb.splitCoins(txb.gas, [totalCostMist]);
      console.log("Split coin:", coin);

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

      console.log("Building transaction for sender:", currentAccount.address);
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
        }
      );
    } catch (error) {
      console.error("Pre-execution error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to prepare transaction: ${errorMessage}`);
    }
  };

  const handleSell = async (nftId: string) => {
    if (!currentAccount) {
      console.log("No current account, cannot sell NFT");
      alert("Please connect your wallet!");
      return;
    }
    console.log("Selling NFT with ID:", nftId);
    console.log("Current wallet address for sell:", currentAccount.address);

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
      }
    );
  };

  return (
    <div className="nft-card bg-gray-800 border border-gray-600 rounded-lg p-4 text-white shadow-lg max-w-sm transition-transform transform hover:scale-105">
      <div className="flex items-center space-x-4">
        <img
          src={player.playerImg}
          alt={player.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
        />
        <div>
          <h2 className="text-xl font-bold text-blue-300">{player.name}</h2>
          <p className="text-sm text-gray-400">Team: {teamName}</p>
          <p className="text-sm text-gray-400">Role: {player.role}</p>
          <p className="text-sm text-gray-400">Tier: {tier}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <p>
          <span className="font-semibold text-gray-300">Batting:</span>{" "}
          {player.battingStyle}
        </p>
        <p>
          <span className="font-semibold text-gray-300">Bowling:</span>{" "}
          {player.bowlingStyle || "N/A"}
        </p>
        <p>
          <span className="font-semibold text-gray-300">Country:</span>{" "}
          {player.country}
        </p>
        <p>
          <span className="font-semibold text-gray-300">Cost:</span> {BASE_COST}{" "}
          MIST
        </p>
        <p>
          <span className="font-semibold text-gray-300">NFTs Minted:</span>{" "}
          {nftCount}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {!isMatchCompleted ? (
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleBuy}
            disabled={isPending}
          >
            {isPending ? "Buying..." : "Buy NFT"}
          </button>
        ) : (
          ownedNfts.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-300">Your NFTs:</p>
              {ownedNfts.map((nft) => (
                <div
                  key={nft.id}
                  className="flex justify-between items-center bg-gray-700 p-2 rounded-md"
                >
                  <span className="text-sm">
                    {nft.redeemValue > 0
                      ? `Redeemable: ${nft.redeemValue} MIST`
                      : "Not redeemed"}
                  </span>
                  <button
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleSell(nft.id)}
                    disabled={isPending}
                  >
                    {isPending ? "Selling..." : "Sell NFT"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No NFTs owned for this player.</p>
          )
        )}
      </div>
    </div>
  );
}