// ContestPage.tsx
"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import Navbar from "./Navbar";
import { BackgroundCells } from "./background-ripple-effect";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

interface Match {
  matchId: string;
  name: string;
  players: string[];
  tiers: number[];
  startTime: number;
  status: string;
  isUpcoming?: boolean;
  isLive?: boolean;
  isCompleted?: boolean;
  contest?: Contest;
  teams?: Team[];
}

interface Contest {
  contestId: string;
  matchId: string;
  matchName: string;
  playerNames: string[];
  matchEnded: boolean;
}

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

interface TournamentCardProps {
  match: Match;
  contest?: Contest;
  ownedNfts: { [playerIndex: number]: any[] };
}

const SUPPORTED_SERIES = [
  { id: "d5a498c8-7596-4b93-8ab0-e0efc3345312", name: "IPL 2025" },
  { id: "7124ea9a-d213-4d0e-8f21-5392fb244eb3", name: "Germany Women tour of Greece, 2025" },
  { id: "d7f39636-282f-4b75-81da-1570aa9734e6", name: "Japan T20I series" },
];

const packageId = "0x85cd910e9f4dd3720bdbf654d371ad5e2a8b5fbe52064f1c21f4a03682ad1846";

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

const TournamentCard = ({ match, contest, ownedNfts }: TournamentCardProps) => {
  const parseTeamNames = (name: string) => {
    const [teamsPart] = name.split(",");
    const [teamA, teamB] = teamsPart.split(" vs ").map((team) => team.trim());
    return { teamAName: teamA, teamBName: teamB };
  };
  const { teamAName, teamBName } = parseTeamNames(match.name || "Team A vs Team B");

  const findTeamByName = (teamName: string) => {
    if (!match.teams || match.teams.length < 2) return null;
    return match.teams.find(
      (team) =>
        team.teamName.toLowerCase() === teamName.toLowerCase() ||
        team.shortname.toLowerCase() === teamName.toLowerCase()
    );
  };

  const teamA = findTeamByName(teamAName);
  const teamB = findTeamByName(teamBName);

  const logoA = teamA?.img || "/placeholder-a.png";
  const logoB = teamB?.img || "/placeholder-b.png";

  const timeRemaining =
    match.startTime > Math.floor(Date.now() / 1000)
      ? `${Math.floor((match.startTime - Math.floor(Date.now() / 1000)) / 3600)}h ${Math.floor(
          ((match.startTime - Math.floor(Date.now() / 1000)) % 3600) / 60
        )}min`
      : "In Progress";

  const totalPlayers = match.teams?.reduce((sum, team) => sum + team.players.length, 0) || 0;
  const totalOwnedNfts = Object.values(ownedNfts).flat().length;

  console.log(`Rendering TournamentCard for match ${match.matchId}:`, {
    teamAName,
    teamBName,
    teamAFound: !!teamA,
    teamBFound: !!teamB,
    logoA,
    logoB,
    totalPlayers,
    totalOwnedNfts,
    teams: match.teams,
  });

  return (
    <div className="w-full max-w-md rounded-xl bg-gradient-to-br from-black via-zinc-900 to-black p-4 border border-red-800 text-white shadow-lg text-xs flex flex-col transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-red-500/50 hover:ring-red-500/60">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{timeRemaining}</span>
        </div>
        <div className="flex items-center gap-2 text-yellow-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 2.03 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
          <span>{totalPlayers} PLAYERS</span>
        </div>
      </div>

      <div className="grid grid-cols-3 items-center text-xs sm:text-sm font-medium py-0.5 sm:py-3">
        <div className="flex flex-col items-center sm:items-start gap-1 min-w-0">
          <img src={logoA} alt={`${teamAName} Logo`} className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="font-orbitron text-center sm:text-left leading-tight break-words max-w-[7rem] sm:max-w-[10rem] line-clamp-3">
            {teamAName}
          </span>
        </div>

        <div className="text-center px-1">
          <span className="text-red-500 font-orbitron text-[10px] sm:text-xs tracking-wider">VS</span>
        </div>

        <div className="flex flex-col items-center sm:items-end gap-1 min-w-0">
          <img src={logoB} alt={`${teamBName} Logo`} className="h-8 w-8 sm:h-9 sm:w-9 rounded-full" />
          <span className="font-orbitron text-center sm:text-right leading-tight break-words max-w-[7rem] sm:max-w-[10rem] line-clamp-3">
            {teamBName}
          </span>
        </div>
      </div>

      <div className="mt-auto space-y-4">
        <div className="flex items-center justify-between text-xs w-full">
          <span className="text-red-500 w-1/3">Owned NFTs</span>
          <span className="text-gray-300 bg-black px-3 py-0.5 rounded border border-gray-600 w-1/4 text-center">
            {totalOwnedNfts}
          </span>
        </div>

        <div className="relative w-full h-2 rounded-full bg-neutral-800">
          <div
            className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400"
            style={{ width: `${totalPlayers ? (totalOwnedNfts / totalPlayers) * 100 : 0}%` }}
          ></div>
        </div>

        {match.isCompleted ? (
          <button className="w-full h-9 bg-green-600 hover:bg-green-700 rounded-md text-white font-bold tracking-wide text-xs shadow-md">
            <Link to={contest ? `/players/${contest.contestId}` : "/players"}>SELL NFTs</Link>
          </button>
        ) : (
          <button className="w-full h-9 bg-gradient-to-r from-[#8b0000] via-red-700 to-[#8b0000] hover:from-red-600 hover:to-red-500 rounded-md text-white font-bold tracking-wide text-xs shadow-md">
            <Link to={contest ? `/players/${contest.contestId}` : "/players"}>BET NOW</Link>
          </button>
        )}
      </div>
    </div>
  );
};

