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
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

export interface Song {
  id: string;
  song_name: string;
  artist: string;
  deleted?: boolean;
}

export interface SongRequest extends Song {
  requestedBy: string;
  timestamp: number;
  votes: number;
  isBribe?: boolean; // Flag for paid requests
}

interface SongStore {
  playlist: Song[];
  requests: SongRequest[];
  loading: boolean;
  error: string | null;
  lastRequestTime: number | null;
  
  init: () => () => void;
  
  addRequest: (song: Song, requester: string, isBribe?: boolean) => Promise<{ success: boolean; message?: string }>;
  voteRequest: (requestId: string) => Promise<void>;
  
  addSongToPlaylist: (song: Omit<Song, 'id'>) => Promise<boolean>;
  updateSong: (id: string, updates: Partial<Song>) => Promise<void>;
  softDeleteSong: (id: string) => Promise<void>;
  removeSongFromPlaylist: (id: string) => Promise<void>;
  removeRequest: (id: string) => Promise<void>;
  clearAllRequests: () => Promise<void>;
  loadDemoSongs: (songs: Omit<Song, 'id'>[]) => Promise<{ added: number, skipped: number }>;
  unlockCooldown: () => void;
}

const THROTTLE_TIME = 15 * 60 * 1000;

export const useSongStore = create<SongStore>((set, get) => ({
  playlist: [],
  requests: [],
  loading: true,
  error: null,
  lastRequestTime: Number(localStorage.getItem('last_request_timestamp')) || null,

  init: () => {
    set({ loading: true, error: null });
    
    const qSongs = query(collection(db, 'songs'));
    const qRequests = query(collection(db, 'requests'), orderBy('votes', 'desc'));

    const unsubSongs = onSnapshot(qSongs, (snapshot) => {
      const playlist = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Song))
        .filter(song => !song.deleted)
        .sort((a, b) => a.song_name.localeCompare(b.song_name));
      set({ playlist, loading: false });
    }, (error) => set({ error: error.message, loading: false }));

    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SongRequest));
      set({ requests });
    }, (error) => console.error(error));

    return () => { unsubSongs(); unsubRequests(); };
  },

  addRequest: async (song, requester, isBribe = false) => {
    const now = Date.now();
    const { lastRequestTime } = get();

    // Only check throttle if NOT a bribe
    if (!isBribe && lastRequestTime && (now - lastRequestTime < THROTTLE_TIME)) {
      return { success: false, message: "Cooldown active." };
    }

    try {
      const existing = get().requests.find(r => r.id === song.id);
      if (existing) {
        const docRef = doc(db, 'requests', song.id);
        await updateDoc(docRef, { 
          votes: increment(isBribe ? 10 : 1), // Bribes get a massive vote boost
          isBribe: isBribe || existing.isBribe 
        });
      } else {
        await setDoc(doc(db, 'requests', song.id), {
          song_name: song.song_name,
          artist: song.artist,
          requestedBy: requester,
          timestamp: now,
          votes: isBribe ? 10 : 1,
          isBribe: isBribe
        });
      }

      if (!isBribe) {
        set({ lastRequestTime: now });
        localStorage.setItem('last_request_timestamp', now.toString());
      }
      
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  unlockCooldown: () => {
    set({ lastRequestTime: null });
    localStorage.removeItem('last_request_timestamp');
  },

  // ... (keeping other methods same as before)
  voteRequest: async (id) => {
    const docRef = doc(db, 'requests', id);
    await updateDoc(docRef, { votes: increment(1) });
  },

  addSongToPlaylist: async (song) => {
    const { playlist } = get();
    const isDuplicate = playlist.some(s => s.song_name.toLowerCase() === song.song_name.toLowerCase() && s.artist.toLowerCase() === song.artist.toLowerCase());
    if (isDuplicate) return false;
    await addDoc(collection(db, 'songs'), { ...song, deleted: false });
    return true;
  },

  updateSong: async (id, updates) => {
    await updateDoc(doc(db, 'songs', id), updates);
  },

  softDeleteSong: async (id) => {
    await updateDoc(doc(db, 'songs', id), { deleted: true });
  },

  removeSongFromPlaylist: async (id) => {
    await deleteDoc(doc(db, 'songs', id));
  },

  removeRequest: async (id) => {
    await deleteDoc(doc(db, 'requests', id));
  },

  clearAllRequests: async () => {
    const { requests } = get();
    for (const req of requests) await deleteDoc(doc(db, 'requests', req.id));
  },

  loadDemoSongs: async (songs) => {
    const snapshot = await getDocs(collection(db, 'songs'));
    const currentSongs = snapshot.docs.map(doc => doc.data() as Song);
    const batch = writeBatch(db);
    let added = 0; let skipped = 0;
    songs.forEach((song) => {
      const exists = currentSongs.some(s => s.song_name.toLowerCase() === song.song_name.toLowerCase() && s.artist.toLowerCase() === song.artist.toLowerCase() && !s.deleted);
      if (!exists) {
        batch.set(doc(collection(db, 'songs')), { ...song, deleted: false });
        added++;
      } else skipped++;
    });
    if (added > 0) await batch.commit();
    return { added, skipped };
  }
}));
