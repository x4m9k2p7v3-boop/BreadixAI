# BreadixAI

AI-powered chat interface with multi-model support and web search capabilities.

## Features

- 🤖 Multiple AI models support (GPT-4, Claude, etc.)
- 🔍 Web search integration via Tavily API
- 💾 Local data storage with IndexedDB
- 🔐 User authentication system
- 📱 Responsive design
- 💬 Chat history management
- 📎 File attachments support

## Tech Stack

**Backend:**
- Node.js + Express
- OmniRoute API proxy
- Tavily Search API

**Frontend:**
- Vanilla JavaScript
- IndexedDB for local storage
- CSS Grid/Flexbox

## Installation

1. Clone the repository:
```bash
git clone https://github.com/x4m9k2p7v3-boop/BreadixAI.git
cd BreadixAI
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
- `API_URL` - OmniRoute API endpoint
- `API_KEY` - OmniRoute API key
- `TAVILY_KEY` - Tavily Search API key
- `PORT` - Server port (default: 3000)

## Running

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Open browser at `http://localhost:3000`

## Project Structure

```
├── server.js              # Express backend server
├── index.html             # Main chat interface
├── pages/                 # Auth pages (sign_in, sign_up, recovery)
├── src/
│   ├── auth/              # Authentication system
│   ├── database/          # IndexedDB managers
│   ├── features/          # Additional features
│   └── js/                # Core logic
├── styles/                # CSS stylesheets
├── public/                # Static assets
├── docs/                  # Documentation
└── config/                # Configuration files
```

## Documentation

See `/docs` folder for detailed documentation:
- `DATABASE_V3.md` - Database architecture
- `PROJECT_STRUCTURE.md` - Project structure details
- `FEATURES.md` - Features overview
- `OPTIMIZATION_REPORT.md` - Performance optimizations

## License

MIT

## Author

Breadix
