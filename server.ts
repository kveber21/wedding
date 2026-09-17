import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  getSharedEntries,
  addSharedEntry,
  updateSharedEntryReactions,
  deleteSharedEntry,
} from './server/dataStore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON payloads (allowing photos up to 25MB)
  app.use(express.json({ limit: '25mb' }));

  // API endpoints for guestbook
  app.get('/api/entries', (req, res) => {
    try {
      const entries = getSharedEntries();
      res.json({ entries });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/entries', (req, res) => {
    try {
      const entry = req.body;
      if (!entry || (!entry.author && !entry.name) || !entry.message) {
        return res.status(400).json({ error: 'Auteur et message requis' });
      }
      // Standardize author property
      if (!entry.author && entry.name) {
        entry.author = entry.name;
      }
      const saved = addSharedEntry(entry);
      res.status(201).json({ success: true, entry: saved });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/entries/:id/reactions', (req, res) => {
    try {
      const { id } = req.params;
      const { reactions } = req.body;
      const updated = updateSharedEntryReactions(id, reactions);
      if (!updated) {
        return res.status(404).json({ error: 'Entrée non trouvée' });
      }
      res.json({ success: true, entry: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/entries/:id', (req, res) => {
    try {
      const { id } = req.params;
      const deleted = deleteSharedEntry(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Entrée non trouvée' });
      }
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development vs static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
