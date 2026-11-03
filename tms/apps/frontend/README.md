# Vault — Inventory & Treasury Management System (Frontend)

Frontend for the class's Inventory & Treasury Management System. Built with **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui**. Talks to a separate Express + TypeScript backend.

---

## 1. Getting started

### Clone the repo

```bash
git clone https://github.com/kawsaramin101/tms-fe.git
cd tms-fe
```

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```


### Run the dev server

```bash
npm run dev
```

Visit **http://localhost:3000**.

---

## 2. Project structure

```
src/
├── app/                          # Routes only (Next.js App Router). Keep pages thin.
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── transactions/page.tsx
│   │   ├── vouchers/page.tsx
│   │   ├── members/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── backup/page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx                # Root layout — fonts, ThemeProvider, global wrappers
│   ├── page.tsx                  # Home page
│   └── globals.css               # Shared Tailwind + shadcn design tokens — DO NOT edit casually
│
├── components/
│   ├── ui/                       # shadcn/ui primitives (button, card, dialog...) — SHARED, don't fork
│   ├── layout/                   # Navbar, Sidebar, Footer — shared app shell
│   └── shared/                   # Cross-team reusable pieces (mode-toggle, StatusBadge, DataTable...)
│
├── modules/                      # ⭐ One folder per team — this is where you actually work
│   ├── auth/
│   ├── transactions/
│   ├── vouchers/
│   ├── auto-calculation/
│   ├── members-fees/
│   ├── reporting/
│   ├── notifications/
│   └── backup-security/
│       Each module folder has:
│       ├── components/           # UI specific to this feature
│       ├── hooks/                # Feature-specific hooks
│       ├── api.ts                # Calls to the backend for this feature
│       ├── types.ts              # TypeScript types for this feature
│       └── utils.ts              # Feature-specific helpers
│
├── lib/                          # Shared, low-level utilities — edit with care, affects everyone
│   ├── api-client.ts             # Base fetch/axios wrapper, backend URL, auth headers
│   ├── auth.ts                   # Shared auth context/hooks
│   ├── utils.ts                  # cn() and general helpers
│   └── constants.ts
│
├── types/
│   └── index.ts                  # Global shared types (User, ApiResponse, etc.)
│
└── components/theme-provider.tsx # Dark mode provider (next-themes)
```

### Who owns what

| Requirement | Folder |
|---|---|
| User Authentication & Access Control | `modules/auth` |
| Transaction Tracking | `modules/transactions` |
| Voucher Photo Upload & Management | `modules/vouchers` |
| Auto Calculation & Voucher Tracking | `modules/auto-calculation` |
| Member & Fee Management | `modules/members-fees` |
| Reporting Status | `modules/reporting` |
| Notifications & Reminders | `modules/notifications` |
| Data Backup & Security | `modules/backup-security` |

### Ground rules

- **Stay inside your `modules/<your-team>/` folder.** Add your route under `app/(dashboard)/<your-route>/page.tsx`, but build the actual logic/components inside your module and import them into the page.
- **`components/ui/`, `app/globals.css`, and `app/layout.tsx` are shared** — don't edit them directly. If you need a design system change, open a PR and flag it so it doesn't clash with everyone else.
- **Default to Server Components.** Only add `"use client"` at the top of a file if it uses `useState`, `useEffect`, `onClick`/`onChange`, or any browser-only API.
- **Use theme tokens, not hardcoded colors.** Use `bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-muted-foreground`, etc. — not `bg-white`, `text-gray-500`, `#ffffff`. This is what makes dark mode and consistent styling work automatically across all 8 teams' work.
- **shadcn components:** if you need a new one (e.g. `dialog`, `select`), run `npx shadcn@latest add <component>` — don't hand-write your own version of something shadcn already provides.

---

## 3. Tech stack

- **Framework:** Next.js (App Router, SSR)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (Base UI, Mira style preset)
- **Icons:** lucide-react
- **Dark mode:** next-themes
- **Backend:** Express + TypeScript (separate repo)

---

## 4. Using an AI assistant (Claude / ChatGPT / Copilot) on this project

If you're using an AI assistant to help write code for your module, give it this context so it doesn't produce code that clashes with the rest of the app:

> This is a Next.js (App Router) + TypeScript + Tailwind + shadcn/ui project. I'm working only inside `src/modules/<my-team-name>/` and my route at `src/app/(dashboard)/<my-route>/page.tsx`. Don't modify `src/components/ui/`, `src/app/globals.css`, or `src/app/layout.tsx`. Use shadcn/ui components from `@/components/ui/*` and Tailwind theme tokens (`bg-background`, `text-foreground`, `bg-primary`, etc.) instead of hardcoded colors, so it matches the rest of the app in both light and dark mode. Default to Server Components; only add `"use client"` if the component needs `useState`, `useEffect`, or event handlers. Backend calls go through `@/lib/api-client.ts`.

A few specific things worth telling it per task:
- **When asking for a new page/component:** tell it which module folder it belongs in, and paste in `src/lib/api-client.ts` and `src/lib/utils.ts` so it reuses your existing patterns instead of inventing new ones.
- **When asking for API calls:** tell it the backend route and expected request/response shape (or paste the relevant Express controller) so the types line up.
- **When asking for styling:** tell it "match the Mira shadcn style, navy/gold accent, dense/professional look" — otherwise it'll default to generic purple SaaS styling.
- **Always review AI-generated code before merging** — check it didn't touch shared files, didn't hardcode colors, and follows the `"use client"` rule above.

---

## 5. Useful commands

```bash
npm run dev          # start dev server
npm run build         # production build
npm run lint          # lint check
npx shadcn@latest add <component>   # add a new shadcn/ui component
```

# Git & GitHub Workflow

Everyone works directly from the main repository as a GitHub collaborator.

Repository:

```text
https://github.com/kawsaramin101/tms-fe
```

## 1. Clone the repository

```bash
git clone https://github.com/kawsaramin101/tms-fe.git
cd tms-be
```

## 2. Create your own branch

**Do not work directly on `main`.**

```bash
git checkout -b feature/<your-feature>
```

Examples:

```bash
git checkout -b feature/member-management
git checkout -b feature/voucher-upload
git checkout -b feature/transaction-api
```

## 3. Work on your feature

Make your changes inside your team's module.

For example:

```text
src/modules/members/
```

## 4. Commit your changes

```bash
git status
git add .
git commit -m "feat: add member management"
```

Use clear commit messages:

```text
feat: add member management
feat: add voucher upload
fix: validate transaction amount
refactor: simplify transaction service
docs: update API documentation
```

## 5. Push your branch

```bash
git push -u origin feature/<your-feature>
```

Example:

```bash
git push -u origin feature/member-management
```

## 6. Create a Pull Request

After pushing your branch, open the repository on GitHub.

Create a Pull Request:

```text
your branch
     ↓
main
```

Explain:

* What you changed
* Which module you worked on
* Whether you changed the database
* How you tested it

Wait for the project maintainer/team lead to review and merge the Pull Request.

## 7. Keep your branch updated

Before starting new work, update your local `main`:

```bash
git checkout main
git pull origin main
```

Then create a new branch:

```bash
git checkout -b feature/<your-feature>
```

If you are already working on a branch and `main` has received important changes, coordinate before merging `main` into your branch.

## Important Rules

* **Never push directly to `main`.**
* One feature/task = one branch.
* Use descriptive branch names.
* Keep your changes focused on your assigned module.
* Don't modify another team's module unnecessarily.
* Don't commit `.env` secrets or production credentials.
* Database/schema changes must be communicated to the team before merging.
