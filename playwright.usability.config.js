const base = require('./playwright.config');
module.exports = {
  ...base,
  use: { ...base.use, baseURL: 'http://127.0.0.1:4187' },
  outputDir: 'test-results/usability',
  webServer: { command: 'npm start', env: { PORT: '4187' }, url: 'http://127.0.0.1:4187', reuseExistingServer: false }
};
