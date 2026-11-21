6. accounts
Stores financial accounts used for treasury management.

Field	            Type	        Key	        Description
account_id	        INT	            PK	        Unique account ID
account_name	    VARCHAR(100)		        Cash, Bank Account, etc.
account_type	    VARCHAR(50)		            Cash/Bank/Other
account_number	    VARCHAR(100)		        Account number
opening_balance	    DECIMAL(15,2)		        Starting balance
current_balance	    DECIMAL(15,2)		        Current balance
status	            VARCHAR(20)		            Active/Inactive
created_at	        DATETIME		            Account creation date

7. transactions
Stores income, expense, and transfer transactions.

Field	            Type	        Key	        Description
transaction_id	    INT	            PK	        Unique transaction ID
transaction_number	VARCHAR(50)	    UNIQUE	    Transaction number
account_id	        INT	            FK	        References accounts
transaction_type	VARCHAR(30)		            Income/Expense/Transfer
category	        VARCHAR(100)		        Transaction category
amount	            DECIMAL(15,2)		        Transaction amount
description	        TEXT		                Transaction details
reference_number	VARCHAR(100)		        External reference
transaction_date	DATETIME		            Transaction date
status	            VARCHAR(20)		            Pending/Completed/Cancelled
created_by	        INT	            FK	        References users
created_at	        DATETIME		            Record creation date