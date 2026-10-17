# OneTeam Manga Translator — MVP

This repository currently contains a simple HTML demo plus an initial secure Claude Vision API proxy.

## Requirements
- Node.js 20+
- An Anthropic API key (usage may cost money)

## Run the API locally
1. Copy `.env.example` to `.env`.
2. Add your real `ANTHROPIC_API_KEY` to `.env`. Never put it in browser JavaScript or commit it.
3. Install dependencies: `npm install`
4. Start the server: `npm run dev`
5. Health check: `http://localhost:3000/api/health`

## Translation endpoint
`POST /api/translate` as `multipart/form-data`:
- `image`: one JPG, PNG, WEBP, or GIF image (max 8 MB)
- `glossary`: optional JSON string, e.g. `{"Naruto":"Наруто"}`

Returns JSON with `translations`, each including original text, Mongolian translation, region type, and percentage bounding box.

## Important current limitations
- The existing `index.html` is still a demo: its processing button simulates a result and is not yet wired to this API.
- Multi-page queues, persistent database, authentication, voting persistence, image inpainting, editing/dragging boxes, exports, and production deployment are not implemented yet.
- Import only content you own or have permission to use. The server does not bypass paywalls or access controls.

## Next steps
Wire the browser UI to `POST /api/translate`, add a real canvas-based overlay/editor, then add a database and owner-only publishing workflow before deployment.