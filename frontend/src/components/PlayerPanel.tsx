import { useState } from 'react';
import { api } from '../api';
import type { RoomData } from '../api';

interface Props {
  room: RoomData;
  userId: string;
  nickname: string;
  myScore: string | null;
  onScoreRevealed: (score: string) => void;
}

export default function PlayerPanel({ room, userId, nickname, myScore, onScoreRevealed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRevealMe() {
    setError('');
    setLoading(true);
    try {
      const res = await api.revealMe(room.code, userId);
      onScoreRevealed(res.score);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reveal score');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="player-panel">
      <h3>🎮 Your Status</h3>
      <p className="player-nickname">Playing as: <strong>{nickname}</strong></p>

      {room.status === 'WAITING' && (
        <div className="status-notice waiting-notice">
          <span className="waiting-icon">⏳</span>
          <div>
            <strong>Waiting for admin to open reveal phase...</strong>
            <p>Your score has been secretly assigned. Hang tight!</p>
          </div>
        </div>
      )}

      {room.status === 'REVEAL_OPEN' && !myScore && (
        <div className="reveal-section">
          <div className="status-notice reveal-ready-notice">
            🎲 The reveal phase is open!
          </div>
          <button
            className="btn-reveal-me"
            onClick={handleRevealMe}
            disabled={loading}
          >
            {loading ? 'Revealing…' : '🔓 Reveal My Score!'}
          </button>
        </div>
      )}

      {myScore && (
        <div className="my-score-display">
          <div className="score-label">Your assigned score:</div>
          <div className="score-value">{myScore}</div>
          <p className="score-note">Local - Visiting</p>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}
    </div>
  );
}
