import { useAuth0 } from '@auth0/auth0-react';
import styles from './LockedView.module.css';

export function LockedView() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className={styles.lockedContainer}>
      <span className={styles.lockIcon}>🔒</span>
      <h2 className={styles.title}>Authorization Required</h2>
      <p className={styles.description}>
        Please sign in with Auth0 to access the secure AWS database vault.
      </p>
      <button 
        onClick={() => loginWithRedirect()}
        className={styles.loginButton}
      >
        Sign In Now
      </button>
    </div>
  );
}