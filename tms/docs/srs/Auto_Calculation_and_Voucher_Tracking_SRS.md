# Software Requirements Specification (SRS)

## Auto Calculation and Voucher Tracking System

1. Functional Requirements

1.1 Auto Calculation

**FR-01:** Automatic Stock Quantity Calculation

Automatically calculate the current stock quantity of each item whenever an item is added, purchased, issued, returned, or transferred.

**FR-02:** Inventory Value Calculation

Automatically calculate inventory value using quantity and unit price.

**FR-03:** Automatic Stock Balance Update

Automatically update st0ck balances after voucher transactions.

**FR-04:** Closing Stock Calculation

Calculate closing stock using Opening Stock, Inward Quantity , Outward Quantity

**FR-05:** Minimum/Re-order Level Alert

The system shall identify items whose stock falls below the minimum or re-order level.

**FR-06:** Automatic Income Calculation 
Automatically calculate and display total income from valid income-related transactions. 

**FR-07:** Automatic Expenditure Calculation 
Automatically calculate and display total expenditure from valid expenditure-related 
transactions. 

**FR-08:** Net Balance Calculation 
The system shall automatically calculate the net financial balance using: 
• Net Balance = Total Income − Total Expenditure 

**FR-09:** Member Fee and Outstanding Amount Calculation 
The system shall automatically calculate the total payable fees, paid fees, and outstanding fees 
associated with each member. 

**FR-10:** Programme-wise Financial Calculation 
The system shall automatically calculate income and expenditure for each programme using the 
associated financial records. 

**FR-11:** Budget and Remaining Budget Calculation 
Compare the approved budget with actual expenditure & calculate the remaining budget using: 
• Remaining Budget = Approved Budget − Actual Expenditure 
The system shall identify cases where actual expenditure exceeds the approved budget. 

**FR-12:** Voucher Amount Summary 
The system shall calculate and display the total voucher amount for a selected period, 
programme, account, or transaction category. 

2. Automatic Calculation Update
   
**FR-13:** Real-Time Calculation Update
Automatically update relevant calculations when a transaction or fee record is created, modified, or deleted.

**FR-14:** Consistency of Calculations
 Use the latest valid transaction and fee records when generating financial totals.
 
**FR-15:** Calculation by Date Range
The system shall allow users to calculate totals for a specified date range.

**FR-16:** Calculation by Category
The system shall allow users to view calculations according to transaction type, account, programme, member, or other supported categories.

**FR-17:** Calculation History
The system shall maintain appropriate records of important calculated financial information where required for audit and reporting purposes.

3. Voucher Tracking Requirements
   
3.1 Voucher Registration and Association

**FR-18:** Voucher Registration
Allow authorized users to record voucher information for a financial transaction.

**FR-19:** Voucher Identification
Each voucher shall have a unique voucher identifier or voucher number.

**FR-20:** Transaction Association
The system shall associate a voucher with the relevant transaction.

**FR-21:** Programme Association
Where applicable, the system shall associate a voucher with the relevant programme or activity.

**FR-22:** Voucher Amount Association
Maintain the amount represented by the voucher and allow comparison with the associated transaction amount.

3.2 Voucher Status Tracking

**FR-23:** Voucher Status
The system shall maintain the current status of each voucher. Possible statuses may include:
•	Pending
•	Submitted
•	Verified
•	Approved
•	Rejected
•	Paid
•	Cancelled

**FR-24:** Voucher Status Update
Authorized users shall be able to update the status of a voucher according to their assigned permissions.

**FR-25:** Voucher Status Display
Display the current voucher status when viewing voucher or transaction details.

**FR-26:** Pending Voucher Identification
The system shall identify vouchers that have not yet been verified, approved, or completed.

**FR-27:** Rejected Voucher Identification
The system shall identify rejected vouchers and display the relevant status for authorized users.

5. Voucher Verification and Reconciliation
   
**FR-28:** Voucher Verification
Authorized users shall be able to verify whether a voucher is valid and associated with the correct transaction.

**FR-29:** Amount Matching
The system shall compare the voucher amount with the associated transaction amount.

**FR-30:** Mismatch Detection
Identify and flag cases where the voucher amount does not match the transaction amount.

