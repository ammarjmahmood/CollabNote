import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './navbar.css';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <h1>CollabNote</h1>
        </Link>
      </div>
      
      <div className="navbar-menu">
        <Link to="/" className={`navbar-item ${location.pathname === '/' ? 'active' : ''}`}>
          My Notebooks
        </Link>
        <Link to="/settings" className={`navbar-item ${location.pathname === '/settings' ? 'active' : ''}`}>
          Settings
        </Link>
      </div>
      
      <div className="navbar-user">
        <div 
          className="user-avatar" 
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="user-name">{user.name}</span>
        <button className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;