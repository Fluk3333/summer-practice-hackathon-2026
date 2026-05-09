interface User {
  id: number;
  email: string;
  name: string;
  location?: string | null;
  sports?: string | null;
}

interface MatchesListProps {
  matches: User[];
  currentSports: string[];
  onOpenChat: (location: string, sport: string) => void; // 👈 Callback prop added
}

export function MatchesList({ matches, currentSports, onOpenChat }: MatchesListProps) {
  return (
    <div className="bg-gray-800/40 border border-blue-500/20 rounded-xl p-6 mb-8 shadow-xl">
      <h2 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
        <span>🔥</span> Local Sports Matches
      </h2>
      
      {matches.length === 0 ? (
        <p className="text-gray-400 text-sm italic py-2">
          No matches found nearby yet. Try adding more sports or updating your location!
        </p>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const matchSports = match.sports ? match.sports.split(',').filter(Boolean) : [];
            // Find which sports you both have in common
            const sharedSports = matchSports.filter((sport) => currentSports.includes(sport));
            
            // We'll use the first shared sport as the default chat room topic
            const defaultSport = sharedSports[0] || 'Sports'; 

            return (
              <div 
                key={match.id} 
                className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60 flex justify-between items-center hover:border-blue-500/40 transition-colors"
              >
                <div>
                  <h3 className="font-bold text-gray-200">{match.name}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">📍 {match.location}</p>
                  
                  {/* Highlight Shared Sports */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {sharedSports.map((sport) => (
                      <span 
                        key={sport} 
                        className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase"
                      >
                        {sport}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Trigger open chat trigger */}
                <button 
                  onClick={() => onOpenChat(match.location || 'Global', defaultSport)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-900/20"
                >
                  Chat Room
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}