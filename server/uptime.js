const express = require('express');

function startUptimeServer(config) {
    const app = express();
    const port = process.env.PORT || config.port || 3000;
    const startTime = Date.now();

    app.get('/', (req, res) => {
        const uptime = Date.now() - startTime;
        const uptimeSeconds = Math.floor(uptime / 1000);
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;

        res.send(`
            <html>
                <head>
                    <title>${config.botName}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                        }
                        .container {
                            text-align: center;
                            background: rgba(255, 255, 255, 0.1);
                            padding: 40px;
                            border-radius: 20px;
                            backdrop-filter: blur(10px);
                        }
                        h1 { margin: 0 0 20px 0; font-size: 2.5em; }
                        .info { margin: 10px 0; font-size: 1.2em; }
                        .status { color: #4ade80; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🤖 ${config.botName}</h1>
                        <div class="info">Prefix: <strong>${config.prefix}</strong></div>
                        <div class="info">Author: <strong>${config.author}</strong></div>
                        <div class="info">Status: <span class="status">ONLINE ✓</span></div>
                        <div class="info">Uptime: <strong>${hours}h ${minutes}m ${seconds}s</strong></div>
                        <div class="info" style="margin-top: 30px; font-size: 0.9em; opacity: 0.8;">
                            Facebook Messenger Bot | Render Deployment Ready
                        </div>
                    </div>
                </body>
            </html>
        `);
    });

    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            botName: config.botName,
            uptime: Date.now() - startTime,
            timestamp: new Date().toISOString()
        });
    });

    app.listen(port, '0.0.0.0', () => {
        console.log(`✓ Uptime server started on port ${port}`);
    });

    return app;
}

module.exports = startUptimeServer;
