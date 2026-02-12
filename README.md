# CongressAI (Next.js)

Upgraded CongressAI using Venice AI across PDF, website crawling, screenshots, chat, embeddings, and audio.

## Features
- Full Next.js 14 app with server-side Venice API calls
- PDF agenda extraction → structured JSON
- Website crawling (agenda + abstracts) → structured JSON
- Screenshot analysis (vision) → structured JSON
- Chat bot with agenda context
- Embeddings endpoint for similarity/cluster work
- TTS audio summary download
- STT transcription endpoint
- Railway-ready env config

## Local Setup
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Railway Deploy
1) Create a new Railway project
2) Add env vars from `.env.example`
3) Set build command: `npm run build`
4) Set start command: `npm start`

## API Routes
- `POST /api/analyze/pdf` (multipart form with `file`)
- `POST /api/analyze/website` (JSON `{ url }`)
- `POST /api/analyze/screenshot` (JSON `{ imageBase64 }`)
- `POST /api/chat` (JSON `{ messages, model }`)
- `POST /api/embeddings` (JSON `{ input }`)
- `POST /api/tts` (JSON `{ text, voice, speed }`)
- `POST /api/transcribe` (multipart form with `file`)
- `GET /api/models`
- `GET /api/health`

## Suggested Upgrades
- Vector store for persistent embeddings search
- Speaker enrichment with citations
- Session timeline rendering (calendar view)
- Export JSON → CSV, iCal
- Save projects + history
- Multi-doc comparison across congresses
