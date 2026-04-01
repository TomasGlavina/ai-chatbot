# Copilot Studio Node Backend Plan

## Goal

Connect a frontend running on `http://localhost:3000` to a Microsoft Copilot Studio chatbot through a Node backend, without blocking on the final environment variables.

## Current Known Input

- Existing Copilot Studio bot web chat URL:
  - `https://copilotstudio.microsoft.com/environments/Default-fa6944af-cc7c-4cd8-9154-c01132798910/bots/auto_agent_LTZOB/webchat?__version__=2`
- Desired frontend origin:
  - `http://localhost:3000`
- Backend runtime:
  - Node.js
- Frontend should use a short-lived token
- Team preference:
  - start with HTTP for the first implementation
  - add WebSocket-based message receiving after the basic flow works

## Important Constraint

The Copilot Studio share/embed URL is not enough by itself for a production-style frontend + backend integration. For a custom app, the missing piece is usually one of these:

1. A Copilot Studio token endpoint configuration for the bot's custom website channel.
2. A Direct Line secret or equivalent channel credentials.
3. Tenant/environment details if authentication is delegated through Microsoft identity.

The backend can still be designed and scaffolded now, with the final wiring deferred until the credentials arrive.

## Recommended Architecture

Use the backend as a broker, not as a place to store chat history permanently at first.

Flow:

1. Frontend sends `POST /api/chat/session` to the Node backend.
2. Backend calls the Copilot Studio token endpoint and fetches a short-lived Direct Line token.
3. Backend returns session metadata to the frontend.
4. Frontend connects to Direct Line using the issued token.
5. Frontend sends user messages with Direct Line HTTP requests.
6. Frontend receives bot activities over the Direct Line WebSocket stream when enabled.
7. Backend optionally adds logging, rate limiting, request tracing, and origin checks.

This means the first implementation can stay entirely HTTP on your backend. The WebSocket part can exist between the frontend and Direct Line later, without requiring your Node server to become a WebSocket server.

## Recommended Delivery Strategy

### Phase 1: Backend skeleton now

Create these pieces immediately:

- `backend/src/server.ts` or `backend/src/server.js`
- `backend/src/routes/health.*`
- `backend/src/routes/chat-session.*`
- `backend/src/lib/copilot-config.*`
- `backend/src/lib/copilot-client.*`
- `backend/.env.example`

Minimal endpoints:

- `GET /health`
  - returns service status and whether required config is present
- `POST /api/chat/session`
  - returns `501 Not Implemented` until secrets are added
  - after config is available, returns token/session payload for the frontend

Cross-cutting setup:

- CORS allowlist for `http://localhost:3000`
- request logging
- input validation
- typed config loading with startup checks

### Phase 2: Frontend handshake contract now

Define the frontend contract before secrets exist.

Expected request:

```json
POST /api/chat/session
{
  "userId": "local-dev-user"
}
```

Planned response shape:

```json
{
  "conversationId": "string-or-null",
  "token": "string-or-null",
  "streamUrl": "string-or-null",
  "expiresIn": 1800,
  "mode": "copilot-direct-line"
}
```

This allows frontend work to proceed with mocked data.

Recommended frontend rollout:

1. Call `POST /api/chat/session` to get token metadata.
2. Start with a mock client that just verifies the contract.
3. Replace the mock with a Direct Line-compatible client.
4. First working version may poll activities with HTTP GET if needed.
5. Preferred steady-state version should use the Direct Line WebSocket stream for incoming activities.

### Phase 3: Copilot Studio credential handoff later

When the credentials arrive, confirm which path Copilot Studio exposes and implement it.

#### Path A: Token endpoint provided by Copilot Studio mobile/custom app publishing

Use this if Copilot Studio exposes `Channels > Mobile app > Token Endpoint`.

Backend responsibility:

- call the token endpoint securely from the server using HTTP `GET`
- never expose long-lived secrets to the browser
- return only short-lived token/session data to the frontend

This is the best match for your current requirements.

#### Path B: Direct Line secret provided

Use this if the bot is configured via Direct Line-compatible channel credentials.

Backend responsibility:

