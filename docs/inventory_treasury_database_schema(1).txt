# Inventory and Treasury Management System

## Database Schema

The system contains **14 tables** based on the original 8 requirements.

---

## 1. `users`

Stores people who can log in and use the system.

| Field | Type | Key | Description |
|---|---|---|---|
| `user_id` | INT | PK | Unique user ID |
| `name` | VARCHAR(100) | | User's full name |
| `email` | VARCHAR(150) | UNIQUE | Login email |
| `password_hash` | VARCHAR(255) | | Hashed password |
| `role` | VARCHAR(50) | | Admin, Accountant, Staff, etc. |
| `phone` | VARCHAR(20) | | Phone number |
| `status` | VARCHAR(20) | | Active/Inactive |
| `created_at` | DATETIME | | Account creation date |

---

## 2. `members`

Stores students, staff, or other members whose fees are managed.

| Field | Type | Key | Description |
|---|---|---|---|
| `member_id` | INT | PK | Unique member ID |
| `member_code` | VARCHAR(50) | UNIQUE | Member/student code |
| `name` | VARCHAR(100) | | Member's full name |
| `member_type` | VARCHAR(50) | | Student, Staff, etc. |
| `department` | VARCHAR(100) | | Department |
| `phone` | VARCHAR(20) | | Phone number |
| `email` | VARCHAR(150) | | Email |
| `address` | TEXT | | Address |
| `status` | VARCHAR(20) | | Active/Inactive |
| `created_at` | DATETIME | | Registration date |

---

## 3. `fee_types`

Stores different types of fees.

| Field | Type | Key | Description |
|---|---|---|---|
| `fee_type_id` | INT | PK | Unique fee type ID |
| `fee_name` | VARCHAR(100) | | Tuition, Library, Exam, etc. |
| `default_amount` | DECIMAL(12,2) | | Default fee amount |
| `description` | TEXT | | Fee details |
| `status` | VARCHAR(20) | | Active/Inactive |

---

## 4. `member_fees`

Stores fees assigned to individual members.

| Field | Type | Key | Description |
|---|---|---|---|
| `member_fee_id` | INT | PK | Unique fee record |
| `member_id` | INT | FK | References `members` |
| `fee_type_id` | INT | FK | References `fee_types` |
| `amount_due` | DECIMAL(12,2) | | Amount that should be paid |
| `amount_paid` | DECIMAL(12,2) | | Amount already paid |
| `discount` | DECIMAL(12,2) | | Discount amount |
| `fine` | DECIMAL(12,2) | | Fine/late fee |
| `due_date` | DATE | | Payment deadline |
| `status` | VARCHAR(20) | | Pending/Paid/Partial/Overdue |
| `created_at` | DATETIME | | Record creation date |

### Auto Calculation

```text
Outstanding Amount =
Amount Due + Fine - Discount - Amount Paid
```

---

## 5. `fee_payments`

Stores individual fee payment records.

| Field | Type | Key | Description |
|---|---|---|---|
| `payment_id` | INT | PK | Unique payment ID |
| `member_fee_id` | INT | FK | References `member_fees` |
| `receipt_number` | VARCHAR(50) | UNIQUE | Payment receipt number |
| `amount` | DECIMAL(12,2) | | Paid amount |
| `payment_method` | VARCHAR(30) | | Cash, Bank, Mobile Banking, etc. |
| `payment_date` | DATETIME | | Payment date |
| `reference_number` | VARCHAR(100) | | Transaction/reference number |
| `received_by` | INT | FK | References `users` |
| `remarks` | TEXT | | Additional information |

---

## 6. `accounts`

Stores financial accounts used for treasury management.

