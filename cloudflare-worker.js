// Cloudflare Worker для BreadixAI
// Деплой: https://dash.cloudflare.com/ -> Workers & Pages -> Create Worker

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    }

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: corsHeaders
        })
    }

    const url = new URL(request.url)

    // Health check endpoint
    if (url.pathname === '/health') {
        return new Response(JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            omniroute: OMNIROUTE_KEY ? 'configured' : 'missing',
            tavily: TAVILY_KEY ? 'configured' : 'missing'
        }), {
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        })
    }

    // Chat API endpoint
    if (url.pathname === '/api/chat' && request.method === 'POST') {
        try {
            const body = await request.json()

            if (!OMNIROUTE_KEY) {
                return new Response(JSON.stringify({ error: 'API key not configured' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                })
            }

            // Make request to OmniRoute API
            const baseUrl = OMNIROUTE_BASE_URL?.replace(/\/$/, '')
            const apiUrl = `${baseUrl}/v1/chat/completions`

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OMNIROUTE_KEY}`
                },
                body: JSON.stringify(body)
            })

            // Проксируем ответ как есть, добавляя CORS заголовки
            const newHeaders = new Headers(response.headers)
            newHeaders.set('Access-Control-Allow-Origin', '*')
            newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

            return new Response(response.body, {
                status: response.status,
                headers: newHeaders
            })
        } catch (error) {
            return new Response(JSON.stringify({
                error: 'Chat request failed',
                details: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            })
        }
    }

    // Search API endpoint
    if (url.pathname === '/api/search' && request.method === 'POST') {
        try {
            const body = await request.json()
            const { query, search_depth, max_results } = body

            if (!TAVILY_KEY) {
                return new Response(JSON.stringify({ error: 'Tavily API key not configured' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                })
            }

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
            })

            if (!response.ok) {
                const errorText = await response.text()
                return new Response(JSON.stringify({
                    error: `Search API Error: ${response.status}`
                }), {
                    status: response.status,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                })
            }

            const data = await response.json()
            return new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            })
        } catch (error) {
            return new Response(JSON.stringify({
                error: 'Search failed',
                message: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            })
        }
    }

    // 404 for other routes
    return new Response('Not Found', {
        status: 404,
        headers: corsHeaders
    })
}
