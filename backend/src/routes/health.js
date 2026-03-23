export function registerHealthRoute(app, config) {
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'copilot-backend',
      timestamp: new Date().toISOString(),
      copilot: {
        mode: config.copilotMode,
        ready: config.isCopilotReady,
        missingEnv: config.missingCopilotEnv,
      },
    });
  });
}
