export function registerConfigStatusRoute(app, config) {
  app.get('/api/config-status', (_req, res) => {
    res.json({
      frontendOrigin: config.frontendOrigin,
      copilotMode: config.copilotMode,
      copilotReady: config.isCopilotReady,
      missingCopilotEnv: config.missingCopilotEnv,
      directLineDomain: config.directLineDomain,
    });
  });
}
