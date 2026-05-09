import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth0 } from '@auth0/auth0-react';

// Modular Components
import { ToastContainer } from '../components/Toast';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileForm } from '../components/ProfileForm';
import { UserList } from '../components/UserList';
import { LockedView } from '../components/LockedView';

// Type Imports
import type { ToastType } from '../components/Toast';

interface User {
  id: number;
  email: string;
  name: string;
  location?: string | null;
  sports?: string | null;
}

const socket = io('http://localhost:3000');

function App() {
  const { user: auth0User, isAuthenticated, isLoading } = useAuth0();
  
  // Database States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [toasts, setToasts] = useState<ToastType[]>([]);

  // Profile Form States
  const [location, setLocation] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  // Toast Helpers
  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // 1. Fetch directories
  const fetchUsers = () => {
    fetch('http://localhost:3000/api/users')
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch(() => showToast('Failed to fetch user directory.', 'error'));
  };

  // 2. Sync logged-in Auth0 user to our database
  useEffect(() => {
    if (isAuthenticated && auth0User) {
      fetch('http://localhost:3000/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: auth0User.name, email: auth0User.email }),
      })
        .then((res) => res.json())
        .then((dbUser: User) => {
          setCurrentUser(dbUser);
          setLocation(dbUser.location || '');
          setSelectedSports(dbUser.sports ? dbUser.sports.split(',').filter(Boolean) : []);
          fetchUsers();
        })
        .catch(() => showToast('Error syncing profile with local cloud DB.', 'error'));
    } else {
      setCurrentUser(null);
    }
  }, [isAuthenticated, auth0User]);

  // 3. Real-time Sockets listening logic
  useEffect(() => {
    socket.on('user_created', (newUser: User) => {
      showToast(`New athlete registered: ${newUser.name}! 🚀`, 'success');
      fetchUsers();
    });

    socket.on('user_deleted', (data: { id: number }) => {
      showToast(`A user was removed from the database. 🗑️`, 'error');
      setUsers((prev) => prev.filter((u) => u.id !== data.id));
      if (currentUser?.id === data.id) {
        setCurrentUser(null);
      }
    });

    socket.on('user_updated', (updatedUser: User) => {
      showToast(`${updatedUser.name} updated their matchmaking profile! ⚡`, 'success');
      fetchUsers();
      // Update local state if the edited user was actually us!
      if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
      }
    });

    return () => {
      socket.off('user_created');
      socket.off('user_deleted');
      socket.off('user_updated');
    };
  }, [currentUser]);

  // Handle Sport Button Click toggles
  const handleToggleSport = (sport: string) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  // Submit Profile Form Updates to AWS
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const response = await fetch(`http://localhost:3000/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          sports: selectedSports.join(','), // Save array of sports as comma-separated text
        }),
      });
      const data = await response.json();
      setCurrentUser(data);
    } catch (err) {
      showToast('Error syncing preferences to AWS Vault.', 'error');
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await fetch(`http://localhost:3000/api/users/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      showToast('Error executing database deletion.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium text-gray-300 animate-pulse">Verifying Security Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans relative overflow-x-hidden">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="max-w-md mx-auto">
        <ProfileHeader />

        {isAuthenticated ? (
          <>
            <h1 className="text-3xl font-bold mb-8 text-blue-400 text-center">ShowUp2Move</h1>
            
            <ProfileForm
              location={location}
              setLocation={setLocation}
              selectedSports={selectedSports}
              toggleSport={handleToggleSport}
              onSubmit={handleProfileSubmit}
            />

            <UserList 
              users={users} 
              currentUserId={currentUser?.id}
              onDelete={handleDeleteUser} 
            />
          </>
        ) : (
          <LockedView />
        )}
      </div>
    </div>
  );
}

export default App;