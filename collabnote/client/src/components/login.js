import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './login.css';

const Login = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  useEffect(() => {
    // Focus the name input on mount
    const timer = setTimeout(() => {
      document.getElementById('name-input')?.focus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    
    setIsConnecting(true);
    
    // Create a user object with a unique ID
    const user = {
      id: uuidv4(),
      name: name.trim()
    };
    
    // Simulate connection delay for better UX
    setTimeout(() => {
      onLogin(user);
      setIsConnecting(false);
    }, 500);
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="app-title">CollabNote</h1>
        <h2>Collaborative Notebooks</h2>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
              type="text"
              id="name-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter your name to start"
              disabled={isConnecting}
            />
            {error && <p className="error-message">{error}</p>}
          </div>
          
          <button 
            type="submit" 
            className={`login-button ${isConnecting ? 'connecting' : ''}`}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <span className="spinner-small"></span>
                Connecting...
              </>
            ) : (
              'Start Collaborating'
            )}
          </button>
        </form>
        
        <div className="features">
          <h3>Features</h3>
          <ul>
            <li>
              <span className="feature-icon">📝</span>
              <span className="feature-text">Real-time collaborative editing</span>
            </li>
            <li>
              <span className="feature-icon">🧮</span>
              <span className="feature-text">Code and markdown cells</span>
            </li>
            <li>
              <span className="feature-icon">👥</span>
              <span className="feature-text">See who's currently editing</span>
            </li>
            <li>
              <span className="feature-icon">📲</span>
              <span className="feature-text">Choose between scroll or notebook layouts</span>
            </li>
            <li>
              <span className="feature-icon">🖥️</span>
              <span className="feature-text">Run JavaScript code directly in your notebook</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;