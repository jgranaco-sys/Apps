import React, { useState } from 'react';
import { api } from '../api';

interface Props {
  onRoomCreated: (userId: string, nickname: string, roomCode: string, isAdmin: boolean) => void;
  onRoomJoined: (userId: string, nickname: string, roomCode: string, isAdmin: boolean) => void;
}

export default function Home({ onRoomCreated, onRoomJoined }: Props) {
  const [tab, setTab] = useState<'create' | 'join'>('create');

  // Create form state
  const [createNickname, setCreateNickname] = useState('');
  const [maxLocal, setMaxLocal] = useState(3);
  const [maxVisit, setMaxVisit] = useState(3);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [maxReps, setMaxReps] = useState(1);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Join form state
  const [joinNickname, setJoinNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const capacity = (maxLocal + 1) * (maxVisit + 1) * (allowDuplicates ? maxReps : 1);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    if (!createNickname.trim()) {
      setCreateError('Please enter a nickname');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await api.createRoom({
        nickname: createNickname.trim(),
        maxLocalScore: maxLocal,
        maxVisitScore: maxVisit,
        allowDuplicates,
        maxRepetitionsPerScore: maxReps,
      });
      onRoomCreated(res.userId, res.nickname, res.room.code, res.isAdmin);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError('');
    if (!joinNickname.trim()) {
      setJoinError('Please enter a nickname');
      return;
    }
    if (!joinCode.trim()) {
      setJoinError('Please enter a room code');
      return;
    }
    setJoinLoading(true);
    try {
      const res = await api.joinRoom(joinCode.trim().toUpperCase(), joinNickname.trim());
      onRoomJoined(res.userId, res.nickname, res.room.code, res.isAdmin);
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setJoinLoading(false);
    }
  }

  return (
    <div className="home-container">
      <div className="home-card">
        <h1 className="app-title">🏆 Score Room</h1>
        <p className="app-subtitle">Multiplayer score assignment game</p>

        <div className="tab-bar">
          <button
            className={`tab-btn ${tab === 'create' ? 'active' : ''}`}
            onClick={() => setTab('create')}
          >
            Create Room
          </button>
          <button
            className={`tab-btn ${tab === 'join' ? 'active' : ''}`}
            onClick={() => setTab('join')}
          >
            Join Room
          </button>
        </div>

        {tab === 'create' && (
          <form onSubmit={handleCreate} className="form">
            <div className="field">
              <label>Your Nickname</label>
              <input
                type="text"
                value={createNickname}
                onChange={(e) => setCreateNickname(e.target.value)}
                placeholder="Enter your nickname"
                maxLength={30}
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label>Max Local Score</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={maxLocal}
                  onChange={(e) => setMaxLocal(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label>Max Visit Score</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={maxVisit}
                  onChange={(e) => setMaxVisit(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={allowDuplicates}
                  onChange={(e) => setAllowDuplicates(e.target.checked)}
                />
                Allow duplicate scores
              </label>
            </div>

            {allowDuplicates && (
              <div className="field">
                <label>Max Repetitions per Score</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxReps}
                  onChange={(e) => setMaxReps(Number(e.target.value))}
                />
              </div>
            )}

            <div className="capacity-info">
              Room capacity: <strong>{capacity} players</strong>
              <span className="score-range">
                &nbsp;(scores {0}-{0} to {maxLocal}-{maxVisit})
              </span>
            </div>

            {createError && <div className="error-msg">{createError}</div>}

            <button type="submit" className="btn-primary" disabled={createLoading}>
              {createLoading ? 'Creating…' : 'Create Room'}
            </button>
          </form>
        )}

        {tab === 'join' && (
          <form onSubmit={handleJoin} className="form">
            <div className="field">
              <label>Your Nickname</label>
              <input
                type="text"
                value={joinNickname}
                onChange={(e) => setJoinNickname(e.target.value)}
                placeholder="Enter your nickname"
                maxLength={30}
              />
            </div>
            <div className="field">
              <label>Room Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character room code"
                maxLength={6}
                style={{ textTransform: 'uppercase', letterSpacing: '0.2em' }}
              />
            </div>

            {joinError && <div className="error-msg">{joinError}</div>}

            <button type="submit" className="btn-primary" disabled={joinLoading}>
              {joinLoading ? 'Joining…' : 'Join Room'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
