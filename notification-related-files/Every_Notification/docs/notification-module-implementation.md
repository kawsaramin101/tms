# Notification module implementation

This patch adds the in-app notification center to the existing TMS project.

## Included

- Authenticated notification list, unread count, unread-only filtering, mark-one-read, mark-all-read, and delete endpoints.
- Per-user notification preferences for transactions, payment reminders, overdue payments, low inventory, and task reminders.
- Transaction-created alerts.
- Daily reminders for unpaid member fees due today/tomorrow or overdue.
- Daily low-stock alerts based on `Item.quantity` and `Item.minimumQuantity`.
- Notifications page with All / Unread / Preferences tabs and navigation link.
- Unique deduplication keys so the daily scan does not repeatedly create the same alert.

## Apply the database migration

From the repository root:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate --workspace=tms-be
```

The checked-in migration is `apps/backend/prisma/migrations/20261102190000_notification_preferences/migration.sql`.

Then build and run:

```bash
npm run build
npm run dev
```

## Important scope notes

- The current repository does not contain a Task model or task-management module. Therefore this patch exposes a `taskReminder` preference but does not create task reminders or per-task ON/OFF controls. Those require a real Task entity, task ownership/assignment rules, and task CRUD flows.
- Low-stock and member-fee reminders are scanned once when the backend starts and then every 24 hours. They are in-app notifications; email, SMS, browser push, and real-time sockets are not included.
- Payment reminders use the existing `MemberFee` records. There is no separate general-purpose outgoing-payment due-date entity in the current schema.
- Notifications are created for all active users. If the application later adds departments or responsible-user assignments, recipient targeting should be narrowed accordingly.
