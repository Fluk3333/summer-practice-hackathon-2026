import styles from './UserList.module.css';

interface User {
  id: number;
  email: string;
  name: string;
  location?: string | null;
  sports?: string | null;
}

interface UserListProps {
  users: User[];
  currentUserId?: number;
  onDelete: (id: number) => void;
}

export function UserList({ users, currentUserId, onDelete }: UserListProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Community Directory</h2>
      
      {users.length === 0 ? (
        <p className={styles.emptyText}>No athletes registered yet.</p>
      ) : (
        users.map((u) => {
          // Parse comma-separated sports string into an array cleanly
          const sportsList = u.sports ? u.sports.split(',').filter(Boolean) : [];
          const isMe = u.id === currentUserId;

          return (
            <div 
              key={u.id} 
              className={`${styles.card} ${isMe ? styles.cardMe : ''}`}
            >
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.nameText}>
                    {u.name} 
                    {isMe && <span className={styles.meBadge}>You</span>}
                  </h3>
                  <p className={styles.emailText}>{u.email}</p>
                  
                  {/* Render Location conditions */}
                  {u.location ? (
                    <p className={styles.location}>
                      <span>📍</span> <span>{u.location}</span>
                    </p>
                  ) : (
                    <p className={styles.noLocation}>No location added</p>
                  )}
                </div>

                <button
                  onClick={() => onDelete(u.id)}
                  className={styles.removeButton}
                >
                  Remove
                </button>
              </div>


              {sportsList.length > 0 && (
                <div className={styles.sportsDivider}>
                  {sportsList.map((sport) => (
                    <span key={sport} className={styles.sportTag}>
                      {sport}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}