# Repository Guidelines

Retorrent blends a Go backend with a React/TypeScript frontend. Use this guide to align with existing patterns and keep contributions review-friendly.

## Project Structure & Module Organization
- `server/`: Go services, PocketBase integration, `internal/` packages, and migrations. Tests live beside the code, e.g., `server/internal/transmission/sync_test.go`.
- `web/`: Vite + React app (`src/` for features, `shared/` for utilities, `entities/` for models, `assets/` for icons). Public static assets sit in `public/`.
- `docs/`: Future-facing specs and ADRs. Reference when introducing architectural changes.
- Root Docker & compose files wire the stack locally; keep them in sync with backend env vars.

## Build, Test, and Development Commands
- `npm install` (run in `web/`): install frontend dependencies.
- `npm run dev` (web): start Vite dev server with HMR at `localhost:5173`.
- `npm run build` (web): type-check via `tsc -b` then emit production bundle.
- `npm run lint` (web): enforce ESLint rules; resolve prior to PRs.
- `go run ./server` or `go run ./server/main.go`: launch the API locally (expects Transmission credentials in `.env`).
- `go test ./...` (server): execute Go unit tests and sync routines.
- `docker-compose up --build`: bring up full stack for QA parity.

## Coding Style & Naming Conventions
- TypeScript: 2-space indentation, prefer functional components, PascalCase for components, camelCase for hooks/utilities, CSS modules or Tailwind utility classes where available.
- Go: run `gofmt` (via `go fmt ./...`) and respect package-level naming (`transmissionClient`, `SyncJob`). Keep exported types documented.
- Linting: rely on ESLint + Typescript ESLint presets; avoid disabling rules without justification in review.

## Testing Guidelines
- Go tests use the standard library; mirror file names (`sync.go` → `sync_test.go`). Add deterministic fixtures under `server/internal/.../testdata` when needed.
- Frontend tests are not yet scaffolded—include targeted component tests (Vitest + Testing Library) when adding critical UI logic and document the command in your PR.
- Aim for coverage on queue/sync logic and any new API client wrappers; flag gaps explicitly in the PR description.

## Commit & Pull Request Guidelines
- Follow Conventional Commits observed in history (`feat(client): ...`, `refactor(main): ...`). Scope should match folder or subsystem.
- Keep commits focused; include config or schema migrations separately for easy rollback.
- Pull requests: describe motivation, implementation summary, test evidence (`go test`, screenshots for UI), and link issues. Request security review when touching auth, secrets, or network paths.
