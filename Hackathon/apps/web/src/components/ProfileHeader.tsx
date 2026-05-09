import { useAuth0 } from '@auth0/auth0-react';
import styles from './ProfileHeader.module.css';

export function ProfileHeader() {
  const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0();

  return (
    <div className={styles.headerWrapper}>
      {isAuthenticated && user ? (
        <div className={styles.userProfile}>
          {user.picture && (
            <img 
              src={user.picture} 
              alt={user.name} 
              className={styles.avatar} 
            />
          )}
          <div className={styles.userDetails}>
            <p className={styles.userName}>{user.name}</p>
            <p className={styles.userEmail}>{user.email}</p>
          </div>
        </div>
      ) : (
        <p className={styles.guestText}>Browsing as Guest</p>
      )}

      {isAuthenticated ? (
        <button 
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className={`${styles.buttonBase} ${styles.logoutButton}`}
        >
          Log Out
        </button>
      ) : (
        <button 
          onClick={() => loginWithRedirect()}
          className={`${styles.buttonBase} ${styles.loginButton}`}
        >
          Log In
        </button>
      )}
    </div>
  );
}