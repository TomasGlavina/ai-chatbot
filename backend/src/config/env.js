import 'dotenv/config';

const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:3000';
const DEFAULT_PORT = 8081;
const DEFAULT_DIRECT_LINE_DOMAIN = 'https://directline.botframework.com/v3/directline';
const DEFAULT_POLL_INTERVAL_MS = 1000;
const DEFAULT_POLL_ATTEMPTS = 15;

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

function parsePositiveInteger(value, fallbackValue) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
}

export function getConfig() {
  const port = parsePort(process.env.PORT);
  const frontendOrigin = process.env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGIN;
  const copilotTokenEndpoint = process.env.COPILOT_TOKEN_ENDPOINT || '';
  const copilotMode = normalizeMode(process.env.COPILOT_MODE, copilotTokenEndpoint);
  const directLineDomain =
    process.env.COPILOT_DIRECT_LINE_DOMAIN || DEFAULT_DIRECT_LINE_DOMAIN;
  const directLinePollIntervalMs = parsePositiveInteger(
    process.env.DIRECT_LINE_POLL_INTERVAL_MS,
    DEFAULT_POLL_INTERVAL_MS,
  );
  const directLinePollAttempts = parsePositiveInteger(
    process.env.DIRECT_LINE_POLL_ATTEMPTS,
    DEFAULT_POLL_ATTEMPTS,
  );
  const missingCopilotEnv = [];

  if (copilotMode === 'live' && !copilotTokenEndpoint) {
    missingCopilotEnv.push('COPILOT_TOKEN_ENDPOINT');
  }

  return {
    port,
    frontendOrigin,
    copilotMode,
    copilotTokenEndpoint,
    directLineDomain,
    directLinePollIntervalMs,
    directLinePollAttempts,
    missingCopilotEnv,
    isCopilotReady: missingCopilotEnv.length === 0,
  };
}
