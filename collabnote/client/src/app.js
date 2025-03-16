import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import Navbar from './components/navbar';
import Notebook from './components/notebook';
import Settings from './components/settings';
import Login from './components/login';
import './app.css';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [notebooks, setNotebooks] = useState([]);
  const [viewMode, setViewMode] = useState('scroll'); // 'scroll' or 'sideBySide'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const newSocket = io(window.location.origin, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setError(null);
      
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          newSocket.emit('login', userData);
        } catch (err) {
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    });
    
    newSocket.on('connect_error', () => {
      setError('Failed to connect to server. Please try again later.');
      setLoading(false);
    });
    
    newSocket.on('notebooks', (data) => {
      setNotebooks(data);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  const handleLogin = (userData) => {
    // Add a random color for the user
    const userColors = [
      '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33F0',
      '#33FFF0', '#F0FF33', '#FF8033', '#8033FF', '#33FF80'
    ];
    const userWithColor = {
      ...userData,
      color: userColors[Math.floor(Math.random() * userColors.length)]
    };
    
    setUser(userWithColor);
    localStorage.setItem('user', JSON.stringify(userWithColor));
    
    if (socket) {
      socket.emit('login', userWithColor);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    if (socket) {
      socket.emit('logout');
    }
  };
  
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  };

  const handleCreateNotebook = () => {
    if (socket && user) {
      socket.emit('create-notebook', { userId: user.id });
    }
  };
  
  useEffect(() => {
    const savedViewMode = localStorage.getItem('viewMode');
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading CollabNote...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-screen">
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry Connection
        </button>
      </div>
    );
  }
  
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }
  
  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={
            <div className="notebooks-container">
              <h2 className="notebooks-title">My Notebooks</h2>
              <div className="notebooks-list">
                {notebooks.length > 0 ? (
                  notebooks.map(notebook => (
                    <div 
                      key={notebook.id} 
                      className="notebook-card"
                      onClick={() => window.location.href = `/notebook/${notebook.id}`}
                    >
                      <h3>{notebook.title}</h3>
                      <p>Last edited: {new Date(notebook.lastEdited).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="no-notebooks-message">No notebooks yet. Create your first one!</p>
                )}
                <button 
                  className="create-notebook-btn"
                  onClick={handleCreateNotebook}
                >
                  <span className="plus-icon">+</span>
                  <span>Create New Notebook</span>
                </button>
              </div>
            </div>
          } />
          <Route 
            path="/notebook/:id" 
            element={
              <Notebook 
                socket={socket} 
                user={user} 
                viewMode={viewMode}
              />
            } 
          />
          <Route 
            path="/settings" 
            element={
              <Settings 
                viewMode={viewMode} 
                onViewModeChange={handleViewModeChange}
                user={user}
              />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;