- exchange the secret for a conversation token if applicable
- create/refresh conversation session data
- return only browser-safe session payloads

This path still supports WebSocket receiving on the frontend after the token is issued.

## Working Assumption For V1

Unless Copilot Studio later forces a different publish model, assume this implementation:

1. Node backend exposes `POST /api/chat/session`.
2. Backend calls the Copilot `Token Endpoint` with HTTP `GET`.
3. Backend returns `token`, `conversationId`, and `expiresIn`.
4. Frontend uses the token with Direct Line.
5. Frontend starts by using simple HTTP request flow.
6. Frontend upgrades to Direct Line WebSocket receiving once the basic chat loop is stable.

This keeps v1 small and matches Microsoft's current custom app guidance.

## Environment Variables To Prepare

These names are placeholders and can be adjusted once Microsoft's exact integration path is confirmed.

Required baseline vars:

- `PORT=8081`
- `FRONTEND_ORIGIN=http://localhost:3000`
- `NODE_ENV=development`

Possible Copilot/Direct Line vars:

- `COPILOT_BOT_URL=`
- `COPILOT_ENVIRONMENT_ID=`
- `COPILOT_BOT_ID=`
- `COPILOT_TOKEN_ENDPOINT=`
- `COPILOT_DIRECT_LINE_SECRET=`
- `COPILOT_TENANT_ID=`
- `COPILOT_CLIENT_ID=`
- `COPILOT_CLIENT_SECRET=`

Do not assume all of these are needed. Which ones are actually required depends on how the bot is published from Copilot Studio.

## What Can Be Implemented Before Secrets Arrive

Safe to do now:

- backend project bootstrap
- API route structure
- env validation layer
- CORS and security middleware
- request/response types
- mock session endpoint for frontend integration
- local error handling and logging
- frontend integration against mock token responses
- frontend polling mode before WebSocket mode
- test coverage for the config and route behavior

Blocked until secrets/config arrive:

- real token issuance
- real conversation creation
- authenticated calls into Copilot Studio services
- end-to-end bot response testing

## Suggested Backend API Shape

- `GET /health`
- `GET /api/config-status`
- `POST /api/chat/session`
- `POST /api/chat/message` only if backend relay is required

Recommended first implementation rule:

- keep messages browser-to-bot if the short-lived token model works
- add backend message relay only if compliance, logging, or auth rules require it
- do not build a backend WebSocket server in v1 unless a real requirement appears

## Security Notes

- Never send a Direct Line secret or long-lived Copilot credential to the frontend.
- Restrict CORS to `http://localhost:3000` in development.
- Add server-side rate limiting before exposing the endpoint beyond local dev.
- Log request IDs, but do not log message content unless explicitly needed.

## Immediate Task List

1. Bootstrap a small Express or Fastify backend.
2. Add `GET /health` and `POST /api/chat/session`.
3. Make `POST /api/chat/session` return a mock payload for frontend development.
4. Add `.env.example` with placeholders only.
5. Add config validation that reports which required vars are still missing.
6. Implement the real token fetch from the Copilot `Token Endpoint` using backend HTTP `GET`.
7. Start frontend integration in HTTP-only mode if needed.
8. Switch frontend receive flow to Direct Line WebSocket after the chat contract is stable.

## Decision Recommendation

Prefer this split unless a hard requirement appears otherwise:

- frontend renders chat UI and holds short-lived token
- backend only brokers session creation and secrets
- no backend message relay in v1
- no backend WebSocket server in v1

That keeps the integration smaller, reduces latency, and avoids making the backend a chat transport unless necessary.

## What I Need From You Later

When you have the Copilot Studio details, the most useful handoff is:

1. Whether `Channels > Mobile app` shows a `Token Endpoint`.
2. Any token endpoint URL or Direct Line secret.
3. Whether the frontend must talk only to your backend, or may talk to the bot directly using a short-lived token.
4. Whether Microsoft Entra ID sign-in is required for end users.

## Exit Criteria

This plan is complete when:

- backend boots locally
- frontend at `localhost:3000` can call `POST /api/chat/session`
- mock mode works without secrets
- real mode works after secrets are added
- no long-lived credential is exposed to the browser
