import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useSongStore } from './store';
import type { Song } from './store';
import { Music, Plus, ThumbsUp, Mic2, ShieldCheck, AlertCircle, Clock, MessageCircleHeart } from 'lucide-react';
import AdminPage from './AdminPage';
import './App.css';

const PunterView: React.FC = () => {
  const { playlist, requests, addRequest, voteRequest, init, loading, error, lastRequestTime, unlockCooldown } = useSongStore();
  const [requesterName, setRequesterName] = useState('');
  const [minutesLeft, setMinutesLeft] = useState(0);

  // Update cooldown timer every minute
  useEffect(() => {
    const unsub = init();
    const checkCooldown = () => {
      if (lastRequestTime) {
        const remaining = 15 * 60 * 1000 - (Date.now() - lastRequestTime);
        setMinutesLeft(remaining > 0 ? Math.ceil(remaining / 60000) : 0);
      }
    };
    checkCooldown();
    const interval = setInterval(checkCooldown, 10000);
    return () => { unsub(); clearInterval(interval); };
  }, [init, lastRequestTime]);

  const handleRequest = async (song: Song, isBribe = false) => {
    const name = requesterName.trim() || 'Anonymous';
    const result = await addRequest(song, name, isBribe);
    if (!result.success && result.message) {
      alert(result.message);
    }
  };

  const handleBribe = () => {
    const paypalMe = "https://paypal.me/YOUR_USER_ID/5"; // Replace with your actual PayPal.Me link
    window.open(paypalMe, '_blank');
    
    // After they pay, they can manually unlock. 
    // In a real app we'd wait for a webhook, but for a gig, trust is fine.
    if (window.confirm("Once you have sent the $5 bribe, click OK to unlock your next request!")) {
      unlockCooldown();
    }
  };

  if (loading) return <div className="loading">Connecting to the gig...</div>;

  return (
    <div className="app-container">
      <header>
        <div className="admin-link-wrapper">
          <Link to="/admin" className="admin-link"><ShieldCheck size={16} /> Band Login</Link>
        </div>
        <h1><Mic2 className="icon-header" /> GigRequest</h1>
        <p>Request your favorite songs from the band!</p>
        
        {minutesLeft > 0 && (
          <div className="cooldown-container">
            <div className="cooldown-badge">
              <Clock size={16} /> Request cooldown: {minutesLeft} min
            </div>
            <button onClick={handleBribe} className="btn-bribe">
              <MessageCircleHeart size={18} /> Bribe the Band ($5)
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>Error connecting to the band's playlist: {error}.</span>
        </div>
      )}

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
                      <div className="song-name">{song.song_name}</div>
                      <div className="song-artist">{song.artist}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRequest(song)} 
                    className={`btn-request ${minutesLeft > 0 ? 'disabled' : ''}`}
                    disabled={minutesLeft > 0}
                  >
                    <Plus size={16} /> Request
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="requests-section">
            <h2>Queue</h2>
            <div className="request-list">
              {requests.map(req => (
                <div key={req.id} className="request-card">
                  <div className={`request-info ${req.isBribe ? 'bribe-info' : ''}`}>
                    <div className="votes-badge">{req.votes}</div>
                    <div>
                      <div className="song-name">
                        {req.song_name}
                        {req.isBribe && <span className="bribe-tag">💰 BRIBED</span>}
                      </div>
                      <div className="song-requester">Requested by {req.requestedBy}</div>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button onClick={() => voteRequest(req.id)} className="btn-vote">
                      <ThumbsUp size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PunterView />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
};

export default App;
