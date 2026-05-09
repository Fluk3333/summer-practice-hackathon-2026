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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold border-b border-gray-700 pb-2 text-gray-300">Community Directory</h2>
      {users.length === 0 ? (
        <p className="text-gray-500 text-center py-6 text-sm italic">No athletes registered yet.</p>
      ) : (
        users.map((u) => {
          // Parse comma-separated sports string into an array
          const sportsList = u.sports ? u.sports.split(',').filter(Boolean) : [];
          const isMe = u.id === currentUserId;

          return (
            <div key={u.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-200">
                    {u.name} {isMe && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded ml-1">You</span>}
                  </h3>
                  <p className="text-gray-400 text-xs mb-2">{u.email}</p>
                  
                  {/* Render Location if present */}
                  {u.location ? (
                    <p className="text-gray-300 text-xs flex items-center gap-1 mb-2">
                      📍 <span>{u.location}</span>
                    </p>
                  ) : (
                    <p className="text-gray-500 text-xs italic mb-2">No location added</p>
                  )}
                </div>

                <button
                  onClick={() => onDelete(u.id)}
                  className="text-red-500 hover:text-red-400 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg transition-all font-semibold text-xs"
                >
                  Remove
                </button>
              </div>

              {/* Render Sport Tags */}
              {sportsList.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-700/50">
                  {sportsList.map((sport) => (
                    <span key={sport} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">
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