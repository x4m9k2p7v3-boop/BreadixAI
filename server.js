const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.')); // Serve static files

// API Configuration from .env
const OMNIROUTE_BASE_URL = process.env.API_URL ? process.env.API_URL.replace('/v1/chat/completions', '') : 'http://localhost:20128';
const OMNIROUTE_KEY = process.env.API_KEY;
const TAVILY_KEY = process.env.TAVILY_KEY;

console.log('🔧 Configuration:');
console.log('   Base URL:', OMNIROUTE_BASE_URL);
console.log('   API Key:', OMNIROUTE_KEY ? '✓ Configured' : '✗ Missing');
console.log('   Tavily Key:', TAVILY_KEY ? '✓ Configured' : '✗ Missing');

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        omniroute: OMNIROUTE_KEY ? 'configured' : 'missing',
        tavily: TAVILY_KEY ? 'configured' : 'missing'
    });
});

// Proxy endpoint for chat completions
app.post('/api/chat', async (req, res) => {
    try {
        const { model, messages, stream, temperature } = req.body;

        if (!OMNIROUTE_KEY) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        // Forward request to OmniRoute
        const apiUrl = `${OMNIROUTE_BASE_URL}/v1/chat/completions`;
        console.log(`📤 Proxying to: ${apiUrl}`);
        console.log(`📝 Model: ${model}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OMNIROUTE_KEY}`
            },
            body: JSON.stringify({
                model,
                messages,
                stream,
                temperature
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ OmniRoute API Error:', response.status, errorText);
            return res.status(response.status).json({
                error: `API Error: ${response.status}`,
                details: errorText
            });
        }

        console.log('✅ Response received, streaming to client...');

        // Stream response back to client
        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            response.body.pipe(res);
        } else {
            const data = await response.json();
            res.json(data);
        }

    } catch (error) {
        console.error('❌ Proxy error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Proxy endpoint for Tavily search
app.post('/api/search', async (req, res) => {
    try {
        const { query, search_depth, max_results } = req.body;

        if (!TAVILY_KEY) {
            return res.status(500).json({ error: 'Tavily API key not configured' });
        }

        console.log(`🔍 Search query: ${query}`);

        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: TAVILY_KEY,
                query,
                search_depth: search_depth || 'basic',
                max_results: max_results || 5
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Tavily API Error:', response.status, errorText);
            return res.status(response.status).json({
                error: `Search API Error: ${response.status}`
            });
        }

        const data = await response.json();
        console.log(`✅ Search results: ${data.results?.length || 0} items`);
        res.json(data);

    } catch (error) {
        console.error('❌ Search proxy error:', error);
        res.status(500).json({
            error: 'Search failed',
            message: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ================================');
    console.log('   BreadixAI Backend Server');
    console.log('   ================================');
    console.log(`   🌐 Server: http://localhost:${PORT}`);
    console.log(`   📡 Proxy: ${OMNIROUTE_BASE_URL}`);
    console.log(`   🔑 Auth: ${OMNIROUTE_KEY ? 'Enabled' : 'Disabled'}`);
    console.log('   ================================');
    console.log('');
});
