import { Link } from "react-router-dom";

// Define the props for TournamentCard
interface TournamentCardProps {
  match: {
    matchId: string;
    name: string;
    startTime: number;
    isCompleted: boolean;
  };
  contest?: {
    contestId: string;
    playerNames: string[];
  };
}

export default function TournamentCard({ match, contest }: TournamentCardProps) {
  // Extract team names from match.name (e.g., "Team A vs Team B")
  const [teamAName, teamBName] = match.name.split(" vs ").map((team: string) => team.trim());

  // Placeholder logos (since we don’t have team logos in the data)
  const logoA = "https://h.cricapi.com/img/icon512.png";
  const logoB = "https://h.cricapi.com/img/icon512.png";

  // Calculate time remaining until the match starts
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const timeDiff = match.startTime - now; // Time difference in seconds
  let timeRemaining = "Match Started";
  if (timeDiff > 0) {
    const hours = Math.floor(timeDiff / 3600);
    const minutes = Math.floor((timeDiff % 3600) / 60);
    timeRemaining = `${hours}h ${minutes}m`;
  }

  // Placeholder for total bets (number of players in the contest)
  const totalBets = contest?.playerNames.length || 0;

  // Placeholder for tokens (since we don’t have token data, let’s mock it)
  const totalTokens = 100; // Arbitrary total
  const tokensRemaining = match.isCompleted ? 0 : Math.floor(Math.random() * totalTokens); // Mock remaining tokens

  return (
    <div className="w-full max-w-md rounded-xl bg-gradient-to-br from-black via-zinc-900 to-black p-4 border border-red-800 text-white shadow-lg text-xs flex flex-col transition-all transform 
    hover:scale-105 hover:shadow-2xl hover:shadow-red-500/50 hover:ring-red-500/60">
      {/* Top Row */}
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
          <span>{totalBets} BETS</span>
        </div>
      </div>

      <div className="grid grid-cols-3 items-center text-xs sm:text-sm font-medium py-0.5 sm:py-3">
        {/* Team A */}
        <div className="flex flex-col items-center sm:items-start gap-1 min-w-0">
          <img src={logoA} alt="Team A Logo" className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="font-orbitron text-center sm:text-left leading-tight break-words max-w-[7rem] sm:max-w-[10rem] line-clamp-3">
            {teamAName}
          </span>
        </div>

        {/* VS centered */}
        <div className="text-center px-1">
          <span className="text-red-500 font-orbitron text-[10px] sm:text-xs tracking-wider">VS</span>
        </div>

        {/* Team B */}
        <div className="flex flex-col items-center sm:items-end gap-1 min-w-0">
          <img src={logoB} alt="Team B Logo" className="h-8 w-8 sm:h-9 sm:w-9 rounded-full" />
          <span className="font-orbitron text-center sm:text-right leading-tight break-words max-w-[7rem] sm:max-w-[10rem] line-clamp-3">
            {teamBName}
          </span>
        </div>
      </div>

      {/* Push Tokens Left and Button to the bottom */}
      <div className="mt-auto space-y-4">
        {/* Tokens Left */}
        <div className="flex items-center justify-between text-xs w-full">
          <span className="text-red-500 w-1/3">Tokens left</span>
          <span className="text-gray-300 bg-black px-3 py-0.5 rounded border border-gray-600 w-1/4 text-center">
            {tokensRemaining}/{totalTokens}
          </span>
        </div>

        <div className="relative w-full h-2 rounded-full bg-neutral-800">
          <div
            className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400"
            style={{ width: `${(tokensRemaining / totalTokens) * 100}%` }}
          ></div>
        </div>

        {/* Button */}
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
}