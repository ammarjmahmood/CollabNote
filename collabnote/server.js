const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const { VM } = require('vm2');

const app = express();

// Configure CORS for Express
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

const DATA_DIR = path.join(__dirname, 'data');
const NOTEBOOKS_DIR = path.join(DATA_DIR, 'notebooks');

async function ensureDirectoriesExist() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(NOTEBOOKS_DIR, { recursive: true });
    console.log('Data directories created or confirmed');
  } catch (err) {
    console.error('Error creating directories:', err);
  }
}

// Run this immediately to ensure directories exist
ensureDirectoriesExist();

// Store active users and their color assignments
const activeUsers = {};
const userColors = [
  '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33F0',
  '#33FFF0', '#F0FF33', '#FF8033', '#8033FF', '#33FF80'
];

async function getNotebooks() {
  try {
    const files = await fs.readdir(NOTEBOOKS_DIR);
    const notebooks = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(NOTEBOOKS_DIR, file), 'utf8');
        try {
          const notebook = JSON.parse(content);
          notebooks.push({
            id: notebook.id,
            title: notebook.title,
            lastEdited: notebook.lastEdited,
            createdBy: notebook.createdBy,
            createdAt: notebook.createdAt
          });
        } catch (err) {
          console.error(`Error parsing notebook ${file}:`, err);
        }
      }
    }
    
    return notebooks.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));
  } catch (err) {
    console.error('Error reading notebooks:', err);
    return [];
  }
}

