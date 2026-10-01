# Software Requirements Specification (SRS)

## Auto Calculation and Voucher Tracking System

1. Functional Requirements

1.1 Auto Calculation

**FR-01:** Automatic Stock Quantity Calculation

Automatically calculate the current stock quantity of each item whenever an item is added, purchased, issued, returned, or transferred.

**FR-02:** Inventory Value Calculation

Automatically calculate inventory value using quantity and unit price.

**FR-03:** Automatic Stock Balance Update

Automatically update stock balances after voucher transactions.

**FR-04:** Closing Stock Calculation

Calculate closing stock using Opening Stock, Inward Quantity , Outward Quantity

**FR-05:** Minimum/Re-order Level Alert

The system shall identify items whose stock falls below the minimum or re-order level.

**FR-06:** Tax, Discount and Total Calculation

Automatically calculate taxes, discounts, and total amounts during voucher entry.

3. Voucher Tracking Requirements

**FR-07:** Voucher Type Management

The system shall support:

Purchase Voucher

Issue Voucher

Return Voucher

Transfer Voucher

**FR-08:** Unique Voucher Number

Automatically generate a unique voucher number for every voucher.

**FR-09:** Voucher Details

The system shall record:

Voucher ID/Number

Date

Voucher Type

Item Name

Quantity

Unit Price/Rate

Tax

Discount

Total Amount

User/Created By

Status

**FR-10:** Voucher Search and Filter

The system shall allow users to search and filter vouchers by:

Date

Voucher Type

Status

Item

Voucher Number

**FR-11:** Voucher Approval Workflow

`The system shall maintain the following workflow:
Pending → Approved → Posted
A voucher may also be Cancelled when necessary.`

**FR-12:** Voucher Status Tracking

Display the current status of each voucher and maintain its status history.

4. Inventory Management

**FR-13:** Item Management

Allow authorized users to add, update, and remove inventory items.

**FR-14:** Stock Inward Management

The system shall increase stock automatically when a valid purchase or return voucher is posted.

**FR-15:** Stock Outward Management

The system shall decrease stock automatically when an issue or transfer-out voucher is posted.

**FR-16:** Real-Time Stock Information

The system shall display the current stock quantity and inventory value of each item.

Item Information

Item ID

Item Name

Category

Unit Price

Current Quantity

Minimum Stock Level

Re-order Level

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
