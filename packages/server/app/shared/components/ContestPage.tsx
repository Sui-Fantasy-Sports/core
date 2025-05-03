// client/src/app/shared/components/ContestPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "./Navbar";

interface Match {
  matchId: string;
  name: string;
  players: string[];
  tiers: number[];
  startTime: number;
  status: string; // Ensure status is included
}

interface Contest {
  contestId: string;
  matchId: string;
  matchName: string;
  playerNames: string[];
  matchEnded: boolean;
}

export default function ContestPage() {
  const { data: matches = [], error: matchesError } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5173/api/matches");
      if (!res.ok) throw new Error("Failed to fetch matches");
      const data = await res.json();
      console.log("Fetched matches:", data);
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: contests = [], error: contestsError } = useQuery({
    queryKey: ["contests"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5173/api/contests");
      if (!res.ok) throw new Error("Failed to fetch contests");
      const data = await res.json();
      console.log("Fetched contests:", data);
      return Array.isArray(data) ? data : [];
    },
  });

  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"live" | "completed" | "upcoming">("live");
  const navigate = useNavigate();

  useEffect(() => {
    if (matchesError) setError(matchesError.message);
    if (contestsError) setError(contestsError.message);
  }, [matchesError, contestsError]);

  const handleBetNow = (contestId: string) => {
    navigate(`/players/${contestId}`);
  };

  const handleViewResults = (contestId: string) => {
    navigate(`/players/${contestId}`);
  };

  const now = Math.floor(Date.now() / 1000);
  const filteredMatches = matches.map((match) => {
    const contest = contests.find((c) => c.matchId === match.matchId);
    const isUpcoming = match.status === "upcoming" && !contest?.matchEnded;
    const isLive = match.status === "live" && !contest?.matchEnded;
    const isCompleted = match.status === "completed" || contest?.matchEnded || false;

    console.log(`Match ${match.matchId}:`, {
      name: match.name,
      startTime: match.startTime,
      status: match.status,
      contestMatchEnded: contest?.matchEnded,
      isUpcoming,
      isLive,
      isCompleted,
    });

    return { ...match, isUpcoming, isLive, isCompleted, contest };
  });

  const getFilteredData = () => {
    switch (activeTab) {
      case "live":
        return filteredMatches.filter((m) => m.isLive);
      case "completed":
        return filteredMatches.filter((m) => m.isCompleted);
      case "upcoming":
        return filteredMatches.filter((m) => m.isUpcoming);
      default:
        return [];
    }
  };

  const filteredData = getFilteredData();
  console.log(`Filtered data for ${activeTab}:`, filteredData);

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <div className="p-6">
        {error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <>
            <h1 className="text-4xl font-bold text-center mb-8">Tournaments</h1>
            <div className="flex justify-center mb-6">
              <button
                className={`px-4 py-2 mx-2 rounded-md ${
                  activeTab === "live" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
                }`}
                onClick={() => setActiveTab("live")}
              >
                Live
              </button>
              <button
                className={`px-4 py-2 mx-2 rounded-md ${
                  activeTab === "completed" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
                }`}
                onClick={() => setActiveTab("completed")}
              >
                Completed
              </button>
              <button
                className={`px-4 py-2 mx-2 rounded-md ${
                  activeTab === "upcoming" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
                }`}
                onClick={() => setActiveTab("upcoming")}
              >
                Upcoming
              </button>
            </div>
            {filteredData.length === 0 ? (
              <div className="text-center py-10">No {activeTab} matches found.</div>
            ) : (
              <div className="space-y-12 max-w-6xl mx-auto">
                {filteredData.map((match) => (
                  <div key={match.matchId} className="bg-gray-900 rounded-lg p-6 shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4">{match.name}</h2>
                    <div className="space-y-4">
                      {match.contest ? (
                        <div className="bg-gray-800 p-4 rounded-md flex justify-between items-center">
                          <div>
                            <p className="text-lg font-bold">{match.contest.matchName}</p>
                            <p className="text-sm text-gray-400">
                              Players: {match.contest.playerNames.length}
                            </p>
                            {match.isCompleted && (
                              <p className="text-sm text-red-500">Match Ended</p>
                            )}
                          </div>
                          {match.isCompleted ? (
                            <button
                              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition"
                              onClick={() => handleViewResults(match.contest.contestId)}
                            >
                              Sell NFTs
                            </button>
                          ) : (
                            <button
                              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition"
                              onClick={() => handleBetNow(match.contest.contestId)}
                            >
                              Bet Now
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No contest available</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}