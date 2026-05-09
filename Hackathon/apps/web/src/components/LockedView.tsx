import { useAuth0 } from '@auth0/auth0-react';

export function LockedView() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="text-center py-12 bg-gray-800/50 rounded-2xl border border-gray-800 shadow-xl">
      <span className="text-5xl">🔒</span>
      <h2 className="text-xl font-bold mt-4 text-gray-200">Authorization Required</h2>
      <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
        Please sign in with Auth0 to access the secure AWS database vault.
      </p>
      <button 
        onClick={() => loginWithRedirect()}
        className="mt-6 bg-blue-600 hover:bg-blue-500 px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40"
      >
        Sign In Now
      </button>
    </div>
  );
}