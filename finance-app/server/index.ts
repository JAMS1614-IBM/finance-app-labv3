import { createApp } from './app';
import { createYahooClient } from './yahooClient';

const port = Number(process.env.PORT ?? 8787);

createApp(createYahooClient()).listen(port, () => {
  console.log(`Market data proxy listening on http://localhost:${port}`);
});
