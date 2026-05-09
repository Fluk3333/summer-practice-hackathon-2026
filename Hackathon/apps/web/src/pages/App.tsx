import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth0 } from "@auth0/auth0-react";

import { ToastContainer } from "../components/Toast";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProfileForm } from "../components/ProfileForm";
import { MatchesList } from "../components/MatchesList";
import { UserList } from "../components/UserList";
import { LockedView } from "../components/LockedView";
import { ChatRoom } from "../components/Chatroom";
import { ShowUpToday } from "../components/ShowUpToday";

import type { ToastType } from "../components/Toast";
import styles from "./App.module.css";

interface User {
  id: number;
  email: string;
  name: string;
  description?: string | null;
  skillLevel?: string;
  location?: string | null;
  sports?: string | null;
  showUpToday?: boolean;
}

const socket = io("http://localhost:3000");

function App() {
  const { user: auth0User, isAuthenticated, isLoading } = useAuth0();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<User[]>([]);
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [skillLevel, setSkillLevel] = useState("Intermediate");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [showUpTodayStatus, setShowUpTodayStatus] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const fetchUsers = () => {
    fetch("http://localhost:3000/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch(() => showToast("Failed to fetch user directory.", "error"));
  };

  const fetchMatches = (userId: number) => {
    fetch(`http://localhost:3000/api/matches/${userId}`)
      .then((res) => res.json())
      .then((data) => setMatches(data))
      .catch(() =>
        showToast("Failed to calculate matchmaking combinations.", "error"),
      );
  };

  const handleOpenChat = (loc: string, sport: string) => {
    const formattedRoom = `${loc.replace(/\s+/g, "")}-${sport}`;
    setActiveRoom(formattedRoom);
  };

  useEffect(() => {
    if (isAuthenticated && auth0User) {
      fetch("http://localhost:3000/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: auth0User.name, email: auth0User.email }),
      })
        .then((res) => res.json())
        .then((dbUser: User) => {
          setCurrentUser(dbUser);
          setLocation(dbUser.location || "");
          setDescription(dbUser.description || "");
          setSkillLevel(dbUser.skillLevel || "Intermediate");
          setSelectedSports(
            dbUser.sports ? dbUser.sports.split(",").filter(Boolean) : [],
          );
          setShowUpTodayStatus(!!dbUser.showUpToday);
          fetchUsers();
          fetchMatches(dbUser.id);
        })
        .catch(() =>
          showToast("Error syncing profile with local cloud DB.", "error"),
        );
    } else {
      setCurrentUser(null);
      setMatches([]);
    }
  }, [isAuthenticated, auth0User]);

  useEffect(() => {
    socket.on("user_created", (newUser: User) => {
      showToast(`New athlete registered: ${newUser.name}! 🚀`, "success");
      fetchUsers();
    });

    socket.on("user_deleted", (data: { id: number }) => {
      showToast(`A user was removed from the database. 🗑️`, "error");
      setUsers((prev) => prev.filter((u) => u.id !== data.id));
      setMatches((prev) => prev.filter((m) => m.id !== data.id));
      if (currentUser?.id === data.id) {
        setCurrentUser(null);
      }
    });

    socket.on("user_updated", (updatedUser: User) => {
      showToast(
        `${updatedUser.name} updated their matchmaking profile! ⚡`,
        "success",
      );
      fetchUsers();
      if (currentUser) {
        fetchMatches(currentUser.id);
      }
      if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
        setShowUpTodayStatus(!!updatedUser.showUpToday);
      }
    });

    return () => {
      socket.off("user_created");
      socket.off("user_deleted");
      socket.off("user_updated");
    };
  }, [currentUser]);

  const handleToggleSport = (sport: string) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport],
    );
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/users/${currentUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location,
            description,
            skillLevel,
            sports: selectedSports.join(","),
            showUpToday: showUpTodayStatus,
          }),
        },
      );
      const data = await response.json();
      setCurrentUser(data);
      showToast("Profile updated successfully!", "success");
      fetchMatches(currentUser.id);
    } catch (err) {
      showToast("Error syncing preferences to AWS Vault.", "error");
    }
  };

  const handleToggleShowUpToday = async (nextStatus: boolean) => {
    if (!currentUser) return;
    try {
      const response = await fetch(
        `http://localhost:3000/api/users/${currentUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location,
            description,
            skillLevel,
            sports: selectedSports.join(","),
            showUpToday: nextStatus,
          }),
        },
      );
      const data = await response.json();
      setCurrentUser(data);
      setShowUpTodayStatus(nextStatus);
      showToast(
        nextStatus
          ? "You are checked in! Ready to match. 🏃‍♂️"
          : "Status marked as resting. 🛌",
        "success",
      );
      fetchMatches(currentUser.id);
    } catch (err) {
      showToast("Failed to execute spontaneous check-in.", "error");
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await fetch(`http://localhost:3000/api/users/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      showToast("Error executing database deletion.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Verifying Security Session...</p>
      </div>
    );
  }

  return (
    <div className={styles.appWrapper}>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className={styles.container}>
        <ProfileHeader />

        {isAuthenticated ? (
          <>
            <h1 className={styles.title}>ShowUp2Move</h1>

            {activeRoom && currentUser ? (
              <ChatRoom
                roomName={activeRoom}
                currentUser={{ id: currentUser.id, name: currentUser.name }}
                matchedUsers={matches.map((m) => ({ id: m.id, name: m.name }))}
                onClose={() => setActiveRoom(null)}
              />
            ) : (
              <>
                <ProfileForm
                  location={location}
                  setLocation={setLocation}
                  description={description}
                  setDescription={setDescription}
                  skillLevel={skillLevel}
                  setSkillLevel={setSkillLevel}
                  selectedSports={selectedSports}
                  toggleSport={handleToggleSport}
                  onSubmit={handleProfileSubmit}
                />

                <ShowUpToday
                  status={showUpTodayStatus}
                  onToggle={handleToggleShowUpToday}
                />

                {currentUser && showUpTodayStatus ? (
                  <MatchesList
                    matches={matches}
                    currentSports={selectedSports}
                    onOpenChat={handleOpenChat}
                  />
                ) : (
                  currentUser && (
                    <div className={styles.placeholderCard}>
                      <p className={styles.placeholderText}>
                        Check-in as <strong>"ShowUpToday!"</strong> to reveal
                        compatible sports groups in your area.
                      </p>
                    </div>
                  )
                )}

                <UserList
                  users={users}
                  currentUserId={currentUser?.id}
                  onDelete={handleDeleteUser}
                />
              </>
            )}
          </>
        ) : (
          <LockedView />
        )}
      </div>
    </div>
  );
}

export default App;