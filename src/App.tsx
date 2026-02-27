import React, { useState } from 'react';
import { useSongStore } from './store';
import type { Song } from './store';
import { Music, Plus, ThumbsUp, Trash2, Mic2 } from 'lucide-react';
import './App.css';

const App: React.FC = () => {
  const { playlist, requests, addRequest, voteRequest, removeRequest } = useSongStore();
  const [requesterName, setRequesterName] = useState('');

  const handleRequest = (song: Song) => {
    const name = requesterName.trim() || 'Anonymous';
    addRequest(song, name);
  };

  return (
    <div className="app-container">
      <header>
        <h1><Mic2 className="icon-header" /> GigRequest</h1>
        <p>Request your favorite songs from the band!</p>
      </header>

      <main>
        <section className="controls">
          <input 
            type="text" 
            placeholder="Your Name (optional)" 
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            className="name-input"
          />
        </section>

        <div className="grid">
          <section className="playlist-section">
            <h2>Available Songs</h2>
            <div className="song-list">
              {playlist.map(song => (
                <div key={song.id} className="song-card">
                  <div className="song-info">
                    <Music size={18} />
                    <div>
                      <div className="song-title">{song.title}</div>
                      <div className="song-artist">{song.artist}</div>
                    </div>
                  </div>
                  <button onClick={() => handleRequest(song)} className="btn-request">
                    <Plus size={16} /> Request
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="requests-section">
            <h2>Queue</h2>
            <div className="request-list">
              {requests.length === 0 ? (
                <p className="empty-msg">No requests yet. Be the first!</p>
              ) : (
                requests
                  .sort((a, b) => b.votes - a.votes)
                  .map(req => (
                    <div key={req.id} className="request-card">
                      <div className="request-info">
                        <div className="votes-badge">{req.votes}</div>
                        <div>
                          <div className="song-title">{req.title}</div>
                          <div className="song-requester">Requested by {req.requestedBy}</div>
                        </div>
                      </div>
                      <div className="request-actions">
                        <button onClick={() => voteRequest(req.id)} className="btn-vote">
                          <ThumbsUp size={16} />
                        </button>
                        <button onClick={() => removeRequest(req.id)} className="btn-remove">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;
