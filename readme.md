# Vault — Inventory & Treasury Management System

College-wide **Inventory & Treasury Management System (TMS)** built as a monorepo.

The project contains:

* **Frontend** — Next.js + TypeScript + Tailwind CSS + shadcn/ui
* **Backend** — Node.js + Express + TypeScript + Prisma
* **Database** — MariaDB/MySQL
* **Shared Contracts** — TypeScript types shared between frontend and backend
* **Git/GitHub** — One repository, feature branches, Pull Requests

---

# 1. Repository Structure

```text
tms/
├── apps/
│   ├── backend/              # Express + TypeScript API
│   └── frontend/             # Next.js application
│
├── packages/
│   └── contracts/             # Shared frontend/backend TypeScript types
│
├── package.json               # Monorepo/workspace scripts
├── package-lock.json          # Single lockfile
└── README.md
```

## Backend

```text
apps/backend/

├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── transactions/
│   │   ├── vouchers/
│   │   ├── calculations/
│   │   ├── members/
│   │   ├── fees/
│   │   ├── reports/
│   │   └── notifications/
│   │
│   ├── middleware/
│   ├── lib/
│   ├── config/
│   ├── app.ts
│   └── server.ts
│
├── uploads/
└── tests/
```

Each backend feature module normally contains:

```text
module/
├── *.controller.ts
├── *.service.ts
├── *.routes.ts
├── *.validation.ts
└── *.types.ts
```

## Frontend

```text
apps/frontend/

├── src/
│   ├── app/                  # Next.js routes
│   ├── components/           # Shared UI/layout components
│   ├── modules/              # Feature/team modules
│   ├── lib/                  # Shared utilities/API client
│   ├── styles/
│   └── types/
│
└── public/
```

## Shared contracts

```text
packages/contracts/

└── src/
    ├── auth/
    ├── fees/
    ├── inventory/
    ├── members/
    ├── notifications/
    ├── reports/
    ├── transactions/
    ├── users/
    └── vouchers/
```

Shared API/domain types should go here when both frontend and backend need them.

Do not put Prisma, Express, React, database logic, or UI code inside `packages/contracts`.

---

# 2. Team Ownership

| Team   | Backend                 | Frontend                   |
| ------ | ----------------------- | -------------------------- |
| Team 1 | `modules/auth`          | `modules/auth`             |
| Team 2 | `modules/transactions`  | `modules/transactions`     |
| Team 3 | `modules/vouchers`      | `modules/vouchers`         |
| Team 4 | `modules/calculations`  | `modules/auto-calculation` |
| Team 5 | `modules/members`       | `modules/members-fees`     |
| Team 6 | `modules/fees`          | `modules/members-fees`     |
| Team 7 | `modules/reports`       | `modules/reporting`        |
| Team 8 | `modules/notifications` | `modules/notifications`    |

The frontend and backend names are allowed to differ where one frontend feature combines multiple backend features.

Shared infrastructure should be modified carefully:

```text
apps/backend/src/middleware/
apps/backend/src/lib/
apps/backend/src/config/
apps/backend/src/app.ts
apps/backend/src/server.ts
apps/backend/prisma/

apps/frontend/src/components/
apps/frontend/src/lib/
apps/frontend/src/app/layout.tsx
apps/frontend/src/app/globals.css

packages/contracts/
```

---

# 3. Requirements

Install:

* Node.js
* npm
* MariaDB/MySQL
* Git

Recommended environment:

```text
Node.js 22+
npm 11+
```

---

# 4. Clone the Repository

Everyone works directly from the main GitHub repository as a collaborator.

Repository:

```text
https://github.com/kawsaramin101/tms
```

Clone it:

```bash
git clone https://github.com/kawsaramin101/tms.git
cd tms
```

---

# 5. Install Dependencies

This is an **npm workspace monorepo**.

Install dependencies **from the repository root only**:

```bash
npm install
```

Do not run separate `npm install` commands inside:

```text
apps/backend/
apps/frontend/
packages/contracts/
```

The project intentionally uses:

```text
tms/
├── node_modules/
├── package-lock.json
└── package.json
```

rather than separate lockfiles and dependency installations for each workspace.

---

# 6. Environment Variables

## Backend

Create:

```text
apps/backend/.env
```

Example:

```env
DATABASE_URL="mysql://tms:hello_world@localhost:3306/tms"
```

Do not commit `.env` files or real production credentials.

## Frontend

Create:

```text
apps/frontend/.env.local
```

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

