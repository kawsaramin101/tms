Software Requirements Specification (SRS)
Module: User Authentication and Access Control
1. Purpose
The system shall provide secure authentication for registered users.
The system shall verify user credentials before granting access.
The system shall control access based on the user's assigned role and account status.
The system shall prevent inactive or unauthorized users from accessing protected functions.
Administrators shall be able to create and manage user accounts.
User information such as name, email, phone, role, and status shall be maintained.
The system shall maintain audit records of important user and security-related activities.
2. Functional Requirements
The system shall allow users to log in using their email and password.
The system shall validate the supplied credentials against the stored user information.
User passwords shall be stored as a secure password hash.
The system shall allow authenticated users to log out securely.
The system shall allow administrators to create new user accounts.
The system shall allow administrators to update user information such as name, email, phone, role, and status.
The system shall allow administrators to activate or deactivate user accounts.
The system shall check the user's role and account status before allowing access to protected functions.
The system shall prevent deactivated users from logging into the system.
The system shall record important user and security activities in the audit log.
3. Non-Functional Requirements
Security: Passwords shall not be stored in plain text and sensitive information shall be protected.
Performance: Login and authorization checks should be completed within a reasonable time.
Reliability: Authentication and user-management operations shall work consistently without unauthorized data modification.
Usability: Login and user-management interfaces should be simple and easy to use.
Availability: Authorized users should be able to access the system when the service is available.
Scalability: The system should support an increasing number of users.
Maintainability: Authentication and access-control functions should be modular and easy to maintain.
Privacy: User information shall only be accessible to authorized users.
4. User Roles

The users entity contains a role attribute that determines the user's access level.

Administrator: Manages users and has access to administrative functions.
Treasurer: Accesses authorized financial and treasury-related functions.
Inventory Officer: Accesses authorized inventory-related functions.
Management: Can access permitted information and reports.
Member: Can access permitted member-related functions.
Each user shall have one assigned role.
The system shall use the user's role to determine access to protected functions.
Users with inactive status shall not be allowed to access the system.
5. Main Use Cases
1. Login

User enters email and password → System verifies credentials → System checks account status and role → Access is granted or denied.

2. Logout

User selects logout → System terminates the authenticated session.

3. Create User

Administrator enters user information → System validates the information → User account is created.

4. Update User

Administrator selects a user → Updates user information/role/status → System saves the changes.

5. Change Password

Authenticated user provides the required information → System validates the request → Password hash is updated.

6. Deactivate User

Administrator selects a user → Changes account status → System prevents the inactive user from logging in.

7. Access Control

User requests a protected operation → System checks authentication, role, and account status → Operation is allowed or denied.

8. Audit Activity

Important user/security operation occurs → System records the action, user, affected record, and relevant information in audit_logs.

6. Security Requirements
Passwords shall never be stored as plain text.
The system shall store passwords using a secure hashing mechanism.
Invalid login credentials shall be rejected.
Protected functions shall require authentication.
Authorization shall be checked on the server side.
Deactivated users shall not be allowed to log in.
Important user-management and security activities shall be recorded in the audit log.
Users shall not be allowed to perform operations outside their assigned role.
User information and authentication data shall be protected from unauthorized access.
Audit records shall contain relevant information such as the user, action, affected table/record, and timestamp.
7. Acceptance Criteria
A user with valid credentials can successfully log in.
Invalid credentials cannot be used to access the system.
Deactivated users cannot log in.
Authenticated users can securely log out.
An administrator can create a new user account.
An administrator can update user information and account status.
An administrator can assign or change a user's role.
Users can access only functions permitted by their assigned role.
Passwords are stored as hashes rather than plain text.
Important user and security activities are recorded in the audit_logs table.
Why this version fits your ER diagram

The important alignment is:

SRS concept	ER diagram
User account	users
User ID	users.user_id
Name	users.name
Email	users.email
Password	users.password_hash
Role	users.role
Phone	users.phone
Account state	users.status
Account creation	users.created_at
Security/activity history	audit_logs
User performing action	audit_logs.user_id
Action performed	audit_logs.action
Affected table	audit_logs.table_name
Affected record	audit_logs.record_id
Previous data	audit_logs.old_values
New data	audit_logs.new_values
IP tracking	audit_logs.ip_address
Activity time	audit_logs.created_at