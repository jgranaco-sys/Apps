const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface RoomData {
  id: string;
  code: string;
  status: 'WAITING' | 'REVEAL_OPEN' | 'FINISHED';
  maxLocalScore: number;
  maxVisitScore: number;
  allowDuplicates: boolean;
  maxRepetitionsPerScore: number;
  capacity: number;
  userCount: number;
  createdAt: string;
}

export interface SummaryEntry {
  userId: string;
  nickname: string;
  isAdmin: boolean;
  revealed: boolean;
  score: string | null;
  revealedAt: string | null;
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}

export const api = {
  createRoom(body: {
    nickname: string;
    maxLocalScore: number;
    maxVisitScore: number;
    allowDuplicates: boolean;
    maxRepetitionsPerScore: number;
  }) {
    return request<{ room: RoomData; userId: string; nickname: string; isAdmin: boolean }>(
      '/api/rooms',
      { method: 'POST', body: JSON.stringify(body) }
    );
  },

  joinRoom(code: string, nickname: string) {
    return request<{ room: RoomData; userId: string; nickname: string; isAdmin: boolean }>(
      `/api/rooms/${code}/join`,
      { method: 'POST', body: JSON.stringify({ nickname }) }
    );
  },

  getRoom(code: string) {
    return request<{ room: RoomData }>(`/api/rooms/${code}`);
  },

  revealOpen(code: string, userId: string) {
    return request<{ room: RoomData }>(
      `/api/rooms/${code}/reveal-open`,
      { method: 'POST', body: JSON.stringify({ userId }) }
    );
  },

  revealMe(code: string, userId: string) {
    return request<{ localScore: number; visitScore: number; score: string }>(
      `/api/rooms/${code}/reveal-me`,
      { method: 'POST', body: JSON.stringify({ userId }) }
    );
  },

  getSummary(code: string) {
    return request<{ summary: SummaryEntry[] }>(`/api/rooms/${code}/summary`);
  },
};