async function getNotebook(notebookId) {
  try {
    const filePath = path.join(NOTEBOOKS_DIR, `${notebookId}.json`);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading notebook ${notebookId}:`, err);
    return null;
  }
}

async function saveNotebook(notebook) {
  try {
    notebook.lastEdited = new Date().toISOString(); // Update last edited timestamp
    const filePath = path.join(NOTEBOOKS_DIR, `${notebook.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(notebook, null, 2), 'utf8');
    console.log(`Notebook ${notebook.id} saved successfully`);
    return true;
  } catch (err) {
    console.error(`Error saving notebook ${notebook.id}:`, err);
    return false;
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('login', async (userData) => {
    console.log('User logged in:', userData.name);
    const user = {
      id: userData.id,
      name: userData.name,
      color: userData.color || userColors[Math.floor(Math.random() * userColors.length)]
    };
    
    activeUsers[socket.id] = user;
    
    // Send notebooks to the newly logged in user
    const notebooks = await getNotebooks();
    socket.emit('notebooks', notebooks);
  });
  
  socket.on('logout', () => {
    console.log('User logged out:', activeUsers[socket.id]?.name);
    delete activeUsers[socket.id];
  });
  
  socket.on('create-notebook', async ({ userId }) => {
    console.log('Creating new notebook for user:', userId);
    const notebookId = uuidv4();
    const now = new Date().toISOString();
    
    const notebook = {
      id: notebookId,
      title: 'Untitled Notebook',
      cells: [
        {
          id: uuidv4(),
          type: 'markdown',
          content: '# Welcome to your new notebook\n\nStart writing in markdown here...',
          createdBy: userId,
          createdAt: now
        },
        {
          id: uuidv4(),
          type: 'code',
          content: '// Write some JavaScript code here\nconsole.log("Hello world!");',
          createdBy: userId,
          createdAt: now,
          output: null
        }
      ],
      createdBy: userId,
      createdAt: now,
      lastEdited: now
    };
    
    const saved = await saveNotebook(notebook);
    
    if (saved) {
      // Update notebooks list for all connected users
      const notebooks = await getNotebooks();
      io.emit('notebooks', notebooks);
    }
  });
  
  socket.on('join-notebook', async ({ notebookId, userId }) => {
    console.log(`User ${userId} joined notebook ${notebookId}`);
    socket.join(notebookId);
    
    // Send notebook data to the user
    const notebook = await getNotebook(notebookId);
    if (notebook) {
      socket.emit('notebook-data', {
        notebook: {
          id: notebook.id,
          title: notebook.title,
          createdBy: notebook.createdBy,
          createdAt: notebook.createdAt,
          lastEdited: notebook.lastEdited
        },
        cells: notebook.cells || []
      });
    } else {
      socket.emit('error', { message: 'Notebook not found' });
    }
    
    // Gather users currently in this notebook room and broadcast to all in the room
    const notebookUsers = [];
    for (const [socketId, user] of Object.entries(activeUsers)) {
      if (io.sockets.adapter.rooms.get(notebookId)?.has(socketId)) {
        notebookUsers.push(user);
      }
    }
    
    io.to(notebookId).emit('active-users', notebookUsers);
  });
  
  socket.on('leave-notebook', ({ notebookId, userId }) => {
    console.log(`User ${userId} left notebook ${notebookId}`);
    socket.leave(notebookId);
    
    // Update active users for this notebook
    const notebookUsers = [];
    for (const [socketId, user] of Object.entries(activeUsers)) {
      if (io.sockets.adapter.rooms.get(notebookId)?.has(socketId)) {
        notebookUsers.push(user);
      }
    }
    
    io.to(notebookId).emit('active-users', notebookUsers);
  });
  
  socket.on('update-notebook', async ({ notebookId, title, userId }) => {
    console.log(`Updating notebook ${notebookId} title to "${title}"`);
    const notebook = await getNotebook(notebookId);
    if (notebook) {
      notebook.title = title;
      
      await saveNotebook(notebook);
      
      // Broadcast updated notebook info to all users in the notebook
      io.to(notebookId).emit('notebook-data', {
        notebook: {
          id: notebook.id,
          title: notebook.title,
          createdBy: notebook.createdBy,
          createdAt: notebook.createdAt,
          lastEdited: notebook.lastEdited
        },
        cells: notebook.cells
      });
      
      // Update notebooks list for all connected users
      const notebooks = await getNotebooks();
      io.emit('notebooks', notebooks);
    }
  });
  
  socket.on('update-cell', async ({ notebookId, cellId, content, userId }) => {
    const notebook = await getNotebook(notebookId);
    if (notebook) {
      const cellIndex = notebook.cells.findIndex(cell => cell.id === cellId);
      if (cellIndex !== -1) {
        notebook.cells[cellIndex].content = content;
        notebook.cells[cellIndex].lastEdited = new Date().toISOString();
        notebook.cells[cellIndex].lastEditedBy = userId;
        
        await saveNotebook(notebook);
        
        // Broadcast updated cell to all users in the notebook
        io.to(notebookId).emit('cell-update', notebook.cells[cellIndex]);
      }
    }
  });
  
  socket.on('add-cell', async ({ notebookId, cell, position }) => {
    console.log(`Adding new ${cell.type} cell to notebook ${notebookId} at position ${position}`);
    const notebook = await getNotebook(notebookId);
    if (notebook) {
      notebook.cells.splice(position, 0, cell);
      
      await saveNotebook(notebook);
      
      // Broadcast updated notebook data to all users in the notebook
      io.to(notebookId).emit('notebook-data', {
        notebook: {
          id: notebook.id,
          title: notebook.title,
          createdBy: notebook.createdBy,
          createdAt: notebook.createdAt,
          lastEdited: notebook.lastEdited
        },
        cells: notebook.cells
      });
    }
  });
  
  socket.on('delete-cell', async ({ notebookId, cellId }) => {
    console.log(`Deleting cell ${cellId} from notebook ${notebookId}`);
    const notebook = await getNotebook(notebookId);
    if (notebook) {
      notebook.cells = notebook.cells.filter(cell => cell.id !== cellId);
      
      await saveNotebook(notebook);
      
      // Broadcast updated notebook data to all users in the notebook
      io.to(notebookId).emit('notebook-data', {
        notebook: {
          id: notebook.id,
          title: notebook.title,
          createdBy: notebook.createdBy,
          createdAt: notebook.createdAt,
          lastEdited: notebook.lastEdited
        },
        cells: notebook.cells
      });
    }
  });
  
  socket.on('update-cells-order', async ({ notebookId, cells, userId }) => {
    console.log(`Updating cell order in notebook ${notebookId}`);
    const notebook = await getNotebook(notebookId);
    if (notebook) {
      // Replace the cells array with the new ordered array
      notebook.cells = cells;
      notebook.lastEdited = new Date().toISOString();
      
      await saveNotebook(notebook);
      
      // Broadcast updated notebook data to all users in the notebook
      io.to(notebookId).emit('notebook-data', {
        notebook: {
          id: notebook.id,
          title: notebook.title,
          createdBy: notebook.createdBy,
          createdAt: notebook.createdAt,
          lastEdited: notebook.lastEdited
        },
        cells: notebook.cells
      });
    }
  });
  
  socket.on('execute-code', async ({ notebookId, cellId, code, userId }) => {
    console.log(`Executing code in cell ${cellId} of notebook ${notebookId}`);
    const notebook = await getNotebook(notebookId);
    if (notebook) {
      const cellIndex = notebook.cells.findIndex(cell => cell.id === cellId);
      if (cellIndex !== -1 && notebook.cells[cellIndex].type === 'code') {
        try {
          let output = '';
          const vm = new VM({
            timeout: 5000,
            sandbox: {
              console: {
                log: (...args) => {
                  output += args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
                  ).join(' ') + '\n';
                },
                error: (...args) => {
                  output += 'ERROR: ' + args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
                  ).join(' ') + '\n';
                },
                warn: (...args) => {
                  output += 'WARNING: ' + args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
                  ).join(' ') + '\n';
                }
              }
            }
          });
          
          vm.run(code);
          
          notebook.cells[cellIndex].output = output;
          notebook.cells[cellIndex].executedAt = new Date().toISOString();
          notebook.cells[cellIndex].executedBy = userId;
          
          await saveNotebook(notebook);
          
          // Broadcast updated cell to all users in the notebook
          io.to(notebookId).emit('cell-update', notebook.cells[cellIndex]);
        } catch (err) {
          notebook.cells[cellIndex].output = `Error: ${err.message}`;
          notebook.cells[cellIndex].executedAt = new Date().toISOString();
          notebook.cells[cellIndex].executedBy = userId;
          
          await saveNotebook(notebook);
          
          // Broadcast updated cell to all users in the notebook
          io.to(notebookId).emit('cell-update', notebook.cells[cellIndex]);
        }
      }
    }
  });
  
  socket.on('disconnect', () => {
    const user = activeUsers[socket.id];
    if (user) {
      console.log('User disconnected:', user.name);
      delete activeUsers[socket.id];
      
      // Update active users for all notebooks this user was in
      for (const room of socket.rooms) {
        if (room !== socket.id) {  // Exclude the default room (socket.id)
          const notebookUsers = [];
          for (const [socketId, activeUser] of Object.entries(activeUsers)) {
            if (io.sockets.adapter.rooms.get(room)?.has(socketId)) {
              notebookUsers.push(activeUser);
            }
          }
          io.to(room).emit('active-users', notebookUsers);
        }
      }
    }
  });
});

// REST API endpoints
app.get('/api/notebooks', async (req, res) => {
  try {
    const notebooks = await getNotebooks();
    res.json(notebooks);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Failed to get notebooks' });
  }
});

app.get('/api/notebooks/:id', async (req, res) => {
  try {
    const notebook = await getNotebook(req.params.id);
    if (notebook) {
      res.json(notebook);
    } else {
      res.status(404).json({ error: 'Notebook not found' });
    }
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Failed to get notebook' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});