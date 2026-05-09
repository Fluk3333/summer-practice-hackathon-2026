import styles from './ShowUpToday.module.css';

interface ShowUpTodayProps {
  status: boolean;
  onToggle: (status: boolean) => void;
}

export function ShowUpToday({ status, onToggle }: ShowUpTodayProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>⚡ Spontaneous Check-In</h2>
      <p className={styles.description}>
        Are you planning to run, play, or train today? Toggle your status to match with others in your area.
      </p>

      <div className={styles.buttonGrid}>
        <button
          onClick={() => onToggle(true)}
          className={`${styles.buttonBase} ${status ? styles.yesActive : styles.inactive}`}
        >
          <span className={styles.emoji}>🏃‍♂️</span>
          <span>ShowUpToday!</span>
        </button>

        <button
          onClick={() => onToggle(false)}
          className={`${styles.buttonBase} ${!status ? styles.noActive : styles.inactive}`}
        >
          <span className={styles.emoji}>🛌</span>
          <span>Resting Today</span>
        </button>
      </div>

      {status ? (
        <div className={`${styles.statusMessage} ${styles.statusActive}`}>
          <span>🟢</span> You are active. Local matches will see you!
        </div>
      ) : (
        <div className={`${styles.statusMessage} ${styles.statusInactive}`}>
          <span>⚪</span> You are offline. Check-in to find games.
        </div>
      )}
    </div>
  );
}