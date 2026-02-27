import { create } from 'zustand';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  increment,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

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
  loading: boolean;
  
  // Initialization
  init: () => () => void; // returns unsubscribe function
  
  // Actions for Punters
  addRequest: (song: Song, requester: string) => Promise<void>;
  voteRequest: (requestId: string) => Promise<void>;
  
  // Actions for Admin
  addSongToPlaylist: (song: Omit<Song, 'id'>) => Promise<void>;
  removeSongFromPlaylist: (id: string) => Promise<void>;
  removeRequest: (id: string) => Promise<void>;
  clearAllRequests: () => Promise<void>;
  loadDemoSongs: (songs: Omit<Song, 'id'>[]) => Promise<void>;
}

export const useSongStore = create<SongStore>((set, get) => ({
  playlist: [],
  requests: [],
  loading: true,

  init: () => {
    const qSongs = query(collection(db, 'songs'), orderBy('title'));
    const qRequests = query(collection(db, 'requests'), orderBy('votes', 'desc'));

    const unsubSongs = onSnapshot(qSongs, (snapshot) => {
      const playlist = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
      set({ playlist, loading: false });
    });

    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SongRequest));
      set({ requests });
    });

    return () => {
      unsubSongs();
      unsubRequests();
    };
  },

  addRequest: async (song, requester) => {
    const existing = get().requests.find(r => r.id === song.id);
    if (existing) {
      const docRef = doc(db, 'requests', song.id);
      await updateDoc(docRef, { votes: increment(1) });
    } else {
      await setDoc(doc(db, 'requests', song.id), {
        title: song.title,
        artist: song.artist,
        requestedBy: requester,
        timestamp: Date.now(),
        votes: 1
      });
    }
  },

  voteRequest: async (id) => {
    const docRef = doc(db, 'requests', id);
    await updateDoc(docRef, { votes: increment(1) });
  },

  addSongToPlaylist: async (song) => {
    await addDoc(collection(db, 'songs'), song);
  },

  removeSongFromPlaylist: async (id) => {
    await deleteDoc(doc(db, 'songs', id));
  },

  removeRequest: async (id) => {
    await deleteDoc(doc(db, 'requests', id));
  },

  clearAllRequests: async () => {
    const { requests } = get();
    for (const req of requests) {
      await deleteDoc(doc(db, 'requests', req.id));
    }
  },

  loadDemoSongs: async (songs) => {
    const batch = writeBatch(db);
    songs.forEach((song) => {
      const newDocRef = doc(collection(db, 'songs'));
      batch.set(newDocRef, song);
    });
    await batch.commit();
  }
}));
