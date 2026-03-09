import 'dotenv/config';

const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:3000';
const DEFAULT_PORT = 8080;
const DIRECT_LINE_DOMAIN = 'https://directline.botframework.com/v3/directline';

function parsePort(value) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function normalizeMode(rawMode, tokenEndpoint) {
  if (rawMode === 'live' || rawMode === 'mock') {
    return rawMode;
  }

  return tokenEndpoint ? 'live' : 'mock';
}

export function getConfig() {
  const port = parsePort(process.env.PORT);
  const frontendOrigin = process.env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGIN;
  const copilotTokenEndpoint = process.env.COPILOT_TOKEN_ENDPOINT || '';
  const copilotMode = normalizeMode(process.env.COPILOT_MODE, copilotTokenEndpoint);
  const missingCopilotEnv = [];

  if (copilotMode === 'live' && !copilotTokenEndpoint) {
    missingCopilotEnv.push('COPILOT_TOKEN_ENDPOINT');
  }

  return {
    port,
    frontendOrigin,
    copilotMode,
    copilotTokenEndpoint,
    directLineDomain: DIRECT_LINE_DOMAIN,
    missingCopilotEnv,
    isCopilotReady: missingCopilotEnv.length === 0,
  };
}
