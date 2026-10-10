const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:5000';

// Serve static frontend assets
app.use('/vendor', express.static(path.join(__dirname, 'public/vendor')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use(express.static(__dirname));

// Proxy /api requests to API Gateway (port 5000)
// Preserves the full /api path and query parameters cleanly
app.use('/api', (req, res) => {
  const fullApiPath = req.originalUrl || ('/api' + req.url);
  const targetUrl = new URL(fullApiPath, GATEWAY_URL);

  const proxyReq = http.request(
    targetUrl.toString(),
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(GATEWAY_URL).host
      }
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    res.status(502).json({
      success: false,
      error: `Frontend Gateway Proxy Error: Could not connect to API Gateway at ${GATEWAY_URL}`,
      details: err.message
    });
  });

  req.pipe(proxyReq);
});

// Single Page Application fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🌐 [TABLESERVE Frontend] running on http://localhost:${PORT}`);
    console.log(`   Proxies API requests to API Gateway: ${GATEWAY_URL}`);
  });
}

module.exports = app;
