import { useEffect, useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

const ContestPage = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
  const [contestData, setContestData] = useState(null);
  const [ownedNfts, setOwnedNfts] = useState({});
  const [teamPlayers, setTeamPlayers] = useState({ team1: [], team2: [] });
  const [teamNames, setTeamNames] = useState(["Team 1", "Team 2"]);
  const [loading, setLoading] = useState(true);

  const packageId = "0x37280ea4ae2f7c31e7fffb68903f14cfae6c12b5269ba80f6fb7d183531df3a5";
  const contestId = "0xff2198ebcbd55850c20c10555fa1f287fe242cd7dca5c2780c1b8c13aecba86a";
  const matchId = "b2e603ab-96f7-4711-ac9f-6a78e742237d"; // Hardcoded for now

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch contest data from blockchain
        const contest = await suiClient.getObject({
          id: contestId,
          options: { showContent: true },
        });
        console.log("Fetched contest:", contest);
        if (contest.data) {
          setContestData(contest.data.content.fields);
        }

        // Fetch team-wise players from server API
        const response = await fetch(`http://localhost:5173/api/match-squad/${matchId}`);
        const squadData = await response.json();
        console.log("Squad data:", squadData);

        if (squadData.error) {
          console.warn("Squad data fetch failed, using flat list as fallback");
          setTeamPlayers({
            team1: contest.data.content.fields.player_names.slice(0, 24).map((name, index) => ({
              name,
              index,
            })),
            team2: contest.data.content.fields.player_names.slice(24).map((name, index) => ({
              name,
              index: index + 24,
            })),
          });
        } else {
          setTeamNames(squadData.teams);
          const team1Players = [];
          const team2Players = [];
          contest.data.content.fields.player_names.forEach((playerName, index) => {
            const squadPlayer = squadData.players.find((p) => p.name === playerName);
            if (squadPlayer && squadPlayer.team === squadData.teams[0]) {
              team1Players.push({ name: playerName, index });
            } else {
              team2Players.push({ name: playerName, index });
            }
          });
          setTeamPlayers({
            team1: team1Players,
            team2: team2Players,
          });
        }

        // Fetch owned NFTs if wallet is connected
        if (currentAccount) {
          const owned = await fetchOwnedNfts(currentAccount.address);
          setOwnedNfts(owned);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [suiClient, currentAccount]);

  const fetchOwnedNfts = async (address) => {
    try {
      const objects = await suiClient.getOwnedObjects({
        owner: address,
        filter: { StructType: `${packageId}::master::PlayerNFT` },
        options: { showContent: true },
      });
      const nfts = {};
      objects.data.forEach((obj) => {
        const fields = obj.data.content.fields;
        const playerIndex = Number(fields.idx);
        if (!nfts[playerIndex]) nfts[playerIndex] = [];
        nfts[playerIndex].push({
          id: obj.data.objectId,
          name: fields.name,
          amount: Number(fields.amount),
        });
      });
      console.log("Owned NFTs:", nfts);
      return nfts;
    } catch (error) {
      console.error("Failed to fetch owned NFTs:", error);
      return {};
    }
  };

  const handleBuy = async (playerIndex) => {
    if (!currentAccount) {
      alert("Please connect your wallet!");
      return;
    }

    const amount = 1;
    const totalCostMist = 300 * amount;

    console.log("Building buy transaction with contestId:", contestId);

    const txb = new Transaction();
    const [coin] = txb.splitCoins(txb.gas, [totalCostMist]);
    txb.moveCall({
      target: `${packageId}::master::buy`,
      arguments: [
        txb.object(contestId),
        txb.pure.u64(playerIndex),
        txb.pure.u64(amount),
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
          console.log("NFT purchased:", result);
          alert("NFT purchased successfully!");
          const updatedNfts = await fetchOwnedNfts(currentAccount.address);
          setOwnedNfts(updatedNfts);
        },
        onError: (error) => {
          console.error("Buy failed:", error);
          alert("Failed to buy NFT. Check console.");
        },
      }
    );
  };

  const handleSell = async (nftId, playerIndex) => {
    if (!currentAccount) {
      alert("Please connect your wallet!");
      return;
    }

    console.log("Building sell transaction for NFT:", nftId);

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
          console.log("NFT sold:", result);
          alert("NFT sold successfully!");
          const updatedNfts = await fetchOwnedNfts(currentAccount.address);
          setOwnedNfts(updatedNfts);
        },
        onError: (error) => {
          console.error("Sell failed:", error);
          alert("Failed to sell NFT. Check console.");
        },
      }
    );
  };

  const getTierCost = () => 300;

  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;
  if (!contestData) return <div className="text-white text-center mt-20">Contest not found</div>;

  return (
    <div className="min-h-screen bg-black p-6">
      <h1 className="text-4xl font-bold text-white text-center mb-8">
        {contestData.match_name}
      </h1>
      <div className="max-w-5xl mx-auto">
        {/* Team 1 Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">{teamNames[0]}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamPlayers.team1.map((player) => (
              <div
                key={player.index}
                className="bg-card border border-border rounded-lg p-4 text-white shadow-lg"
              >
                <h3 className="text-xl font-bold">{player.name}</h3>
                <p>Tier: {contestData.player_tiers[player.index]}</p>
                <p>Cost: {getTierCost()} MIST</p>
                <p>NFTs Minted: {contestData.player_nft_counts[player.index]}</p>
                <button
                  className="mt-4 w-full bg-gradient-to-r from-[#8b0000] to-[#250000] px-4 py-2 rounded-md hover:bg-red-500 transition disabled:opacity-50"
                  onClick={() => handleBuy(player.index)}
                  disabled={isPending || contestData.match_ended}
                >
                  {isPending ? "Buying..." : "Buy NFT"}
                </button>
                {ownedNfts[player.index] && ownedNfts[player.index].length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm">Owned NFTs:</p>
                    {ownedNfts[player.index].map((nft) => (
                      <div key={nft.id} className="flex justify-between items-center mt-2">
                        <span>
                          {nft.amount > 0 ? `Redeemable: ${nft.amount} MIST` : "Not redeemed"}
                        </span>
                        <button
                          className="bg-gradient-to-r from-[#4b0000] to-[#120000] px-3 py-1 rounded-md hover:bg-red-700 as transition disabled:opacity-50"
                          onClick={() => handleSell(nft.id, player.index)}
                          disabled={isPending || !contestData.match_ended}
                        >
                          {isPending ? "Selling..." : "Sell"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Team 2 Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">{teamNames[1]}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamPlayers.team2.map((player) => (
              <div
                key={player.index}
                className="bg-card border border-border rounded-lg p-4 text-white shadow-lg"
              >
                <h3 className="text-xl font-bold">{player.name}</h3>
                <p>Tier: {contestData.player_tiers[player.index]}</p>
                <p>Cost: {getTierCost()} MIST</p>
                <p>NFTs Minted: {contestData.player_nft_counts[player.index]}</p>
                <button
                  className="mt-4 w-full bg-gradient-to-r from-[#8b0000] to-[#250000] px-4 py-2 rounded-md hover:bg-red-500 transition disabled:opacity-50"
                  onClick={() => handleBuy(player.index)}
                  disabled={isPending || contestData.match_ended}
                >
                  {isPending ? "Buying..." : "Buy NFT"}
                </button>
                {ownedNfts[player.index] && ownedNfts[player.index].length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm">Owned NFTs:</p>
                    {ownedNfts[player.index].map((nft) => (
                      <div key={nft.id} className="flex justify-between items-center mt-2">
                        <span>
                          {nft.amount > 0 ? `Redeemable: ${nft.amount} MIST` : "Not redeemed"}
                        </span>
                        <button
                          className="bg-gradient-to-r from-[#4b0000] to-[#120000] px-3 py-1 rounded-md hover:bg-red-700 transition disabled:opacity-50"
                          onClick={() => handleSell(nft.id, player.index)}
                          disabled={isPending || !contestData.match_ended}
                        >
                          {isPending ? "Selling..." : "Sell"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestPage;