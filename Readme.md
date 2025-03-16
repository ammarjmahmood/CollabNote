# CollabNote

A modern, feature-packed collaborative notebook application that works on local networks. CollabNote allows multiple users to work on the same notebook simultaneously, with real-time updates and collaboration features.

<div style="display: flex; justify-content: space-between; margin: 20px 0;">
  <img src="Collabnote User 1.png" alt="CollabNote User 1" style="width: 48%; max-width: 500px;">
  <img src="Collabnote User 2.png" alt="CollabNote User 2" style="width: 48%; max-width: 500px;">
</div>

*Two users collaborating on the same notebook in real-time*

## Features

- Real-time collaborative editing
- Markdown and code cells support
- JavaScript code execution in notebooks
- Two view modes: Scroll (vertical) and Side-by-Side (notebook style)
- User presence indicators
- Auto-saving notebooks
- Responsive design for various devices

## Tech Stack

- **Frontend**: React, React Router, Socket.io Client
- **Backend**: Node.js, Express, Socket.io
- **Sandboxed Code Execution**: VM2
- **Styling**: CSS3

## Project Structure

```
collabnote/
├── client/                    # React frontend
│   ├── public/
│   └── src/
│       ├── components/        # React components
│       │   ├── Login.js       # Login component
│       │   ├── Navbar.js      # Navigation component
│       │   ├── Notebook.js    # Notebook component
│       │   └── Settings.js    # Settings component
│       ├── App.js             # Main application component
│       ├── App.css            # Main application styles
│       └── index.js           # React entry point
├── data/                      # Data storage directory
│   └── notebooks/             # JSON notebook files
├── server.js                  # Express server and Socket.io logic
└── package.json               # Project dependencies
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/collabnote.git
   cd collabnote
   ```

2. Install dependencies for both server and client:
   ```
   npm run install-all
   ```

3. Start the development server:
   ```
   npm start
   ```

This will start both the backend server and the React development server.

- Backend server will run on http://localhost:5000
- Frontend will run on http://localhost:3000

## Usage

1. Open the application in your browser at http://localhost:3000
2. Enter your name to log in
3. Create a new notebook or open an existing one
4. Share the URL with others on your local network to collaborate in real-time
5. Add, edit, and delete cells (markdown or code)
6. Execute JavaScript code directly in code cells
7. Switch between Scroll and Side-by-Side view modes in Settings

## View Modes

- **Scroll View**: Cells are displayed vertically, one after another. This is the traditional notebook layout.
- **Side-by-Side View**: Cells are displayed in a grid layout, creating a notebook-like experience with multiple cells visible at once.

## Future Features

- **Mobile View**: Responsive design optimized for smartphones and tablets, with touch-friendly controls and a simplified interface for smaller screens.

- **Different Notebook Styles**: Additional notebook templates and themes including academic, coding, scientific, and presentation-focused layouts.

- **Stylus Integration**: Support for stylus input on devices like Surface Pro and iPad, enabling handwritten notes, sketches, and mathematical equations.

- **Real-time Cursors**: See where other collaborators are working with colored cursors representing each user.

- **Offline Mode**: Work without internet connection and sync changes when reconnected.

- **Version History**: Browse and restore previous versions of notebooks.

- **Rich Media Support**: Embed images, videos, and interactive visualizations within notebooks.

- **Custom Themes**: Create and share custom color schemes and visual styles.

- **Export Options**: Additional export formats including PDF, standalone HTML, and plain text.

- **Template Library**: Pre-built notebook templates for common use cases.

## Development

To run the server and client separately:

- Server only: `npm run server`
- Client only: `npm run client`
- Development mode with auto-reload: `npm run dev`

## Data Storage

Notebooks are stored as JSON files in the `data/notebooks` directory. Each notebook has its own file with a UUID filename.

## License

MIT