import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple Express server to serve the revenue projections
const app = express();
const PORT = 3001;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Main route for the viewer
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'diagnostic.html'));
});

// Route for the detailed projections
app.get('/projections', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'projections.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Projections server running at http://localhost:${PORT}`);
});