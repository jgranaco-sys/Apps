import { useState } from 'react';
import { api } from '../api';
import type { RoomData } from '../api';

interface Props {
  room: RoomData;
  userId: string;
  onRevealOpened: (room: RoomData) => void;
}

export default function AdminPanel({ room, userId, onRevealOpened }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shareUrl = `${window.location.origin}?join=${room.code}`;

  async function handleRevealOpen() {
    setError('');
    setLoading(true);
    try {
      const res = await api.revealOpen(room.code, userId);
      onRevealOpened(res.room);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to open reveal');
    } finally {
      setLoading(false);
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Room link copied to clipboard!');
    } catch {
      prompt('Copy this link:', shareUrl);
    }
  }

  return (
    <div className="admin-panel">
      <h3>👑 Admin Panel</h3>

      <div className="room-info-grid">
        <div className="info-item">
          <span className="info-label">Room Code</span>
          <span className="info-value room-code-display">{room.code}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Status</span>
          <span className={`status-badge status-${room.status.toLowerCase()}`}>{room.status}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Players</span>
          <span className="info-value">{room.userCount} / {room.capacity}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Score Range</span>
          <span className="info-value">0-0 to {room.maxLocalScore}-{room.maxVisitScore}</span>
        </div>
        {room.allowDuplicates && (
          <div className="info-item">
            <span className="info-label">Max Repetitions</span>
            <span className="info-value">{room.maxRepetitionsPerScore}x</span>
          </div>
        )}
      </div>

      <div className="admin-actions">
        <button className="btn-secondary" onClick={copyShareLink}>
          🔗 Copy Invite Link
        </button>

        {room.status === 'WAITING' && (
          <button
            className="btn-reveal"
            onClick={handleRevealOpen}
            disabled={loading}
          >
            {loading ? 'Opening…' : '🎲 Open Reveal Phase'}
          </button>
        )}

        {room.status === 'REVEAL_OPEN' && (
          <div className="status-notice reveal-open-notice">
            ✅ Reveal phase is open — players can now reveal their scores!
          </div>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="share-section">
        <span className="share-label">Invite link:</span>
        <code className="share-url">{shareUrl}</code>
      </div>
    </div>
  );
}
