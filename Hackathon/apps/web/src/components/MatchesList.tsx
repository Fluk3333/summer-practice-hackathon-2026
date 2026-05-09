interface MatchUser {
  id: number;
  email: string;
  name: string;
  description?: string | null;
  location?: string | null;
  sports?: string | null;
  skillLevel?: string;
  compatibility?: number; // 👈 Display calculations on front-end
}

interface MatchesListProps {
  matches: MatchUser[];
  currentSports: string[];
  onOpenChat: (location: string, sport: string) => void;
}

export function MatchesList({ matches, currentSports, onOpenChat }: MatchesListProps) {
  return (
    <div className="bg-gray-800/40 border border-blue-500/20 rounded-xl p-6 mb-8 shadow-xl">
      <h2 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
        <span>🔥</span> Compatible Sports Matches
      </h2>
      
      {matches.length === 0 ? (
        <p className="text-gray-400 text-sm italic py-2">
          No active matches found nearby yet. Try checking in or updating your sports!
        </p>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const matchSports = match.sports ? match.sports.split(',').filter(Boolean) : [];
            const sharedSports = matchSports.filter((sport) => currentSports.includes(sport));
            const defaultSport = sharedSports[0] || 'Sports'; 

            return (
              <div 
                key={match.id} 
                className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60 flex flex-col gap-3 hover:border-blue-500/40 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-200 flex items-center gap-2">
                      {match.name}
                      <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700 font-semibold">
                        {match.skillLevel}
                      </span>
                    </h3>
                    <p className="text-gray-400 text-[10px] mt-0.5">📍 {match.location}</p>
                    {match.description && (
                      <p className="text-gray-400 text-xs italic mt-2 bg-gray-950/40 p-2 rounded border border-gray-800">
                        "{match.description}"
                      </p>
                    )}
                  </div>

                  {/* Pulsing AI Compatibility Badge */}
                  <div className="text-right">
                    <span className="inline-block bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      ⚡ {match.compatibility || 75}% Match
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                  <div className="flex flex-wrap gap-1">
                    {sharedSports.map((sport) => (
                      <span 
                        key={sport} 
                        className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                      >
                        {sport}
                      </span>
                    ))}
                  </div>

                  <button 
                    onClick={() => onOpenChat(match.location || 'Global', defaultSport)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-900/20"
                  >
                    Open Chat Matchup
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}