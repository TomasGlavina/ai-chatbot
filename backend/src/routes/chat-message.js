import { sendChatMessage } from '../lib/copilot-client.js';

function parseMessageBody(body) {
  if (body == null || typeof body !== 'object') {
    const error = new Error('Request body must be a JSON object.');
    error.statusCode = 400;
    throw error;
  }

  if (typeof body.text !== 'string' || body.text.trim() === '') {
    const error = new Error('`text` is required and must be a non-empty string.');
    error.statusCode = 400;
    throw error;
  }

  const metadata =
    body.metadata && typeof body.metadata === 'object' ? body.metadata : {};
  const conversationId =
    typeof body.conversationId === 'string' && body.conversationId !== ''
      ? body.conversationId
      : null;
  const userId =
    typeof body.userId === 'string' && body.userId !== ''
      ? body.userId
      : 'local-dev-user';

  return {
    text: body.text.trim(),
    metadata,
    conversationId,
    userId,
  };
}

export function registerChatMessageRoute(app, config) {
  const handler = async (req, res, next) => {
    try {
      const payload = parseMessageBody(req.body);
      const response = await sendChatMessage({
        ...payload,
        config,
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  app.post('/api/chat/message', handler);
  app.post('/chat', handler);
}
