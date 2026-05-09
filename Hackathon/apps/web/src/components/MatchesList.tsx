import styles from './MatchesList.module.css';

interface MatchUser {
  id: number;
  email: string;
  name: string;
  description?: string | null;
  location?: string | null;
  sports?: string | null;
  skillLevel?: string;
  compatibility?: number;
}

interface MatchesListProps {
  matches: MatchUser[];
  currentSports: string[];
  onOpenChat: (location: string, sport: string) => void;
}

export function MatchesList({ matches, currentSports, onOpenChat }: MatchesListProps) {
  return (
    <div className={styles.matchesWrapper}>
      <h2 className={styles.title}>
        <span>🔥</span> Compatible Sports Matches
      </h2>
      
      {matches.length === 0 ? (
        <p className={styles.emptyText}>
          No active matches found nearby yet. Try checking in or updating your sports!
        </p>
      ) : (
        <div className={styles.cardList}>
          {matches.map((match) => {
            const matchSports = match.sports ? match.sports.split(',').filter(Boolean) : [];
            const sharedSports = matchSports.filter((sport) => currentSports.includes(sport));
            const defaultSport = sharedSports[0] || 'Sports'; 

            return (
              <div key={match.id} className={styles.matchCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.athleteName}>
                      {match.name}
                      <span className={styles.skillBadge}>
                        {match.skillLevel || 'Intermediate'}
                      </span>
                    </h3>
                    <p className={styles.locationText}>📍 {match.location}</p>
                    {match.description && (
                      <p className={styles.bioBlock}>
                        "{match.description}"
                      </p>
                    )}
                  </div>

                  <div>
                    <span className={styles.compatBadge}>
                      ⚡ {match.compatibility || 75}% Match
                    </span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.pillsRow}>
                    {sharedSports.map((sport) => (
                      <span key={sport} className={styles.sportPill}>
                        {sport}
                      </span>
                    ))}
                  </div>

                  <button 
                    onClick={() => onOpenChat(match.location || 'Global', defaultSport)}
                    className={styles.chatButton}
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