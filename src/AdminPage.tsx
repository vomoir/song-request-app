import React, { useState, useEffect } from 'react';
import { useSongStore } from './store';
import type { Song } from './store';
import { Trash2, Plus, LogOut, Settings, ListMusic, History, Download, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import demoSongs from './demo-songs.json';

const AdminPage: React.FC = () => {
  const { playlist, requests, addSongToPlaylist, softDeleteSong, removeRequest, clearAllRequests, loadDemoSongs, updateSong, init, loading, error } = useSongStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [newSong, setNewSong] = useState({ song_name: '', artist: '' });
  const [isUploading, setIsUploading] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSongName, setEditSongName] = useState('');
  const [editArtist, setEditArtist] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      const unsub = init();
      return () => unsub();
    }
  }, [isAuthenticated, init]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'gig2026') {
      setIsAuthenticated(true);
    } else {
      alert('Wrong password!');
    }
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSong.song_name && newSong.artist) {
      const success = await addSongToPlaylist(newSong);
      if (success) {
        setNewSong({ song_name: '', artist: '' });
      } else {
        alert("This song is already in your playlist!");
      }
    }
  };

  const handleStartEdit = (song: Song) => {
    setEditingId(song.id);
    setEditSongName(song.song_name);
    setEditArtist(song.artist);
  };

  const handleSaveEdit = async (id: string) => {
    if (editSongName && editArtist) {
      await updateSong(id, { song_name: editSongName, artist: editArtist });
      setEditingId(null);
    }
  };

  const handleLoadDemo = async () => {
    if (window.confirm('This will add the demo song list to your current playlist. Continue?')) {
      setIsUploading(true);
      try {
        const result = await loadDemoSongs(demoSongs);
        alert(`Finished! Added ${result.added} new songs, skipped ${result.skipped} duplicates.`);
      } catch (err: any) {
        alert("Error loading demo songs: " + err.message);
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <form onSubmit={handleLogin} className="login-card">
          <h2>Admin Access</h2>
          <input 
            type="password" 
            placeholder="Enter Admin Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Unlock</button>
          <Link to="/" className="back-link">Back to Punter View</Link>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1><Settings /> Band Dashboard</h1>
        <div className="header-actions">
          <button onClick={handleLoadDemo} className="btn-demo" disabled={isUploading}>
            <Download size={18}/> {isUploading ? 'Loading...' : 'Load Demo List'}
          </button>
          <button onClick={() => setIsAuthenticated(false)} className="btn-logout"><LogOut size={18}/> Logout</button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>Error loading data: {error}. Check your Firestore Rules!</span>
        </div>
      )}

      <div className="admin-grid">
        <section className="manage-songs">
          <h2><ListMusic /> Manage Playlist</h2>
          <form onSubmit={handleAddSong} className="add-song-form">
            <input 
              placeholder="Song Title" 
              value={newSong.song_name}
              onChange={e => setNewSong({...newSong, song_name: e.target.value})}
            />
            <input 
              placeholder="Artist" 
              value={newSong.artist}
              onChange={e => setNewSong({...newSong, artist: e.target.value})}
            />
            <button type="submit"><Plus size={18}/> Add Song</button>
          </form>

          <div className="admin-list">
            {loading ? (
              <p className="status-msg">Connecting to Firestore...</p>
            ) : playlist.length === 0 ? (
              <p className="status-msg">No songs found. Use "Load Demo List" to start.</p>
            ) : (
              playlist.map(song => (
                <div key={song.id} className="admin-item">
                  {editingId === song.id ? (
                    <div className="edit-mode-inputs">
                      <input value={editSongName} onChange={e => setEditSongName(e.target.value)} />
                      <input value={editArtist} onChange={e => setEditArtist(e.target.value)} />
                      <div className="edit-actions">
                        <button onClick={() => handleSaveEdit(song.id)} className="btn-save"><Check size={16}/></button>
                        <button onClick={() => setEditingId(null)} className="btn-cancel"><X size={16}/></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span><strong>{song.song_name}</strong> - {song.artist}</span>
                      <div className="admin-item-actions">
                        <button onClick={() => handleStartEdit(song)} className="btn-edit"><Edit2 size={16}/></button>
                        <button onClick={() => softDeleteSong(song.id)} className="btn-delete"><Trash2 size={16}/></button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="manage-requests">
          <div className="section-header">
            <h2><History /> Active Requests</h2>
            <button onClick={clearAllRequests} className="btn-clear">Clear All</button>
          </div>
          <div className="admin-list">
            {requests.length === 0 ? (
              <p className="status-msg">No active requests.</p>
            ) : (
              requests.map(req => (
                <div key={req.id} className="admin-item request-item">
                  <div className="req-meta">
                    <span className="votes-count">{req.votes}</span>
                    <strong>{req.song_name}</strong>
                  </div>
                  <button onClick={() => removeRequest(req.id)} className="btn-delete"><Trash2 size={16}/></button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPage;
