# Frontend implementation plan

## Repository and backend analysis

- Backend source reviewed at `C:\Users\Servidor 1\Downloads\BackendPilates`.
- Project rules reviewed in backend `AGENTS.md`.
- Backend docs reviewed: authentication, permissions, API, architecture, business rules, database, deployment, and backend plan.
- Published OpenAPI downloaded from `https://pilates-manager-api.onrender.com/docs-json` into `docs/openapi.json`.
- The backend is the source of truth for authentication, permissions, capacity, attendance, replacement credits, finance, and audit.

## OpenAPI decision

OpenAPI was used to generate `apps/web/src/lib/openapi.ts`. Current backend Swagger lacks response schemas for many endpoints, so the frontend uses generated path/request contracts plus narrow runtime helpers for response rendering. Backend improvement needed: add `@ApiOkResponse`, `@ApiCreatedResponse`, and DTO response classes so the generated client can be fully typed.

## Implementation scope

1. Move frontend implementation into `apps/web`.
2. Configure Next.js App Router, strict TypeScript, Tailwind CSS, shadcn-style primitives, TanStack Query, React Hook Form, Zod, Vitest, React Testing Library, Playwright, Prettier, and PWA assets.
3. Implement session flow:
   - `/login` for studio credentials;
   - `/unlock` for PIN;
   - in-memory access token;
   - HttpOnly device/refresh cookies through `credentials: "include"`;
   - refresh fallback to `/unlock` when staff session expires;
   - full studio logout.
4. Implement centralized permissions:
   - `PermissionGate`;
   - protected routes;
   - responsive navigation based on permissions;
   - 401/403 handling.
5. Implement functional MVP pages for existing endpoints:
   - dashboard;
   - agenda/class sessions;
   - class detail with attendance actions;
   - students;
   - trial processes;
   - assessments/templates;
   - replacement credits;
   - payments/plans;
   - staff;
   - studio settings, units, rooms, devices;
   - audit logs.

## Backend gaps to address later

- Initial production setup endpoint or secure bootstrap command for first studio/admin.
- More complete Swagger response schemas.
- Dedicated detail endpoint for class session by id.
- Dedicated student timeline endpoint.
- Dashboard could expose richer action metadata for replacement credit outcomes.
- File upload endpoint currently stores metadata only; binary upload/storage flow is not complete.
- Rename/revoke-all device endpoints are not available.
- Reports endpoint is not available.

## Validation

Before considering work complete:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e` where environment allows
- `pnpm build`