**FR-31:** Missing Voucher Detection
Identify transactions for which a required voucher has not been attached or registered.

**FR-32:** Voucher Completion Tracking
Indicate whether the voucher-related requirements of a transaction are complete.

**FR-33:** Reconciliation Status
The system shall provide a reconciliation status for transactions and vouchers where applicable.
Example statuses:       Matched → Mismatch → Pending Verification → Reconciled

7. Transaction and Voucher Tracking

**FR-34:** Transaction-Voucher Relationship
The system shall display the voucher information associated with a transaction.

**FR-35:** Voucher-to-Transaction Tracking
The system shall allow authorized users to identify the transaction associated with a voucher.

**FR-36:** Unlinked Voucher Detection
The system shall identify vouchers that are not associated with a valid transaction.

**FR-37:** Voucher Completion Indicator
The system shall indicate whether each transaction has:
•	No voucher
•	Voucher added
•	Voucher verified
•	Voucher approved
•	Voucher reconciled

**FR-38:** Transaction History Integration
Changes to voucher status and important voucher-related actions shall be reflected in the transaction history or audit records where applicable.
9. Notification Integration

**FR-39:** Pending Voucher Notification
The system shall integrate with the Notification and Reminder Module to notify authorized users about pending voucher verification or approval.

**FR-40:** Voucher Mismatch Notification
The system shall generate a notification when a voucher amount does not match its associated transaction amount.

**FR-41:** Missing Voucher Notification
The system shall generate a notification when a transaction requiring a voucher has no associated voucher.

**FR-42:** Voucher Status Notification
The system may notify relevant users when a voucher is approved, rejected, or otherwise changes to an important status.

**FR-43:** Notification Control
Voucher-related notifications shall follow the notification preferences and task-level notification settings defined in the Notification and Reminder Module.

10. Reporting and Summary

**FR-44:** Financial Summary
The system shall provide a financial summary containing relevant automatically calculated values such as:
•	Total income
•	Total expenditure
•	Net balance
•	Outstanding amount
•	Budget
•	Actual expenditure
•	Remaining budget

**FR-45:** Voucher Summary
The system shall provide a voucher summary showing the number and amount of vouchers by status.

**FR-46:** Pending Voucher Report
The system shall allow authorized users to view pending, unverified, or unreconciled vouchers.

**FR-47:** Voucher Mismatch Report
The system shall allow authorized users to identify transactions with voucher amount mismatches.

**FR-48:** Programme-wise Calculation
The system shall display financial calculations and voucher status based on individual programmes where applicable.

**FR-49:** Period-wise Report
The system shall allow financial and voucher information to be summarized for a selected period.

9. Search and Filtering
   
**FR-50:** Search Voucher
The system shall allow users to search for vouchers using voucher number, transaction ID, date, amount, programme, or status.

**FR-51:** Filter Voucher
The system shall allow users to filter vouchers by:
•	Status
•	Date
•	Programme
•	Transaction type
•	Account
•	Verification state

**FR-52:** Sort Voucher Records
The system shall allow users to sort voucher records by date, amount, voucher number, or status.

10. Audit and Activity Tracking
    
**FR-53:** Voucher Activity Recording
The system shall record important voucher actions such as creation, status change, verification, approval, rejection, and deletion.

**FR-54:** Calculation-related Audit
Important financial record modifications that affect automatic calculations shall be auditable.

**FR-55:** User Identification
The system shall record the user responsible for important voucher-related actions.

**FR-56:** Timestamp Recording
The system shall record the date and time of important voucher and financial record changes.
The audit information shall integrate with the existing audit_logs functionality defined in the User Authentication and Access Control module.


5. Non-Functional Requirements

5.1 Performance

The system shall perform calculations quickly.

Stock and voucher information shall be updated promptly.

5.2 Accuracy

The system shall provide accurate calculations.

Stock and inventory values shall remain consistent.

5.3 Security

Only authorized users shall access the system.

User and inventory data shall be protected.

5.4 Reliability

The system shall operate reliably.

Transaction data shall be protected from loss or corruption.

5.5 Scalability

The system shall support increasing inventory items and transactions.

5.6 Usability

The system shall provide a simple and user-friendly interface.
