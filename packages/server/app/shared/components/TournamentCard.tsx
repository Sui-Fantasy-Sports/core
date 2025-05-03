interface TournamentCardProps {
  teamA: string;
  teamB: string;
  logoA?: string;
  logoB?: string;
}

const TournamentCard = ({ teamA, teamB, logoA, logoB }: TournamentCardProps) => (
    <div className="bg-white text-black w-full max-w-xs rounded-xl p-4 shadow-md">
      <div className="flex justify-between items-center text-sm font-bold mb-2">
        <img src={logoA || "/placeholder-a.png"} alt="Team A Logo" className="h-10 w-10 object-contain" />
        <span>1h 30min</span>
        <img src={logoB || "/placeholder-b.png"} alt="Team B Logo" className="h-10 w-10 object-contain" />
      </div>
      <div className="flex justify-between items-center text-md font-bold border-b border-red-500 pb-1">
        <span>{teamA}</span>
        <span>{teamB}</span>
      </div>
      <div className="mt-2 text-sm font-bold text-red-700">Tokens left</div>
      <div className="h-2 w-full bg-gray-200 rounded-full mb-2">
        <div className="h-2 bg-red-700 rounded-full w-1/3"></div>
      </div>
      <div className="h-6 w-full bg-[#8b0000] rounded-full flex items-center justify-center">
        <span className="text-white text-xs font-semibold">BET NOW</span>
      </div>
    </div>
  );

export default TournamentCard;