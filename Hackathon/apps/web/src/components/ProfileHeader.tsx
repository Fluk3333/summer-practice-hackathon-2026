import { useAuth0 } from '@auth0/auth0-react';

export function ProfileHeader() {
  const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0();

  return (
    <div className="flex justify-between items-center mb-8 bg-gray-800/80 p-4 rounded-xl border border-gray-700 shadow-md">
      {isAuthenticated && user ? (
        <div className="flex items-center gap-3">
          {user.picture && (
            <img 
              src={user.picture} 
              alt={user.name} 
              className="w-10 h-10 rounded-full border border-blue-500 shadow-sm" 
            />
          )}
          <div>
            <p className="font-bold text-sm text-gray-200">{user.name}</p>
            <p className="text-gray-400 text-xs truncate max-w-[150px]">{user.email}</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">Browsing as Guest</p>
      )}

      {isAuthenticated ? (
        <button 
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
        >
          Log Out
        </button>
      ) : (
        <button 
          onClick={() => loginWithRedirect()}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-900/30"
        >
          Log In
        </button>
      )}
    </div>
  );
}