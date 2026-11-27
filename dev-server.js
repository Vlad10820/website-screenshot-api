/**
 * Local development server for testing the screenshot API
 * This allows you to test locally without Vercel CLI
 */

const http = require('http');
const url = require('url');

// Set development environment
process.env.NODE_ENV = 'development';

const PORT = 3000;

// Import the screenshot handler
// Note: Since it's TypeScript, we'll use a workaround
const handler = async (req, res) => {
    try {
        // Parse the URL to get query parameters
        const parsedUrl = url.parse(req.url, true);

        if (parsedUrl.pathname !== '/api/screenshot') {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                error: 'Not found',
                message: 'Use /api/screenshot?url=...'
            }));
        }

        // Create a Vercel-like request/response wrapper
        const vercelReq = {
            query: parsedUrl.query,
            method: req.method,
            headers: req.headers,
        };

        const vercelRes = {
            status: (code) => {
                res.statusCode = code;
                return vercelRes;
            },
            json: (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data, null, 2));
            },
            send: (data) => {
                res.end(data);
            },
            setHeader: (name, value) => {
                res.setHeader(name, value);
            }
        };

        // Load and execute the handler
        // We'll use require with uncached module for hot reload
        delete require.cache[require.resolve('./api/screenshot.ts')];

        // For TypeScript, we need to transpile on-the-fly
        // Use ts-node/register if available, otherwise show error
        try {
            require('ts-node/register');
            const screenshotModule = require('./api/screenshot.ts');
            const screenshotHandler = screenshotModule.default;
            await screenshotHandler(vercelReq, vercelRes);
        } catch (error) {
            if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('ts-node')) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    error: 'ts-node not installed',
                    message: 'Please run: npm install --save-dev ts-node',
                    or: 'Use "vercel dev" instead'
                }, null, 2));
            }
            throw error;
        }

    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Internal server error',
            message: error.message
        }, null, 2));
    }
};

const server = http.createServer(handler);

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  📸 Screenshot API - Development Server                   ║
╚════════════════════════════════════════════════════════════╝

  Server running at: http://localhost:${PORT}
  
  Test it:
  • http://localhost:${PORT}/api/screenshot?url=https://google.com
  
  Or use curl:
  • curl "http://localhost:${PORT}/api/screenshot?url=https://google.com" --output test.png

  Press Ctrl+C to stop
  `);
});
