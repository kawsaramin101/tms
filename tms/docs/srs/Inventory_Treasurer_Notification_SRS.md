# Software Requirements Specification (SRS)
## Inventory / Treasurer Management System
### Module: Notification and Reminders

**Group:** 07  
**ID:** 10, 20, 31, 32, 34

---

## 1. Introduction

### 1.1 Purpose

The purpose of the **Inventory / Treasurer Management System** is to help an organization manage inventory, financial transactions, payments, and related activities efficiently.

The **Notification and Reminder Module** will notify users about important transactions, upcoming payments, due dates, and task-related activities. It will also allow users to control notifications for individual tasks.

### 1.2 Scope

The Notification and Reminder Module will provide:

- Transaction notifications
- Payment reminders
- Due-date reminders
- Read/unread notification status
- Notification management
- Task notification On/Off control
- Notification history
- Automatic and scheduled reminders

---

# 2. Functional Requirements

## FR-01: Transaction Notification

The system shall notify users when an important financial or inventory transaction occurs.

**Examples:**
- New transaction added
- Payment received
- Payment made
- Inventory item added or updated

---

## FR-02: Payment Reminder

The system shall send reminders for upcoming or pending payments.

The reminder should contain relevant information such as:

- Payment name
- Amount
- Due date
- Payment status

---

## FR-03: Read/Unread Status

The system shall maintain the status of each notification as **Read** or **Unread**.

Users shall be able to:

- View unread notifications
- Open a notification
- Mark a notification as read

---

## FR-04: Due Date Reminder

The system shall generate reminders when a payment, task, or other activity approaches its due date.

The system may provide reminders:

- Before the due date
- On the due date
- After the due date, if necessary

---

## FR-05: Notification Management

Authorized users shall be able to manage notifications.

The system shall allow users to:

- View notifications
- Read notifications
- Mark notifications as read
- Delete notifications, if permitted
- View notification details

---

## FR-06: Task Notification On/Off

The system shall allow users to **enable or disable notifications for individual tasks**.

For example:

- Task: Submit monthly report → **Notification: ON**
- Task: Update inventory → **Notification: OFF**

When notification is turned off for a task, the system shall not send reminders for that task.

---

## FR-07: Notification History

The system shall maintain a history of previously generated notifications.

Users shall be able to view information such as:

- Notification title
- Notification type
- Date and time
- Read/unread status
- Related task or transaction

---

## FR-08: Automatic Notifications

The system shall automatically generate notifications when predefined conditions are satisfied.

**Example:**

> If a payment is due tomorrow, the system generates a payment reminder.

---

## FR-09: Notification Preferences

The system shall allow users to control notification preferences where applicable.

Users may choose which types of notifications they want to receive.

---

## FR-10: Low Inventory Notification

The system shall notify the responsible user when the quantity of an inventory item falls below its predefined minimum level.

---

# 3. Non-Functional Requirements

## NFR-01: Performance

The system should generate and display notifications without significant delay.

---

## NFR-02: Reliability

The notification system should reliably generate scheduled notifications and reminders according to predefined conditions.

---

## NFR-03: Security and Privacy

Only authorized users shall be able to access notifications and notification-related information.

Sensitive financial information shall be protected from unauthorized access.

---

## NFR-04: Timeliness

Notifications and reminders should be delivered at the appropriate time, particularly for payment and due-date reminders.

---

## NFR-05: Scalability

The system should be able to handle an increasing number of users, tasks, transactions, and notifications without major performance problems.

---

## NFR-06: Usability

The notification interface should be simple and easy to understand.

Users should be able to identify:

- New notifications
- Unread notifications
- Important reminders
- Notification On/Off status

---

## NFR-07: Maintainability

The notification module should be easy to modify and maintain when new notification types or reminder rules are added.

---

## NFR-08: Availability

The notification system should be available whenever the main system is operational.

---

## NFR-09: Compatibility

The system should work properly on commonly used web browsers and devices.

---

## NFR-10: Auditability

The system should maintain appropriate records of important notifications and their status for future reference.

---

# 4. User Roles

### Administrator / Treasurer

The administrator or treasurer can:

- Manage transactions
- Create and manage tasks
- Set due dates
- View notifications
- Manage notification settings
- Monitor payment reminders
- Monitor inventory-related notifications

### General User

A general user can:

- View notifications
- Read notifications
- Mark notifications as read
- Enable/disable task notifications
- View relevant reminders

---

# 5. Example Notification Scenarios

| Event | Notification |
|---|---|
| New transaction added | New transaction notification |
| Payment approaching | Payment reminder |
| Payment overdue | Overdue payment notification |
| Task approaching deadline | Task reminder |
| Inventory below minimum | Low-stock notification |
| Notification generated | Appears as unread |
| Task notification disabled | No reminder for that task |

---

# 6. Basic Use Case

### Use Case: Turn Task Notification On/Off

**Actor:** User

**Precondition:**  
The user is logged into the system and has access to the task.

**Steps:**

1. User opens the task list.
2. User selects a task.
3. System displays the task details.
4. User sees the notification setting.
5. User turns notification **ON** or **OFF**.
6. System saves the setting.
7. System applies the setting to future reminders.

**Postcondition:**  
The selected task's notification preference is updated.

---

# 7. Expected Outcome

The Notification and Reminder Module will help users stay informed about important transactions, payments, deadlines, inventory conditions, and tasks while giving them control over individual task notifications.
