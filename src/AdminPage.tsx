import React, { useState } from 'react';
import { useSongStore } from './store';
import { Trash2, Plus, LogOut, Settings, ListMusic, History, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import demoSongs from './demo-songs.json';

const AdminPage: React.FC = () => {
  const { playlist, requests, addSongToPlaylist, removeSongFromPlaylist, removeRequest, clearAllRequests, loadDemoSongs } = useSongStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [newSong, setNewSong] = useState({ title: '', artist: '' });
  const [isUploading, setIsUploading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'gig2026') { // Simple prototype password
      setIsAuthenticated(true);
    } else {
      alert('Wrong password!');
    }
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSong.title && newSong.artist) {
      await addSongToPlaylist(newSong);
      setNewSong({ title: '', artist: '' });
    }
  };

  const handleLoadDemo = async () => {
    if (window.confirm('This will add the demo song list to your current playlist. Continue?')) {
      setIsUploading(true);
      try {
        await loadDemoSongs(demoSongs);
        alert('Demo songs loaded successfully!');
      } catch (error) {
        console.error('Error loading demo songs:', error);
        alert('Failed to load demo songs.');
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

      <div className="admin-grid">
        <section className="manage-songs">
          <h2><ListMusic /> Manage Playlist</h2>
          <form onSubmit={handleAddSong} className="add-song-form">
            <input 
              placeholder="Song Title" 
              value={newSong.title}
              onChange={e => setNewSong({...newSong, title: e.target.value})}
            />
            <input 
              placeholder="Artist" 
              value={newSong.artist}
              onChange={e => setNewSong({...newSong, artist: e.target.value})}
            />
            <button type="submit"><Plus size={18}/> Add Song</button>
          </form>

          <div className="admin-list">
            {playlist.map(song => (
              <div key={song.id} className="admin-item">
                <span><strong>{song.title}</strong> - {song.artist}</span>
                <button onClick={() => removeSongFromPlaylist(song.id)} className="btn-delete"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </section>

        <section className="manage-requests">
          <div className="section-header">
            <h2><History /> Active Requests</h2>
            <button onClick={clearAllRequests} className="btn-clear">Clear All</button>
          </div>
          <div className="admin-list">
            {requests.map(req => (
              <div key={req.id} className="admin-item request-item">
                <div className="req-meta">
                  <span className="votes-count">{req.votes}</span>
                  <strong>{req.title}</strong>
                </div>
                <button onClick={() => removeRequest(req.id)} className="btn-delete"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPage;