# 7. Database Setup

The backend uses MariaDB/MySQL with Prisma.

Database:

```text
Database: tms
Username: tms
Password: hello_world
Host: localhost
Port: 3306
```

After configuring the backend `.env`, generate Prisma Client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate
```

For creating a new migration:

```bash
npm run prisma:migrate -- --name your-migration-name
```

Database/schema changes affect the entire project.

**Always communicate Prisma schema changes with the team before merging them.**

---

# 8. Start the Project

The project is managed from the **root monorepo**.

## Start frontend and backend together

```bash
npm run dev
```

This starts:

```text
Backend  → http://localhost:5000
Frontend → http://localhost:3000
```

## Start only the backend

```bash
npm run dev:backend
```

## Start only the frontend

```bash
npm run dev:frontend
```

---

# 9. Useful Commands

Run commands from the repository root.

```bash
npm run dev
```

Start frontend + backend.

```bash
npm run dev:backend
```

Start backend only.

```bash
npm run dev:frontend
```

Start frontend only.

```bash
npm run build
```

Build frontend and backend.

```bash
npm run build:backend
```

Build backend.

```bash
npm run build:frontend
```

Build frontend.

```bash
npm run start:backend
```

Start the built backend.

```bash
npm run start:frontend
```

Start the built frontend.

```bash
npm run lint
```

Run frontend linting.

For workspace-specific commands:

```bash
npm run <script> --workspace=tms-be
npm run <script> --workspace=tms-fe
```

---

# 10. Git & GitHub Workflow

Everyone works from the same repository as a GitHub collaborator.

**Never push directly to `main`.**

## Step 1 — Update main

Before starting new work:

```bash
git checkout main
git pull origin main
```

## Step 2 — Create your branch

Create one branch for one feature/task:

```bash
git checkout -b feature/<your-feature>
```

Examples:

```bash
git checkout -b feature/member-management
git checkout -b feature/voucher-upload
git checkout -b feature/transaction-api
git checkout -b feature/notification-system
```

## Step 3 — Work on your feature

Work primarily inside your assigned module.

Example:

```text
apps/backend/src/modules/members/
```

or:

```text
apps/frontend/src/modules/members-fees/
```

Do not modify another team's module unnecessarily.

## Step 4 — Check your changes

```bash
git status
```

Then test your changes:

```bash
npm run build
npm run lint
```

Run any relevant tests as well.

## Step 5 — Commit

Use clear commit messages:

```bash
git add .
git commit -m "feat: add member management"
```

Examples:

```text
feat: add member management
feat: add voucher upload
feat: add transaction API
fix: validate transaction amount
refactor: simplify transaction service
docs: update project documentation
```

## Step 6 — Push your branch

```bash
git push -u origin feature/<your-feature>
```

Example:

```bash
git push -u origin feature/member-management
```

## Step 7 — Create a Pull Request

Open the repository on GitHub and create:

```text
your-feature-branch
        ↓
      main
```

The Pull Request should explain:

* What was changed
* Which module was changed
* Whether the database/schema was changed
* How the changes were tested
* Any important notes for reviewers

Wait for review before merging.

## Step 8 — Start the next task

After your PR is merged:

```bash
git checkout main
git pull origin main
```

Then create a new branch:

```bash
git checkout -b feature/<next-feature>
```

---

# 11. Git Rules

### Never

* Push directly to `main`
* Commit `.env` or `.env.local`
* Commit passwords or API keys
* Rewrite another team's module unnecessarily
* Create duplicate shared utilities
* Create another Prisma client
* Change the database schema without communicating with the team
* Replace large files when a small change is enough

### Always

* Use one branch per task
* Keep changes focused
* Pull the latest `main` before starting new work
* Test before creating a PR
* Explain database changes in the PR
* Reuse existing shared code
* Follow the existing architecture

---

# 12. Development Rules

## Backend

Follow:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Prisma
  ↓
Database
```

Controllers should handle HTTP-related work.

Services should contain business logic.

Use the shared Prisma client:

```text
apps/backend/src/lib/prisma.ts
```

Do not create another Prisma client inside your module.

Before creating a new utility, middleware, authentication helper, upload handler, or database helper, check:

```text
apps/backend/src/middleware/
apps/backend/src/lib/
apps/backend/src/config/
```

## Frontend

Keep Next.js route pages thin.

Feature-specific UI and logic should live inside:

```text
apps/frontend/src/modules/
```

