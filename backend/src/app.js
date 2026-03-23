import cors from 'cors';
import express from 'express';

import { registerConfigStatusRoute } from './routes/config-status.js';
import { registerChatMessageRoute } from './routes/chat-message.js';
import { registerChatSessionRoute } from './routes/chat-session.js';
import { registerHealthRoute } from './routes/health.js';

export function createApp(config) {
  const app = express();

  app.use(cors({ origin: config.frontendOrigin }));
  app.use(express.json());

  registerHealthRoute(app, config);
  registerConfigStatusRoute(app, config);
  registerChatSessionRoute(app, config);
  registerChatMessageRoute(app, config);

  app.use((error, _req, res, _next) => {
    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
      error: error.message || 'Internal Server Error',
      details: error.details || null,
    });
  });

  return app;
}
