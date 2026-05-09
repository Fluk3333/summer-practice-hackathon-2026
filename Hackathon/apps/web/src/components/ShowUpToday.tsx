interface ShowUpTodayProps {
  status: boolean;
  onToggle: (status: boolean) => void;
}

export function ShowUpToday({ status, onToggle }: ShowUpTodayProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8 shadow-lg text-center">
      <h2 className="text-lg font-bold text-gray-200 mb-1">⚡ Spontaneous Check-In</h2>
      <p className="text-xs text-gray-400 mb-5 leading-relaxed max-w-xs mx-auto">
        Are you planning to run, play, or train today? Toggle your status to match with others in your area.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Yes Button */}
        <button
          onClick={() => onToggle(true)}
          className={`py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 border-2 ${
            status
              ? 'bg-emerald-600/25 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-950/40'
              : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'
          }`}
        >
          <span className="text-xl">🏃‍♂️</span>
          <span>ShowUpToday!</span>
        </button>

        {/* No Button */}
        <button
          onClick={() => onToggle(false)}
          className={`py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 border-2 ${
            !status
              ? 'bg-red-600/10 border-red-500/50 text-red-400'
              : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'
          }`}
        >
          <span className="text-xl">🛌</span>
          <span>Resting Today</span>
        </button>
      </div>

      {status ? (
        <div className="mt-4 text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 animate-pulse">
          <span>🟢</span> You are active. Local matches will see you!
        </div>
      ) : (
        <div className="mt-4 text-xs font-bold text-gray-500 flex items-center justify-center gap-1">
          <span>⚪</span> You are offline. Check-in to find games.
        </div>
      )}
    </div>
  );
}