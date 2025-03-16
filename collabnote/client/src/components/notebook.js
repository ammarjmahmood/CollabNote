import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { v4 as uuidv4 } from 'uuid';
import './notebook.css';

const Notebook = ({ socket, user, viewMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notebook, setNotebook] = useState(null);
  const [cells, setCells] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [cellOperations, setCellOperations] = useState({});
  const titleInputRef = useRef(null);
  
  // Auto-scroll to the cell being edited
  const cellRefs = useRef({});
  
  useEffect(() => {
    if (socket) {
      setLoading(true);
      socket.emit('join-notebook', { notebookId: id, userId: user.id });
      
      // Listen for the notebook data
      socket.on('notebook-data', (data) => {
        setNotebook(data.notebook);
        setCells(data.cells);
        setTempTitle(data.notebook.title);
        setLoading(false);
      });
      
      // Listen for individual cell updates
      socket.on('cell-update', (updatedCell) => {
        setCells(prevCells => 
          prevCells.map(cell => 
            cell.id === updatedCell.id ? updatedCell : cell
          )
        );
      });
      
      // Listen for active users in this notebook
      socket.on('active-users', (users) => {
        setActiveUsers(users);
      });
      
      // Listen for errors
      socket.on('error', (err) => {
        setError(err.message);
        setLoading(false);
      });
      
      // Cleanup listeners when unmounting
      return () => {
        socket.emit('leave-notebook', { notebookId: id, userId: user.id });
        socket.off('notebook-data');
        socket.off('cell-update');
        socket.off('active-users');
        socket.off('error');
      };
    }
  }, [socket, id, user.id]);
  
  // Effect to scroll to cell or focus title input
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [editingTitle]);
  
  const handleTitleClick = () => {
    setEditingTitle(true);
  };
  
  const handleTitleChange = (e) => {
    setTempTitle(e.target.value);
  };
  
  const handleTitleBlur = () => {
    if (tempTitle.trim() !== notebook.title) {
      socket.emit('update-notebook', {
        notebookId: id,
        title: tempTitle.trim() || 'Untitled Notebook',
        userId: user.id
      });
    }
    setEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    }
  };
  
  const handleCellChange = (cellId, content) => {
    // Update the cell locally immediately for a responsive feel
    setCells(prevCells => 
      prevCells.map(cell => 
        cell.id === cellId ? { ...cell, content } : cell
      )
    );
    
    // Debounce the socket update to avoid too many updates
    if (cellOperations[cellId]) {
      clearTimeout(cellOperations[cellId]);
    }
    
    const timeoutId = setTimeout(() => {
      if (socket) {
        socket.emit('update-cell', {
          notebookId: id,
          cellId,
          content,
          userId: user.id
        });
      }
      
      // Clear this operation from tracking
      setCellOperations(prev => {
        const newOps = { ...prev };
        delete newOps[cellId];
        return newOps;
      });
    }, 500); // 500ms debounce
    
    setCellOperations(prev => ({
      ...prev,
      [cellId]: timeoutId
    }));
  };
  
  const addCell = (type, position) => {
    const newCell = {
      id: uuidv4(),
      type,
      content: type === 'markdown' ? '# New markdown cell' : '// New code cell',
      createdBy: user.id,
      createdAt: new Date().toISOString()
    };
    
    if (socket) {
      socket.emit('add-cell', {
        notebookId: id,
        cell: newCell,
        position
      });
    }
  };
  
  const deleteCell = (cellId) => {
    if (socket) {
      socket.emit('delete-cell', {
        notebookId: id,
        cellId
      });
    }
  };
  
  const moveCell = (cellId, direction) => {
    const index = cells.findIndex(cell => cell.id === cellId);
    if ((direction === 'up' && index > 0) || 
        (direction === 'down' && index < cells.length - 1)) {
      
      const newCells = [...cells];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newCells[index], newCells[targetIndex]] = [newCells[targetIndex], newCells[index]];
      
      // Send all cells to update the order
      if (socket) {
        socket.emit('update-cells-order', {
          notebookId: id,
          cells: newCells,
          userId: user.id
        });
      }
      
      // Update local state immediately
      setCells(newCells);
    }
  };
  
  const executeCodeCell = (cellId, code) => {
    if (socket) {
      socket.emit('execute-code', {
        notebookId: id,
        cellId,
        code,
        userId: user.id
      });
      
      // Set a temporary "Running..." message
      setCells(prevCells => 
        prevCells.map(cell => 
          cell.id === cellId ? { ...cell, output: 'Running...' } : cell
        )
      );
    }
  };
  
  const handleKeyDown = (e, cellId, index) => {
    // Shift+Enter to add a new cell below
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      const cell = cells.find(c => c.id === cellId);
      addCell(cell.type, index + 1);
    }
    
    // Ctrl+Enter to execute code cell
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      const cell = cells.find(c => c.id === cellId);
      if (cell.type === 'code') {
        executeCodeCell(cellId, cell.content);
      }
    }
  };
  
  const renderCellContent = (cell) => {
    if (cell.type === 'markdown') {
      return (
        <div className="markdown-cell" ref={el => cellRefs.current[cell.id] = el}>
          <textarea
            value={cell.content}
            onChange={(e) => handleCellChange(cell.id, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, cell.id, cells.indexOf(cell))}
            placeholder="Write markdown here..."
            className="cell-editor"
          />
          <div className="markdown-preview">
            <ReactMarkdown>{cell.content}</ReactMarkdown>
          </div>
        </div>
      );
    } else {
      return (
        <div className="code-cell" ref={el => cellRefs.current[cell.id] = el}>
          <textarea
            value={cell.content}
            onChange={(e) => handleCellChange(cell.id, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, cell.id, cells.indexOf(cell))}
            placeholder="Write JavaScript code here..."
            className="cell-editor"
          />
          <div className="code-preview">
            <SyntaxHighlighter language="javascript" style={atomDark}>
              {cell.content}
            </SyntaxHighlighter>
          </div>
          <button 
            onClick={() => executeCodeCell(cell.id, cell.content)}
            className="run-code"
          >
            Run
          </button>
          {cell.output && (
            <div className="code-output">
              <pre>{cell.output}</pre>
            </div>
          )}
        </div>
      );
    }
  };
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading notebook...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="back-button">
          Back to Notebooks
        </button>
      </div>
    );
  }
  
  if (!notebook) {
    return (
      <div className="error-container">
        <h2>Notebook Not Found</h2>
        <p>The notebook you're looking for doesn't exist or you don't have access to it.</p>
        <button onClick={() => navigate('/')} className="back-button">
          Back to Notebooks
        </button>
      </div>
    );
  }
  
  return (
    <div className="notebook">
      <div className="notebook-header">
        {editingTitle ? (
          <input
            type="text"
            ref={titleInputRef}
            value={tempTitle}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="notebook-title-input"
          />
        ) : (
          <h1 className="notebook-title" onClick={handleTitleClick}>
            {notebook.title}
          </h1>
        )}
        <div className="active-users-container">
          <div className="active-users">
            {activeUsers.map(activeUser => (
              <div key={activeUser.id} className="active-user">
                <div 
                  className="avatar" 
                  style={{ backgroundColor: activeUser.color }}
                  title={activeUser.name}
                >
                  {activeUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{activeUser.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className={`cells-container ${viewMode}`}>
        {cells.map((cell, index) => (
          <div key={cell.id} className="cell">
            <div className="cell-tools">
              <button onClick={() => addCell('markdown', index)}>+ Markdown</button>
              <button onClick={() => addCell('code', index)}>+ Code</button>
              <button onClick={() => moveCell(cell.id, 'up')} disabled={index === 0}>
                ↑
              </button>
              <button onClick={() => moveCell(cell.id, 'down')} disabled={index === cells.length - 1}>
                ↓
              </button>
              <button onClick={() => deleteCell(cell.id)}>Delete</button>
              <div className="cell-info">
                {cell.lastEditedBy && (
                  <span className="last-edited">
                    Last edited by {activeUsers.find(u => u.id === cell.lastEditedBy)?.name || 'Unknown'}
                  </span>
                )}
              </div>
            </div>
            
            {renderCellContent(cell)}
          </div>
        ))}
        
        <div className="add-cell-bottom">
          <button onClick={() => addCell('markdown', cells.length)}>+ Markdown</button>
          <button onClick={() => addCell('code', cells.length)}>+ Code</button>
        </div>
      </div>
      
      <div className="notebook-footer">
        <div className="shortcuts-info">
          <span><strong>Shift+Enter</strong>: Add new cell</span>
          <span><strong>Ctrl+Enter</strong>: Run code</span>
        </div>
        <div className="notebook-stats">
          <span>{cells.length} cells</span>
          <span>Created: {new Date(notebook.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default Notebook;