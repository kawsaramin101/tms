# Software Requirements Specification (SRS)

## Module: Transaction Management (Group 2)

### 1. Purpose

The system shall allow authorized users to record financial transactions.

The system shall allow authorized users to view, update, and delete transaction records.

The system shall maintain accurate and up-to-date transaction information.

The system shall allow users to search and filter transactions.

The system shall link transactions to vouchers where applicable.

### 2. Functional Requirements

#### 2.1 Transaction Management

**FR-01:** Create Transaction
The system shall allow authorized users to create a new transaction with details such as transaction ID, date, amount, type, account, and description.

**FR-02:** View Transactions
The system shall allow users to view a list of all transactions.

**FR-03:** View Transaction Details
The system shall allow users to view the full details of a specific transaction.

**FR-04:** Update Transaction
The system shall allow authorized users to update an existing transaction record.

**FR-05:** Delete Transaction
The system shall allow authorized users to delete an incorrect or unnecessary transaction record.

**FR-06:** Transaction History
The system shall maintain a history of transactions, including who created or modified each record and when.

#### 2.2 Transaction Types

**FR-07:** Transaction Categorization
The system shall categorize transactions by type, such as credit, debit, payment, receipt, transfer, or adjustment.

**FR-08:** Account Association
The system shall associate each transaction with the relevant account(s).

**FR-09:** Voucher Linkage
The system shall allow a transaction to be linked to a supporting voucher.

#### 2.3 Search and Filtering

**FR-10:** Search Transactions
The system shall allow users to search transactions by transaction ID, date, amount, account, or type.

**FR-11:** Filter Transactions
The system shall allow users to filter transactions by date range, type, account, or status.

**FR-12:** Sort Transactions
The system shall allow users to sort transactions by date, amount, or type.

#### 2.4 Calculations and Totals

**FR-13:** Running Balance
The system shall calculate and display the running balance of an account based on its transactions.

**FR-14:** Transaction Totals
The system shall compute totals for transactions within a selected period, grouped by type or account.

**FR-15:** Transaction Status
The system shall track and display the status of each transaction (e.g., pending, completed, cancelled).

### 3. Non-Functional Requirements

#### Security
Only authorized users shall be allowed to create, update, or delete transaction records.

Sensitive transaction and account information shall be protected from unauthorized access.

#### Performance
Transaction operations should be completed within a reasonable response time.

#### Reliability
The system shall maintain accurate and consistent transaction records.

#### Usability
The Transaction Management interface should be simple and easy to understand.

#### Data Integrity
The system shall maintain a consistent relationship between transactions, accounts, and vouchers.

#### Availability
The Transaction Management module should be available whenever the overall system is operational.

#### Maintainability
The module should be structured so that future modifications and feature additions can be performed easily.

#### Auditability
The system shall record who performed each transaction operation and when, to support auditing.
