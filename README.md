# DevCollabAI-Frontend

A lightweight Vite + React frontend for DevCollabAI — a small, fast UI to interact with the DevCollabAI backend and services.

This repository contains the web client (src/) and static assets (public/) for the project.

## Features
- Fast development with Vite
- React (v19) based UI
- Tailwind CSS integration
- Support for socket-based realtime updates (socket.io-client)
- Markdown rendering and syntax highlighting for content

## Tech stack (high level)
- React 19, React DOM
- Vite (dev server + build)
- Tailwind CSS (with @tailwindcss/vite)
- axios for HTTP requests
- socket.io-client for realtime/WS
- markdown-to-jsx, highlight.js
- react-router-dom

See package.json for full dependency list and versions.

## Prerequisites
- Node.js (LTS) — Node 16+ recommended
- npm (or yarn)

## Quick start (development)
1. Clone the repo
   git clone https://github.com/yogesh1078/DevCollabAI-Frontend.git
   cd DevCollabAI-Frontend

2. Install dependencies
   npm install

3. Create environment variables
   - There is a repository .env file placeholder. For Vite, client-visible variables must be prefixed with VITE_.
   - Example .env:
     VITE_API_URL=https://api.devcollabai.example

4. Start dev server
   npm run dev

5. Build for production
   npm run build

6. Preview production build
   npm run preview

7. Linting
   npm run lint

## Available scripts (from package.json)
- npm run dev — start Vite dev server
- npm run build — build production assets
- npm run preview — preview the production build
- npm run lint — run eslint

## Project layout (top-level)
- src/ — application source code (React)
- public/ — static assets
- index.html — Vite entry HTML
- package.json, package-lock.json
- vite.config.js
- eslint.config.js
- .env (example/placeholder)
- .gitignore

## Environment / Notes
- If the frontend talks to an API, configure the API base URL and any keys in .env using VITE_ prefixes so they are available to the client.
- Check vite.config.js and any code in src/ for expected variable names (VITE_*) before running.

## Contributing
- Open issues for bugs or feature requests.
- Fork the repo, create a feature branch, implement your changes, and open a pull request.
- Keep PRs focused and include a clear description and any testing steps.

## Reporting issues
Open an issue: https://github.com/yogesh1078/DevCollabAI-Frontend/issues

## Author
yogesh1078

```
