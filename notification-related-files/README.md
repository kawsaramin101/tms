# TMS Notification Module - Selected Files

This archive contains the notification-related source files and the integration files required by this implementation. It intentionally excludes the Git repository, node_modules, build output, and unrelated application modules.

## Included

- Backend notification API: routes, controller, service, DTO mapping
- Frontend notification page, API client, and types
- Shared notification contracts
- Backend app route registration and frontend Navbar link (integration files)
- Prisma notification migration and schema (integration files)
- Notification implementation notes and the supplied SRS

## Important integration notes

1. `apps/backend/prisma/schema.prisma` is the complete schema from the implementation snapshot, not a standalone notification-only schema. Do not replace a newer team schema blindly. Merge the `Notification` and `NotificationPreference` models, plus the notification relation fields on `User`, into the team's current schema.
2. `apps/backend/src/app.ts`, `apps/frontend/src/components/layout/Navbar.tsx`, and `packages/contracts/src/index.ts` are complete integration files. If the team's versions have changed, merge only the notification import/route or export/navigation link rather than overwriting their work.
3. The included migration adds the notification deduplication key and notification-preference table. Review it against the team's migration history before applying.
4. The current implementation notes that the repository has no Task model/module. Therefore task reminders and per-task notification ON/OFF controls are NOT implemented in this patch. The `taskReminder` preference is only a placeholder.
5. Do not commit your local `.env` file or database credentials.

## Paths

All paths inside this archive are relative to the repository root (`tms/`). Copy/merge them into the matching paths in your working repository.
