import { createApp } from './app.js';
import { getConfig } from './config/env.js';

const config = getConfig();
const app = createApp(config);

app.listen(config.port, () => {
  console.log(`copilot-backend listening on http://localhost:${config.port}`);
  console.log(`frontend origin: ${config.frontendOrigin}`);
  console.log(`copilot mode: ${config.copilotMode}`);
});
