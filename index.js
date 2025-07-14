import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';

import loadModules from './src/config/load_modules.js';
import staticFiles from "./src/config/staticFiles.js";
import configureViewEngine from './src/config/viewEngine.js';
import eventLogger from './src/middlewares/logger.middleware.js';
import conditionalRendering from './src/middlewares/conditionalRender.middleware.js';
import { adminAuthMiddleware } from './src/middlewares/adminAuth.middleware.js';
import fetchGlobalEntitiesWithCache from './src/middlewares/fetchGlobalEntitiesWithCache.js';

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Setup Handlebars view engine
configureViewEngine(app);

app.use(eventLogger);

// Middleware
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRETE_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.IS_PRODUCTION } // Set to true in production with HTTPS
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Static files
app.use(staticFiles);


app.use(fetchGlobalEntitiesWithCache);


//confirm admin previlege for routes that begins with /admin...
app.use(adminAuthMiddleware);


//render header and footer section based on root or admin route
app.use(conditionalRendering);

// Load dynamic routes from modules
await loadModules(app);


// Start server
// Start local development server if not in production
if (process.env.NODE_ENV !== 'production') {
  const { createSNICallback } = await import('anchor-pki/auto-cert/sni-callback');
  const { TermsOfServiceAcceptor } = await import('anchor-pki/auto-cert/terms-of-service-acceptor');
  const https = (await import('https')).default;
  
  const SNICallback = createSNICallback({
    name: 'localhost',
    tosAcceptors: TermsOfServiceAcceptor.createAny(),
    cacheDir: 'tmp/acme'
  });

  const server = https.createServer({ SNICallback }, app);
  const PORT = process.env.PORT || 3000;
  
  server.listen(PORT, () => {
    console.log(`🚀 Server running in development mode`);
    console.log(`🔐 Local HTTPS server running at https://${process.env.ENDPOINT}:${PORT}`);
  });
} else {
  // In production (Vercel), just create the server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running in production mode on port ${PORT}`);
  });
}

// Export the app for Vercel (must be at top level)
export default app;