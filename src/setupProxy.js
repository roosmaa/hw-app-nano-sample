const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(proxy('/api', {
    target: 'http://[::1]:7076/',
    headers: { 'Content-Type': 'application/json' },
    pathRewrite: { '^/api': '' },
    secure: false,
    changeOrigin: true,
  }));
};