| Field | Type | Key | Description |
|---|---|---|---|
| `account_id` | INT | PK | Unique account ID |
| `account_name` | VARCHAR(100) | | Cash, Bank Account, etc. |
| `account_type` | VARCHAR(50) | | Cash/Bank/Other |
| `account_number` | VARCHAR(100) | | Account number |
| `opening_balance` | DECIMAL(15,2) | | Starting balance |
| `current_balance` | DECIMAL(15,2) | | Current balance |
| `status` | VARCHAR(20) | | Active/Inactive |
| `created_at` | DATETIME | | Account creation date |

---

## 7. `transactions`

Stores income, expense, and transfer transactions.

| Field | Type | Key | Description |
|---|---|---|---|
| `transaction_id` | INT | PK | Unique transaction ID |
| `transaction_number` | VARCHAR(50) | UNIQUE | Transaction number |
| `account_id` | INT | FK | References `accounts` |
| `transaction_type` | VARCHAR(30) | | Income/Expense/Transfer |
| `category` | VARCHAR(100) | | Transaction category |
| `amount` | DECIMAL(15,2) | | Transaction amount |
| `description` | TEXT | | Transaction details |
| `reference_number` | VARCHAR(100) | | External reference |
| `transaction_date` | DATETIME | | Transaction date |
| `status` | VARCHAR(20) | | Pending/Completed/Cancelled |
| `created_by` | INT | FK | References `users` |
| `created_at` | DATETIME | | Record creation date |

---

## 8. `vouchers`

Stores vouchers and their uploaded photos/files.

| Field | Type | Key | Description |
|---|---|---|---|
| `voucher_id` | INT | PK | Unique voucher ID |
| `voucher_number` | VARCHAR(50) | UNIQUE | Voucher number |
| `transaction_id` | INT | FK | References `transactions` |
| `voucher_type` | VARCHAR(30) | | Payment/Receipt/Expense/etc. |
| `amount` | DECIMAL(15,2) | | Voucher amount |
| `description` | TEXT | | Voucher details |
| `photo_path` | VARCHAR(255) | | Stored photo/file path |
| `photo_name` | VARCHAR(255) | | Original file name |
| `photo_type` | VARCHAR(50) | | JPG, PNG, PDF, etc. |
| `status` | VARCHAR(20) | | Pending/Approved/Rejected |
| `created_by` | INT | FK | References `users` |
| `approved_by` | INT | FK | References `users` |
| `approved_at` | DATETIME | | Approval date/time |
| `created_at` | DATETIME | | Record creation date |

> The voucher photo/file is stored through `photo_path`, `photo_name`, and `photo_type` in the same `vouchers` table.

---

## 9. `categories`

Stores categories for inventory items.

| Field | Type | Key | Description |
|---|---|---|---|
| `category_id` | INT | PK | Unique category ID |
| `category_name` | VARCHAR(100) | UNIQUE | Category name |
| `description` | TEXT | | Category details |
| `status` | VARCHAR(20) | | Active/Inactive |

---

## 10. `items`

Stores inventory items.

| Field | Type | Key | Description |
|---|---|---|---|
| `item_id` | INT | PK | Unique item ID |
| `item_code` | VARCHAR(50) | UNIQUE | Item code |
| `item_name` | VARCHAR(100) | | Item name |
| `category_id` | INT | FK | References `categories` |
| `unit` | VARCHAR(30) | | Piece, Box, Kg, etc. |
| `quantity` | DECIMAL(12,2) | | Current stock quantity |
| `minimum_quantity` | DECIMAL(12,2) | | Minimum stock level |
| `unit_price` | DECIMAL(12,2) | | Price per unit |
| `description` | TEXT | | Item details |
| `status` | VARCHAR(20) | | Available/Inactive |
| `created_at` | DATETIME | | Item creation date |
| `updated_at` | DATETIME | | Last update date |

---

## 11. `inventory_transactions`

Tracks inventory purchases, issues, returns, and adjustments.

