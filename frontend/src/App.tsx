import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Room from './pages/Room';
import './App.css';

interface Session {
  userId: string;
  nickname: string;
  roomCode: string;
  isAdmin: boolean;
}

const SESSION_KEY = 'score_room_session';

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Check URL for ?join=CODE auto-fill
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      // Clear any existing session so the home page shows with join tab prefilled
      clearSession();
      // Store join code in sessionStorage for Home to pick up
      sessionStorage.setItem('prefill_join_code', joinCode.toUpperCase());
      // Remove query param from URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    const saved = loadSession();
    if (saved) {
      setSession(saved);
    }
    setInitialized(true);
  }, []);

  function handleEnterRoom(
    userId: string,
    nickname: string,
    roomCode: string,
    isAdmin: boolean
  ) {
    const s: Session = { userId, nickname, roomCode, isAdmin };
    saveSession(s);
    setSession(s);
  }

  function handleLeave() {
    clearSession();
    setSession(null);
  }

  if (!initialized) return null;

  if (session) {
    return (
      <Room
        userId={session.userId}
        nickname={session.nickname}
        roomCode={session.roomCode}
        isAdmin={session.isAdmin}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <Home
      onRoomCreated={handleEnterRoom}
      onRoomJoined={handleEnterRoom}
    />
  );
}

export default App;