export default function ContestPage() {
  const [selectedSeries, setSelectedSeries] = useState<string>(SUPPORTED_SERIES[0].id);
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();

  const { data: matches = [], error: matchesError } = useQuery({
    queryKey: ["matches", selectedSeries],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5173/api/matches?seriesId=${selectedSeries}`);
      if (!res.ok) throw new Error("Failed to fetch matches");
      const data = await res.json();
      console.log(
        "Fetched matches:",
        data.map((m: Match) => ({
          matchId: m.matchId,
          name: m.name,
          status: m.status,
          startTime: m.startTime,
        }))
      );
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: contests = [], error: contestsError } = useQuery({
    queryKey: ["contests", selectedSeries],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5173/api/contests?seriesId=${selectedSeries}`);
      if (!res.ok) throw new Error("Failed to fetch contests");
      const data = await res.json();
      console.log(
        "Fetched contests:",
        data.map((c: Contest) => ({
          contestId: c.contestId,
          matchId: c.matchId,
          matchName: c.matchName,
          matchEnded: c.matchEnded,
        }))
      );
      return Array.isArray(data) ? data : [];
    },
  });

  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"live" | "completed" | "upcoming">("live");
  const [ownedNfts, setOwnedNfts] = useState<{ [matchId: string]: { [playerIndex: number]: any[] } }>({});
  const [updatedMatches, setUpdatedMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (matchesError) setError(matchesError.message);
    if (contestsError) setError(contestsError.message);
  }, [matchesError, contestsError]);

  const fetchMatchData = async (contestId: string) => {
    try {
      const matchResponse = await fetch(`/api/match-data?contestId=${contestId}`);
      if (!matchResponse.ok) throw new Error("Failed to fetch match data");
      let matchData: Team[] = await matchResponse.json();
      console.log(`Fetched match data for contest ${contestId}:`, matchData);

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

      console.log(`Updated match data for contest ${contestId}:`, matchData);
      return matchData;
    } catch (err) {
      console.error(`Error fetching match data for contest ${contestId}:`, err);
      setError("Failed to load match data.");
      return null;
    }
  };

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
      if (!contest.data || !contest.data.content || !("fields" in contest.data.content)) {
        console.error("Contest data or fields missing for contestId:", contestId);
        return {};
      }

      const nftMap: { [playerIndex: number]: any[] } = {};
      objects.data.forEach((obj) => {
        if (obj.data && obj.data.content && "fields" in obj.data.content) {
          const playerIndex = (obj.data.content.fields as any)?.player_index;
          if (!nftMap[playerIndex]) nftMap[playerIndex] = [];
          nftMap[playerIndex].push(obj);
        }
      });

      console.log(`NFT map for contest ${contestId}:`, nftMap);
      return nftMap;
    } catch (err) {
      console.error("Error fetching NFTs:", err);
      setError("Failed to load NFT data.");
      return {};
    }
  };

  useEffect(() => {
    const fetchAllMatchDataAndNfts = async () => {
      const newMatches = await Promise.all(
        contests.map(async (contest: Contest) => {
          const match = matches.find((m: Match) => m.matchId === contest.matchId);
          if (!match) {
            console.log(`No match found for contest ${contest.contestId}`);
            return null;
          }

          const teams = await fetchMatchData(contest.contestId);
          if (!teams) return match;

          const nfts = await fetchOwnedNftsForAllPlayers(teams, contest.contestId);
          setOwnedNfts((prev) => ({ ...prev, [match.matchId]: nfts }));

          return { ...match, teams };
        })
      );

      const validMatches = newMatches.filter((m): m is Match => m !== null);
      setUpdatedMatches(validMatches);
    };

    if (matches.length > 0 && contests.length > 0) {
      fetchAllMatchDataAndNfts();
    }
  }, [matches, contests, currentAccount]);

  const now = Math.floor(Date.now() / 1000);
  const filteredMatches = updatedMatches.map((match: Match) => {
    const contest = contests.find((c: Contest) => c.matchId === match.matchId);
    const isUpcoming = match.status === "upcoming" && !contest?.matchEnded;
    const isLive = match.status === "live" && !contest?.matchEnded;
    const isCompleted = match.status === "completed" || contest?.matchEnded || false;

    console.log(`Match ${match.matchId}:`, {
      name: match.name,
      startTime: match.startTime,
      status: match.status,
      contestMatchEnded: contest?.matchEnded,
      contestFound: !!contest,
      isUpcoming,
      isLive,
      isCompleted,
      teams: match.teams,
    });

    return { ...match, isUpcoming, isLive, isCompleted, contest };
  });

  const getFilteredData = () => {
    switch (activeTab) {
      case "live":
        return filteredMatches.filter((m: any) => m.isLive);
      case "completed":
        return filteredMatches.filter((m: any) => m.isCompleted);
      case "upcoming":
        return filteredMatches.filter((m: any) => m.isUpcoming);
      default:
        return [];
    }
  };

  const filteredData = getFilteredData();
  console.log(`Filtered data for ${activeTab}:`, filteredData);

  return (
    <div className="flex justify-center items-start bg-black text-white py-8 min-h-screen overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 z-0">
        <BackgroundCells />
      </div>

      <div className="relative flex flex-col h-[700px] max-w-full justify-start items-start mt-[64px] backdrop-blur-[4px] w-[1400px] p-4 rounded-lg shadow-lg border border-red-900 text-white bg-white/2 z-10 overflow-hidden">
        {error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <div className="relative z-50 w-full px-4">
            <div className="flex justify-center mb-6">
              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-md mr-4"
              >
                {SUPPORTED_SERIES.map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.name}
                  </option>
                ))}
              </select>
            </div>
            <Tabs
              defaultValue="live"
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "live" | "completed" | "upcoming")}
            >
              <TabsList className="h-auto rounded-none border-border bg-transparent p-0">
                <TabsTrigger
                  value="completed"
                  className="relative text-xl rounded-none py-2 text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:transition-all after:duration-300 data-[state=active]:text-red-500 data-[state=active]:after:bg-red-500"
                >
                  COMPLETED
                </TabsTrigger>
                <TabsTrigger
                  value="live"
                  className="relative text-xl rounded-none py-2 pl-6 text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:transition-all after:duration-300 data-[state=active]:text-red-500 data-[state=active]:after:bg-red-500"
                >
                  <span className="blink-dot"></span>
                  LIVE
                </TabsTrigger>
                <TabsTrigger
                  value="upcoming"
                  className="relative text-xl rounded-none py-2 text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:transition-all after:duration-300 data-[state=active]:text-red-500 data-[state=active]:after:bg-red-500"
                >
                  UPCOMING
                </TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="flex-1 w-full overflow-y-auto max-h-[calc(100vh-180px)]">
                <div className="space-y-8 pt-8">
                  <div className="relative backdrop-blur-[8px] p-6">
                    <div className="absolute -top-4 left-0 flex items-center w-full pr-6">
                      <div className="bg-red-900 text-white px-4 py-2 text-xl font-semibold rounded-r-md shadow-md z-10">
                        {SUPPORTED_SERIES.find((series) => series.id === selectedSeries)?.name || "Tournament"}
                      </div>
                      <div className="h-px bg-red-900 flex-1 ml-2" />
                    </div>
                    <div className="flex flex-row gap-4 mt-6 flex-wrap">
                      {filteredData.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 w-full">No live matches found.</p>
                      ) : (
                        filteredData.map((match) => (
                          <TournamentCard
                            key={match.matchId}
                            match={match}
                            contest={match.contest}
                            ownedNfts={ownedNfts[match.matchId] || {}}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="completed" className="flex-1 w-full overflow-y-auto max-h-[calc(100vh-180px)]">
                <div className="space-y-8 pt-8">
                  <div className="relative backdrop-blur-[8px] p-6">
                    <div className="absolute -top-4 left-0 flex items-center w-full pr-6">
                      <div className="bg-red-900 text-white px-4 py-2 text-xl font-semibold rounded-r-md shadow-md z-10">
                        {SUPPORTED_SERIES.find((series) => series.id === selectedSeries)?.name || "Tournament"}
                      </div>
                      <div className="h-px bg-red-900 flex-1 ml-2" />
                    </div>
                    <div className="flex flex-row gap-4 mt-6 flex-wrap">
                      {filteredData.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 w-full">No completed matches found.</p>
                      ) : (
                        filteredData.map((match) => (
                          <TournamentCard
                            key={match.matchId}
                            match={match}
                            contest={match.contest}
                            ownedNfts={ownedNfts[match.matchId] || {}}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upcoming" className="flex-1 w-full overflow-y-auto max-h-[calc(100vh-180px)]">
                <div className="space-y-8 pt-8">
                  <div className="relative backdrop-blur-[8px] p-6">
                    <div className="absolute -top-4 left-0 flex items-center w-full pr-6">
                      <div className="bg-red-900 text-white px-4 py-2 text-xl font-semibold rounded-r-md shadow-md z-10">
                        {SUPPORTED_SERIES.find((series) => series.id === selectedSeries)?.name || "Tournament"}
                      </div>
                      <div className="h-px bg-red-900 flex-1 ml-2" />
                    </div>
                    <div className="flex flex-row gap-4 mt-6 flex-wrap">
                      {filteredData.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 w-full">No upcoming matches found.</p>
                      ) : (
                        filteredData.map((match) => (
                          <TournamentCard
                            key={match.matchId}
                            match={match}
                            contest={match.contest}
                            ownedNfts={ownedNfts[match.matchId] || {}}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}