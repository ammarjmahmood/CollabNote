import React, { useState } from 'react';
import './settings.css';

const Settings = ({ viewMode, onViewModeChange, user }) => {
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [autoSave, setAutoSave] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [autoFormat, setAutoFormat] = useState(true);
  const [timeout, setTimeout] = useState('5000');
  
  const handleThemeChange = (e) => {
    setTheme(e.target.value);
    // In a real implementation, this would apply the theme change
    document.documentElement.setAttribute('data-theme', e.target.value);
  };
  
  const handleFontSizeChange = (e) => {
    setFontSize(e.target.value);
    // Store preference in local storage
    localStorage.setItem('editorFontSize', e.target.value);
  };
  
  const handleExport = (format) => {
    alert(`Exporting as ${format} is not implemented in this demo.`);
    // In a real implementation, this would trigger an API call to export the notebook
  };
  
  return (
    <div className="settings">
      <h2>Settings</h2>
      
      <div className="settings-section">
        <h3>User Profile</h3>
        <div className="profile-info">
          <div 
            className="user-avatar large" 
            style={{ backgroundColor: user.color }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <div className="form-group">
              <label>Display Name</label>
              <input 
                type="text" 
                value={user.name}
                readOnly 
              />
              <p className="help-text">To change your display name, please log out and log in with a new name.</p>
            </div>
            <div className="form-group">
              <label>User ID</label>
              <input 
                type="text" 
                value={user.id}
                readOnly 
              />
              <p className="help-text">This is your unique identifier in the system.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>View Preferences</h3>
        <div className="form-group">
          <label>Notebook Layout</label>
          <div className="radio-group">
            <label className="radio-label">
              <input 
                type="radio" 
                name="viewMode" 
                value="scroll" 
                checked={viewMode === 'scroll'} 
                onChange={() => onViewModeChange('scroll')} 
              />
              Scroll View (Vertical)
            </label>
            <div className="view-example scroll">
              <div className="example-cell"></div>
              <div className="example-cell"></div>
              <div className="example-cell"></div>
            </div>
          </div>
          
          <div className="radio-group">
            <label className="radio-label">
              <input 
                type="radio" 
                name="viewMode" 
                value="sideBySide" 
                checked={viewMode === 'sideBySide'} 
                onChange={() => onViewModeChange('sideBySide')} 
              />
              Side-by-Side View (Notebook Style)
            </label>
            <div className="view-example side-by-side">
              <div className="example-cell"></div>
              <div className="example-cell"></div>
              <div className="example-cell"></div>
              <div className="example-cell"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Appearance</h3>
        <div className="form-group">
          <label>Color Theme</label>
          <select 
            className="theme-selector" 
            value={theme} 
            onChange={handleThemeChange}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </select>
          <p className="help-text">Choose the theme for the application interface.</p>
        </div>
        
        <div className="form-group">
          <label>Code Editor Font Size</label>
          <select 
            className="font-size-selector" 
            value={fontSize} 
            onChange={handleFontSizeChange}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
          <p className="help-text">Adjust the font size in code and markdown editors.</p>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Auto-save</h3>
        <div className="form-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)} 
            />
            Auto-save changes
          </label>
          <p className="help-text">Changes are saved automatically in real-time when collaborating.</p>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Code Execution</h3>
        <div className="form-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={showLineNumbers}
              onChange={(e) => setShowLineNumbers(e.target.checked)} 
            />
            Show line numbers in code cells
          </label>
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={autoFormat}
              onChange={(e) => setAutoFormat(e.target.checked)} 
            />
            Auto-format code on execution
          </label>
        </div>
        <div className="form-group">
          <label>Code Execution Timeout</label>
          <select 
            className="timeout-selector"
            value={timeout}
            onChange={(e) => setTimeout(e.target.value)}
          >
            <option value="3000">3 seconds</option>
            <option value="5000">5 seconds</option>
            <option value="10000">10 seconds</option>
          </select>
          <p className="help-text">Maximum time allowed for code execution before timeout.</p>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Export Options</h3>
        <div className="export-buttons">
          <button className="export-btn" onClick={() => handleExport('html')}>Export as HTML</button>
          <button className="export-btn" onClick={() => handleExport('markdown')}>Export as Markdown</button>
          <button className="export-btn" onClick={() => handleExport('pdf')}>Export as PDF</button>
          <button className="export-btn" onClick={() => handleExport('json')}>Export as JSON</button>
        </div>
        <p className="help-text">Export your notebook in various formats for sharing or publishing.</p>
      </div>
      
      <div className="settings-section">
        <h3>Keyboard Shortcuts</h3>
        <div className="shortcuts-list">
          <div className="shortcut-item">
            <span className="shortcut-keys">Ctrl+Enter</span>
            <span className="shortcut-desc">Execute code cell</span>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-keys">Shift+Enter</span>
            <span className="shortcut-desc">Create new cell below</span>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-keys">Ctrl+S</span>
            <span className="shortcut-desc">Save notebook</span>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-keys">Esc</span>
            <span className="shortcut-desc">Exit editing mode</span>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-keys">Ctrl+Up/Down</span>
            <span className="shortcut-desc">Move cell up/down</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;