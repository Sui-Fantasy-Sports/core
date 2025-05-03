// client/src/app/shared/components/MatchPage.tsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import NftCard from "../components/NFTcard";
import Navbar from "./Navbar"; // Import Navbar

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
}

export default function MatchPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const [matchData, setMatchData] = useState<Team[]>([]);
  const [isMatchCompleted, setIsMatchCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const packageId = "0x22ef74f3fe1e3ca72555fa6fe5c040115ee395af2d1674148df1b1ebba774d78";

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

        setMatchData(matchData);
        setIsMatchCompleted(contest?.matchEnded || false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load player data.");
      }
    };
    fetchMatchData();
  }, [contestId]);

  const networks = {
    testnet: { url: getFullnodeUrl("testnet") },
  };

  return (
    <SuiClientProvider networks={networks} defaultNetwork="testnet">
      <WalletProvider>
        <div className="bg-black text-white min-h-screen">
          <Navbar /> {/* Add Navbar here */}
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
                        {team.players.map((player, playerIndex) => (
                          <NftCard
                            key={player.id}
                            player={player}
                            teamName={team.teamName}
                            contestId={contestId || ""}
                            playerIndex={teamIndex * 11 + playerIndex}
                            packageId={packageId}
                            isMatchCompleted={isMatchCompleted}
                          />
                        ))}
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
      </WalletProvider>
    </SuiClientProvider>
  );
}