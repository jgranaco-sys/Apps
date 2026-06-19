import type { SummaryEntry } from '../api';

interface Props {
  summary: SummaryEntry[];
  roomStatus: string;
}

export default function SummaryBoard({ summary, roomStatus }: Props) {
  const revealed = summary.filter((e) => e.revealed);
  const waiting = summary.filter((e) => !e.revealed);

  return (
    <div className="summary-board">
      <h3>
        📊 Summary Board
        <span className="summary-count">
          {revealed.length}/{summary.length} revealed
        </span>
      </h3>

      {summary.length === 0 ? (
        <p className="empty-msg">No players yet.</p>
      ) : (
        <ul className="summary-list">
          {summary.map((entry) => (
            <li key={entry.userId} className={`summary-item ${entry.revealed ? 'revealed' : 'hidden-score'}`}>
              <span className="player-name">
                {entry.isAdmin && <span className="admin-crown">👑 </span>}
                {entry.nickname}
              </span>
              <span className="player-score">
                {entry.revealed ? (
                  <strong className="score-badge">{entry.score}</strong>
                ) : roomStatus === 'WAITING' ? (
                  <span className="score-locked">🔒 Hidden</span>
                ) : (
                  <span className="score-pending">⏳ Pending reveal</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {waiting.length > 0 && roomStatus === 'REVEAL_OPEN' && (
        <p className="waiting-hint">
          {waiting.length} player{waiting.length !== 1 ? 's' : ''} yet to reveal their score.
        </p>
      )}
    </div>
  );
}
