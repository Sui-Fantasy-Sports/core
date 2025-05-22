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
    const response = await fetch("/api/players/tiers", {
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
  const [liveScore, setLiveScore] = useState<string | null>(null);

  useEffect(() => {
    if (match.status === "live") {
      const fetchScore = async () => {
        try {
          const res = await fetch(`/api/match-info?matchId=${match.matchId}`);
          const data = await res.json();
          if (data.status === "success" && data.data?.score?.length > 0) {
            const score = data.data.score[0];
            setLiveScore(`${score.r}/${score.w} (${score.o} overs)`);
          } else {
            setLiveScore("Live");
          }
        } catch (error) {
          console.error(`Failed to fetch live score for match ${match.matchId}:`, error);
          setLiveScore("Live");
        }
      };
      fetchScore();
    }
  }, [match.matchId, match.status]);

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
    match.status === "live"
      ? liveScore || "Live"
      : match.startTime > Math.floor(Date.now() / 1000)
      ? `${Math.floor((match.startTime - Math.floor(Date.now() / 1000)) / 3600)}h ${Math.floor(
          ((match.startTime - Math.floor(Date.now() / 1000)) % 3600) / 60
        )}min`
      : "Upcoming";

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
    status: match.status,
    timeRemaining,
    teams: match.teams,
  });

  return (
    <div className="group w-full max-w-[22rem] xs:max-w-[24rem] sm:max-w-lg md:max-w-xl min-h-[200px] sm:min-h-[240px] max-h-[240px] rounded-xl bg-black p-4 xs:p-4 sm:p-4 border border-neutral-800 text-white shadow-lg text-xs flex flex-col transition-all transform overflow-hidden">
      <div className="flex flex-col h-full transition-transform duration-300 ease-in-out group-hover:scale-105">
        {/* Top Row */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 xs:gap-2 text-red-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 xs:h-4 xs:w-4"
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
            <span className="text-[10px] xs:text-xs">{timeRemaining}</span>
          </div>
          <div className="flex items-center gap-1 xs:gap-2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 xs:h-4 xs:w-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 2.03 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            <span className="text-[10px] xs:text-xs">{totalPlayers} PLAYERS</span>
          </div>
        </div>

        <div className="flex-grow grid grid-cols-3 items-start text-xs font-medium py-0.5 xs:py-1 sm:py-3">
          {/* Team A */}
          <div className="flex flex-col items-center sm:items-start gap-1 min-w-0">
            <img src={logoA} alt={`${teamAName} Logo`} className="h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9" />
            <span className="text-center sm:text-left leading-tight break-words max-w-[6rem] xs:max-w-[7rem] sm:max-w-[12rem] line-clamp-3 h-[3.25rem]">
              {teamAName}
            </span>
          </div>

          {/* VS centered */}
          <div className="text-center px-1 self-start pt-1">
            <span className="text-red-500 text-[8px] xs:text-[10px] sm:text-xs tracking-wider">VS</span>
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center sm:items-end gap-1 min-w-0">
            <img src={logoB} alt={`${teamBName} Logo`} className="h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 rounded-full" />
            <span className="text-center sm:text-right leading-tight break-words max-w-[6rem] xs:max-w-[7rem] sm:max-w-[12rem] line-clamp-3 h-[3.25rem]">
              {teamBName}
            </span>
          </div>
        </div>

        {/* Push Tokens Left and Button to the bottom */}
        <div className="mt-auto space-y-3 xs:space-y-4">
          {/* Tokens Left */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] xs:text-xs w-full">
              <span className="text-gray-300 w-1/3">Owned NFTs</span>
              <span className="text-gray-300 bg-black px-2 xs:px-3 py-0.5 rounded border border-gray-600 text-center text-[10px] xs:text-xs min-w-[4rem] xs:min-w-[4.5rem]">
                {totalOwnedNfts}/{totalPlayers}
              </span>
            </div>
            <div className="relative w-full h-2 rounded-full bg-neutral-800">
              <div
                className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400"
                style={{ width: `${totalPlayers ? (totalOwnedNfts / totalPlayers) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          {/* Button */}
          {match.isCompleted ? (
            <button className="w-full h-8 xs:h-9 bg-green-600 hover:bg-green-700 rounded-md text-white font-bold tracking-wide text-[10px] xs:text-xs shadow-md">
              <Link to={contest ? `/players/${contest.contestId}` : "/players"}>SELL NFT</Link>
            </button>
          ) : match.isUpcoming ? (
            <Link to={contest ? `/players/${contest.contestId}` : "/players"}>
              <button className="w-full h-8 xs:h-9 bg-[#8b0000] hover:bg-red-600 rounded-md text-white font-bold tracking-wide text-[10px] xs:text-xs shadow-md">
                BET NOW
              </button>
            </Link>
          ) : null}
        </div>
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
      const res = await fetch(`/api/matches?seriesId=${selectedSeries}`);
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
      const res = await fetch(`/api/contests?seriesId=${selectedSeries}`);
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

  const TabContent = ({ data, emptyMessage, seriesName }: { data: Match[]; emptyMessage: string; seriesName: string }) => (
    <div className="space-y-6 xs:space-y-8 pt-6 xs:pt-8">
      <div className="relative backdrop-blur-[8px] p-3 xs:p-4 sm:p-5 md:p-6">
        <div className="absolute -top-3 xs:-top-4 left-0 flex items-center w-full pr-4 sm:pr-6">
          <div className="bg-red-800/50 border-neutral-800 text-white px-3 xs:px-4 py-1.5 xs:py-2 text-lg xs:text-xl rounded-r-md shadow-md z-10">
            {seriesName}
          </div>
          <div className="h-px flex-1 ml-2 rounded-lg bg-neutral-800" />
        </div>
        <div className="mt-4 xs:mt-6 overflow-x-auto">
          <div className="flex space-x-3 xs:space-x-4 px-1 min-w-full overflow-visible">
            {data.length === 0 ? (
              <p className="text-center text-[10px] xs:text-xs sm:text-sm text-gray-400">{emptyMessage}</p>
            ) : (
              data.map((match, index) => (
                <div
                  key={match.matchId}
                  className={`flex-none w-[95%] xs:w-[80%] sm:w-[60%] md:w-[45%] lg:w-[30%] ${index % 3 === 2 ? "mr-3 xs:mr-4" : ""}`}
                >
                  <TournamentCard
                    match={match}
                    contest={match.contest}
                    ownedNfts={match.matchId in ownedNfts ? ownedNfts[match.matchId] : {}}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center bg-black text-white py-6 xs:py-8 min-h-screen overflow-hidden">
      <Navbar />
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <BackgroundCells />
      </div>

      {/* Content */}
      <div className="relative flex flex-col h-auto min-h-[400px] xs:min-h-[450px] sm:min-h-[500px] md:min-h-[550px] lg:min-h-[600px] xl:min-h-[650px] 2xl:min-h-[800px] max-w-[90%] xs:max-w-[85%] sm:max-w-[85%] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[90%] 3xl:max-w-[1920px] justify-start items-start mt-[32px] xs:mt-[40px] sm:mt-[48px] lg:mt-[56px] backdrop-blur-[4px] w-full p-3 xs:p-3 sm:p-4 md:p-4 lg:p-5 xl:p-6 rounded-lg shadow-lg border border-neutral-800 text-white bg-white/2 z-10 overflow-hidden">
        {error ? (
          <div className="text-center py-8 xs:py-10 text-red-500 text-sm xs:text-base">{error}</div>
        ) : (
          <div className="relative z-50 w-full px-2 xs:px-4 sm:px-5">
            <div className="flex justify-center mb-6">
              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                className="bg-red-800/50 text-white p-2 px-4 py-2 rounded-md mr-4"
              >
                {SUPPORTED_SERIES.map((series) => (
                  <option className="bg-black text-white" key={series.id} value={series.id}>
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
              <TabsList className="h-auto rounded-none border-border bg-transparent p-0 flex flex-wrap justify-center sm:justify-start gap-2 xs:gap-4">
                <TabsTrigger
                  value="completed"
                  className="relative text-sm xs:text-base sm:text-lg md:text-xl rounded-none py-1.5 xs:py-2 text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:transition-all after:duration-300 data-[state=active]:text-red-600 data-[state=active]:after:bg-red-600"
                >
                  COMPLETED
                </TabsTrigger>
                <TabsTrigger
                  value="live"
                  className="relative text-sm xs:text-base sm:text-lg md:text-xl rounded-none py-1.5 xs:py-2 pl-4 xs:pl-6 text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:transition-all after:duration-300 data-[state=active]:text-red-600 data-[state=active]:after:bg-red-600"
                >
                  <span className="blink-dot"></span>
                  LIVE
                </TabsTrigger>
                <TabsTrigger
                  value="upcoming"
                  className="relative text-sm xs:text-base sm:text-lg md:text-xl rounded-none py-1.5 xs:py-2 text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:transition-all after:duration-300 data-[state=active]:text-red-600 data-[state=active]:after:bg-red-600"
                >
                  UPCOMING
                </TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="flex-1 w-full overflow-y-auto max-h-[calc(100vh-180px)]">
                <TabContent
                  data={filteredData}
                  emptyMessage="No live matches found."
                  seriesName={selectedSeries === 'd5a498c8-7596-4b93-8ab0-e0efc3345312' ? "IPL '25" : SUPPORTED_SERIES.find((series) => series.id === selectedSeries)?.name || "Tournament"}
                />
              </TabsContent>

              <TabsContent value="completed" className="flex-1 w-full overflow-y-auto max-h-[calc(100vh-180px)]">
                <TabContent
                  data={filteredData}
                  emptyMessage="Fetching completed matches..."
                  seriesName={selectedSeries === 'd5a498c8-7596-4b93-8ab0-e0efc3345312' ? "IPL '25" : SUPPORTED_SERIES.find((series) => series.id === selectedSeries)?.name || "Tournament"}
                />
              </TabsContent>

              <TabsContent value="upcoming" className="flex-1 w-full overflow-y-auto max-h-[calc(100vh-180px)]">
                <TabContent
                  data={filteredData}
                  emptyMessage="Fetching upcoming matches..."
                  seriesName={selectedSeries === 'd5a498c8-7596-4b93-8ab0-e0efc3345312' ? "IPL '25" : SUPPORTED_SERIES.find((series) => series.id === selectedSeries)?.name || "Tournament"}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}