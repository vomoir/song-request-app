import { create } from 'zustand';

export interface Song {
  id: string;
  title: string;
  artist: string;
}

export interface SongRequest extends Song {
  requestedBy: string;
  timestamp: number;
  votes: number;
}

interface SongStore {
  playlist: Song[];
  requests: SongRequest[];
  addRequest: (song: Song, requester: string) => void;
  voteRequest: (id: string) => void;
  removeRequest: (id: string) => void;
}

export const useSongStore = create<SongStore>((set) => ({
  playlist: [
    { id: '1', title: 'Wonderwall', artist: 'Oasis' },
    { id: '2', title: 'Mr. Brightside', artist: 'The Killers' },
    { id: '3', title: 'Sweet Caroline', artist: 'Neil Diamond' },
    { id: '4', title: "Don't Stop Believin'", artist: 'Journey' },
    { id: '5', title: 'Bohemian Rhapsody', artist: 'Queen' },
    { id: '6', title: 'Seven Nation Army', artist: 'The White Stripes' },
    { id: '7', title: 'Smells Like Teen Spirit', artist: 'Nirvana' },
    { id: '8', title: 'Billie Jean', artist: 'Michael Jackson' },
  ],
  requests: [],
  addRequest: (song, requester) => set((state) => {
    // Check if already requested to prevent duplicates or just add a new instance
    const existing = state.requests.find(r => r.id === song.id);
    if (existing) {
        return {
            requests: state.requests.map(r => 
                r.id === song.id ? { ...r, votes: r.votes + 1 } : r
            )
        };
    }
    return {
      requests: [...state.requests, { ...song, requestedBy: requester, timestamp: Date.now(), votes: 1 }]
    };
  }),
  voteRequest: (id) => set((state) => ({
    requests: state.requests.map(r => r.id === id ? { ...r, votes: r.votes + 1 } : r)
  })),
  removeRequest: (id) => set((state) => ({
    requests: state.requests.filter(r => r.id !== id)
  })),
}));
