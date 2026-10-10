# Sunshine Inventory Frontend

React and Vite frontend for the Sunshine inventory management system. It connects to the Laravel API for authenticated inventory operations, adjustments, audit history, and role-protected management workflows.

## Requirements

- Node.js 20+
- npm
- Running Sunshine Laravel API

## Local setup

```bash
npm install
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
npm run build
```

The production files are created in `dist/`.

## Team

- Project Manager & Scrum Master, Analysis, Compilation: Sy, John Howell J.
- Lead Developers, Database, ERD, Data Models: Suan, Christopher B.; Vasquez, Aljrome A.
- DevOps / Architecture, DFD, Business Rules: Vecina, Aryana C.; Zarate, Christopher M.
- QA, Validation, Testing Scenarios: Tinasas, Shiela Mae C.
