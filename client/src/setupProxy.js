const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');

const rootEnvPath = path.resolve(__dirname, '..', '..', '.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

const configuredPort = Number(process.env.PORT);
const apiPort = configuredPort && configuredPort !== 5000 ? configuredPort : 5050;
const apiTarget = `http://localhost:${apiPort}`;

module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
    })
  );
};
