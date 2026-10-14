import fs from 'fs';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/server/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Direct APK and Project Package Downloads
  app.get(['/download/medione-debug.apk', '/download/app-debug.apk', '/download/apk', '/medione-debug.apk'], (req, res) => {
    const apkPath = path.resolve(__dirname, 'public/downloads/medione-pharmacy-debug.apk');
    if (fs.existsSync(apkPath)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="medione-pharmacy-debug.apk"');
      res.sendFile(apkPath);
    } else {
      res.status(404).send('APK file not found');
    }
  });

  app.get(['/download/medione-android-source.zip', '/download/source.zip'], (req, res) => {
    const zipPath = path.resolve(__dirname, 'public/downloads/medione-android-project-source.zip');
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="medione-android-project-source.zip"');
      res.sendFile(zipPath);
    } else {
      res.status(404).send('Source bundle not found');
    }
  });

  // API router
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'MediOneBilling Server', timestamp: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MediOneBilling] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[MediOneBilling] Failed to start server:', err);
  process.exit(1);
});