Use existing components from:

```text
apps/frontend/src/components/ui/
```

Use existing API utilities:

```text
apps/frontend/src/lib/api-client.ts
```

Prefer Server Components.

Only use:

```tsx
"use client";
```

when the component actually needs client-side functionality such as state, effects, event handlers, or browser APIs.

Use the existing Tailwind theme tokens instead of introducing arbitrary colors.

Prefer:

```text
bg-background
text-foreground
bg-primary
text-muted-foreground
border-border
```

instead of hardcoded colors such as:

```text
bg-white
text-gray-500
#ffffff
```

If a new shadcn/ui component is required:

```bash
npx shadcn@latest add <component>
```

Do not manually recreate an existing shadcn/ui component.

---

# 13. Shared Contracts

When a type is required by both frontend and backend, consider putting it in:

```text
packages/contracts/src/
```

For example:

```text
packages/contracts/src/members/
packages/contracts/src/transactions/
packages/contracts/src/vouchers/
```

Do not duplicate the same API type in both applications if it belongs in the shared contracts package.

Before creating a new type, check whether an appropriate type already exists in:

```text
packages/contracts/
```

---

# 14. Working With an LLM

You may use ChatGPT, Claude, Gemini, GitHub Copilot, or another coding assistant.

However:

**Do not let an LLM redesign the project architecture without discussion.**

Before asking an LLM to modify code, tell it which part of the monorepo you are working on.

## Recommended prompt

Copy this prompt and replace the placeholders:

```text
You are helping me work on a college Inventory & Treasury Management System (TMS).

This is an npm workspace monorepo:

tms/
├── apps/
│   ├── backend/
│   └── frontend/
├── packages/
│   └── contracts/
└── package.json

Backend:
- Node.js
- Express.js
- TypeScript
- Prisma
- MariaDB/MySQL

Frontend:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui

Shared:
- packages/contracts contains shared frontend/backend TypeScript contracts.

Architecture rules:

1. Inspect the existing project before changing anything.
2. Do not redesign the architecture.
3. Work only on the module I specify.
4. Do not modify another team's module unnecessarily.
5. Reuse existing utilities, components, middleware, API clients, and types.
6. Do not create duplicate Prisma clients.
7. Do not create duplicate shared types if the type already exists in packages/contracts.
8. Backend controllers should stay thin.
9. Backend business logic belongs in services.
10. Frontend feature logic belongs inside the appropriate modules/ folder.
11. Keep Next.js route pages reasonably thin.
12. Reuse existing shadcn/ui components.
13. Follow the existing styling and coding patterns.
14. Do not invent database fields, APIs, functions, or files that do not exist.
15. Do not replace entire files when only a small change is required.
16. Preserve existing code unless the task requires changing it.
17. If required information is missing, ask me instead of guessing.
18. Do not modify prisma/schema.prisma without first explaining the impact.
19. Do not change shared infrastructure unless it is actually necessary.
20. Make the smallest clean change that solves the task.

My team:
[TEAM NUMBER]

My module:
[MODULE PATH]

My task:
[DESCRIBE TASK]

Before modifying code:

1. Inspect the relevant existing files.
2. Identify the files that need to change.
3. Explain any dependencies or shared files that are affected.
4. Then implement the smallest necessary change.

Do not redesign unrelated parts of the project.
```

---

# 15. Additional LLM Instructions for Database Changes

If the LLM suggests changing:

```text
apps/backend/prisma/schema.prisma
```

stop and review the change before applying it.

Ask the LLM:

```text
Before modifying prisma/schema.prisma:

1. Inspect the existing schema.
2. Identify the existing models related to this task.
3. Explain whether an existing model can be reused.
4. Explain the proposed schema changes.
5. Explain affected relationships.
6. Explain the migration that will be required.
7. Identify which other modules could be affected.

Do not modify the schema yet.
```

Database changes affect the entire class project and must be communicated with the other teams.

---

# 16. Team Principle

The project is organized so that eight teams can work independently while sharing one application, database, and set of contracts.

```text
                    TMS MONOREPO
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       Frontend       Backend        Contracts
          │              │              │
      8 feature       8 feature      Shared API
       modules         modules         types
          │              │              │
          └──────────────┼──────────────┘
                         │
                      MariaDB
```

Each team owns its assigned feature.

Shared infrastructure belongs to everyone and therefore requires more coordination.

The goal is:

**independent team work + shared architecture + one database + one monorepo + controlled Git workflow.**