| Field | Type | Key | Description |
|---|---|---|---|
| `inventory_transaction_id` | INT | PK | Unique inventory transaction ID |
| `item_id` | INT | FK | References `items` |
| `transaction_type` | VARCHAR(30) | | Purchase/Issue/Return/Adjustment |
| `quantity` | DECIMAL(12,2) | | Quantity involved |
| `unit_price` | DECIMAL(12,2) | | Price per unit |
| `total_amount` | DECIMAL(15,2) | | Total transaction amount |
| `transaction_date` | DATETIME | | Transaction date |
| `reference_number` | VARCHAR(100) | | Related reference number |
| `remarks` | TEXT | | Additional information |
| `created_by` | INT | FK | References `users` |
| `created_at` | DATETIME | | Record creation date |

---

## 12. `notifications`

Stores system notifications and reminders.

| Field | Type | Key | Description |
|---|---|---|---|
| `notification_id` | INT | PK | Unique notification ID |
| `user_id` | INT | FK | References `users` |
| `title` | VARCHAR(150) | | Notification title |
| `message` | TEXT | | Notification message |
| `notification_type` | VARCHAR(50) | | Fee Reminder, Low Stock, etc. |
| `is_read` | BOOLEAN | | Whether notification was read |
| `created_at` | DATETIME | | Notification creation date |
| `read_at` | DATETIME | | Date/time notification was read |

---

## 13. `audit_logs`

Stores system activity for security and tracking.

| Field | Type | Key | Description |
|---|---|---|---|
| `log_id` | INT | PK | Unique log ID |
| `user_id` | INT | FK | References `users` |
| `action` | VARCHAR(50) | | Create, Update, Delete, Login, etc. |
| `table_name` | VARCHAR(100) | | Affected table |
| `record_id` | INT | | ID of affected record |
| `description` | TEXT | | Details of the action |
| `ip_address` | VARCHAR(45) | | User IP address |
| `created_at` | DATETIME | | Log creation date |

---

## 14. `backups`

Stores information about database backups.

| Field | Type | Key | Description |
|---|---|---|---|
| `backup_id` | INT | PK | Unique backup ID |
| `file_name` | VARCHAR(255) | | Backup file name |
| `file_path` | VARCHAR(255) | | Backup file location |
| `backup_type` | VARCHAR(30) | | Full/Partial/Automatic/Manual |
| `file_size` | BIGINT | | Backup file size |
| `status` | VARCHAR(20) | | Successful/Failed |
| `created_by` | INT | FK | References `users` |
| `created_at` | DATETIME | | Backup creation date |

---

# Relationships

```text
users
  |
  +----< fee_payments
  |
  +----< transactions
  |
  +----< vouchers
  |
  +----< inventory_transactions
  |
  +----< notifications
  |
  +----< audit_logs
  |
  +----< backups


members
  |
  +----< member_fees
           |
           +---- fee_types
           |
           +----< fee_payments


accounts
  |
  +----< transactions
             |
             +----< vouchers


categories
  |
  +----< items
           |
           +----< inventory_transactions
```

---

# Original Requirements Mapping

| Requirement | Related Tables |
|---|---|
| 1. User Authentication and Access Control | `users` |
| 2. Transaction Tracking | `transactions`, `accounts`, `fee_payments`, `inventory_transactions` |
| 3. Voucher Photo Upload and Management | `vouchers` |
| 4. Auto Calculation and Voucher Tracking | `member_fees`, `fee_payments`, `vouchers` |
| 5. Member & Fee Management | `members`, `fee_types`, `member_fees`, `fee_payments` |
| 6. Reporting Status | Reports can be generated from existing tables |
| 7. Notification & Reminders | `notifications` |
| 8. Data Backup & Security | `backups`, `audit_logs`, `users` |

---

# Total Tables

1. `users`
2. `members`
3. `fee_types`
4. `member_fees`
5. `fee_payments`
6. `accounts`
7. `transactions`
8. `vouchers`
9. `categories`
10. `items`
11. `inventory_transactions`
12. `notifications`
13. `audit_logs`
14. `backups`

**Total: 14 tables**
