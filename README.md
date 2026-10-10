# Sunshine Inventory Frontend

React and Vite frontend for the Sunshine inventory management system. It connects to the Laravel API for authenticated inventory operations, adjustments, audit history, and role-protected management workflows.

## Requirements

- Node.js 24.x (also specified in `.nvmrc` and `package.json`)
- npm 11 or 12
- Running Sunshine Laravel API

## Local setup

```bash
npm ci
copy .env.example .env
npm run dev
```

Open the local Vite URL printed by the command.

## Environment configuration

Set the Laravel API URL in `.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

`VITE_*` values are public browser configuration. Do not put passwords, API tokens, private keys, or other secrets in them. For deployment, use the public HTTPS address of the deployed Laravel API.

## Available workflows

- Credential sign-in, session restore, and logout
- Inventory, batch, movement, adjustment, alert, and audit views
- Stock In, Stock Out, Transfer, and Return workflows
- Adjustment review by authorized users other than the requester
- Role-protected product and batch CRUD
- Administration Manager-only user-management CRUD

## Build and verification

```bash
npm ci
npm run build
npm run preview
```

The production files are created in `dist/`. Preview serves the built files locally.
The build validates `VITE_API_BASE_URL` from the environment or Vite environment files.
Vite embeds this URL at build time; changing it requires a new build.

The `Frontend build` GitHub Actions workflow runs on pull requests, pushes to `main`,
and manual dispatch. It installs locked dependencies with `npm ci`, builds, and checks
that `dist/index.html` exists. It uses a nonfunctional API URL solely to verify compilation;
it does not contact Laravel or deploy those assets. Runtime API checks belong to QA.
Direct dependencies are pinned to the versions in the committed lockfile. Update
`package.json` and `package-lock.json` together when intentionally updating dependencies.

## Deployment to Vercel

1. Import this frontend repository in Vercel with the repository root as the project root.
2. Select Node.js 24.x and the Vite framework preset. `vercel.json` specifies
   `npm ci`, `npm run build`, and the `dist` output directory.
3. Configure `VITE_API_BASE_URL` in Vercel for both Preview and Production environments.
   Use the actual public HTTPS Laravel API base URL ending in `/api`. Do not use localhost.
4. Use `main` as the production branch. With Vercel's Git integration enabled,
   pull requests receive preview deployments and changes on `main` receive production deployments.
5. Require the `Frontend build / build` status check in GitHub branch protection before
   merging. Vercel builds separately; it does not automatically wait for this CI check.
6. Redeploy after changing environment values. Confirm login, inventory loading,
   CRUD, adjustment review, session restoration, and logout against the deployed backend.

The Laravel API must already be deployed with HTTPS and a migrated database. Configure
its CORS allow-list for the actual frontend production and approved preview origins.
Authentication uses Sanctum bearer tokens supplied by the sign-in workflow.
Hash routes (`#/inventory`) do not require a SPA rewrite.

If deployment fails, check the Node version, install/build logs, and API URL configuration.
If the page loads but API requests fail, check backend availability, HTTPS, and CORS.
Never store passwords, tokens, or private keys in `VITE_*` variables or this repository.
Repository configuration does not create or connect a Vercel project automatically.

References: [GitHub Node build guidance](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs),
[Vercel build configuration](https://vercel.com/docs/builds/configure-a-build).

## Team

- Project Manager & Scrum Master, Analysis, Compilation: Sy, John Howell J.
- Lead Developers, Database, ERD, Data Models: Suan, Christopher B.; Vasquez, Aljrome A.
- DevOps / Architecture, DFD, Business Rules: Vecina, Aryana C.; Zarate, Christopher M.
- QA, Validation, Testing Scenarios: Tinasas, Shiela Mae C.
