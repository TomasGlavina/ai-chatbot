import { createChatSession } from '../lib/copilot-client.js';

function parseUserId(body) {
  if (body == null || typeof body !== 'object') {
    return 'local-dev-user';
  }

  if (body.userId == null || body.userId === '') {
    return 'local-dev-user';
  }

  if (typeof body.userId !== 'string') {
    const error = new Error('`userId` must be a string when provided.');
    error.statusCode = 400;
    throw error;
  }

  return body.userId;
}

export function registerChatSessionRoute(app, config) {
  app.post('/api/chat/session', async (req, res, next) => {
    try {
      const userId = parseUserId(req.body);
      const session = await createChatSession({ userId, config });
      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  });
}
