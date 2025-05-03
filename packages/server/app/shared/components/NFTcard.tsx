// client/src/app/shared/components/NFTcard.tsx
import { useState, useEffect } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

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
  packageId: string; // Add packageId to the props
  isMatchCompleted: boolean;
}

export default function NftCard({
  player,
  teamName,
  contestId,
  playerIndex,
  isMatchCompleted,
}: NftCardProps) {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
  const [ownedNfts, setOwnedNfts] = useState<any[]>([]);
  const [nftCount, setNftCount] = useState(0);

  const BASE_COST = 300; // MIST
  const packageId = "0x22ef74f3fe1e3ca72555fa6fe5c040115ee395af2d1674148df1b1ebba774d78"; // Load from .env

  useEffect(() => {
    console.log("Current account in NftCard:", currentAccount);
    const fetchPlayerData = async () => {
      // if (!currentAccount) {
      //   console.log("No account connected, skipping fetch");
      //   return;
      // }

      try {
        const contest = await suiClient.getObject({
          id: contestId,
          options: { showContent: true },
        });
        console.log("Contest data:", contest.data);
        if (contest.data) {
          if (contest.data?.content && 'fields' in contest.data.content) {
            setNftCount(Number((contest.data.content as any).fields?.player_nft_counts?.[playerIndex] ?? 0));
          }
        }

        const nfts = await fetchOwnedNfts();
        setOwnedNfts(nfts);
      } catch (error) {
        console.error("Error fetching player data:", error);
      }
    };

    fetchPlayerData();
  }, [currentAccount, contestId, playerIndex, suiClient]);

  const fetchOwnedNfts = async () => {
    if (!currentAccount) return [];
    try {
      const objects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: `${packageId}::master::PlayerNFT` },
        options: { showContent: true },
      });
      return objects.data
        .filter((obj) => {
          const content = obj.data?.content as any;
          return content?.fields && Number(content.fields.idx ?? -1) === playerIndex;
        })
        .map((obj) => ({
          id: obj.data?.objectId,
          amount: Number((obj.data?.content as any)?.fields?.amount ?? 0),
        }));
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
    });
    if (!currentAccount) {
      alert("Please connect your wallet!");
      return;
    }
  
    const amount = 1;
    const totalCostMist = BASE_COST * amount;
  
    try {
      // Check contest object exists
      const contestObj = await suiClient.getObject({
        id: contestId,
        options: { showType: true, showContent: true },
      });
      console.log("Contest object raw:", contestObj);
      console.log("Expected type:", `${packageId}::master::Contest`);
      console.log("Actual type:", contestObj.data?.type);
      if (!contestObj.data || contestObj.data.type !== `${packageId}::master::Contest`) {
        throw new Error(`Invalid contest object at ${contestId}`);
      }
  
      // Verify wallet balance
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
          coin,
        ],
      });
  
      // Skip dry run for now to test
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
      alert("Please connect your wallet!");
      return;
    }

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
        onSuccess: async () => {
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
          ownedNfts.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-300">Your NFTs:</p>
              {ownedNfts.map((nft) => (
                <div
                  key={nft.id}
                  className="flex justify-between items-center bg-gray-700 p-2 rounded-md"
                >
                  <span className="text-sm">
                    {nft.amount > 0
                      ? `Redeemable: ${nft.amount} MIST`
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
          )
        )}
      </div>
    </div>
  );
}