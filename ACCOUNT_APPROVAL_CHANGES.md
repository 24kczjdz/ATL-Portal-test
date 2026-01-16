# Account Approval System Implementation

## Overview
This document describes the changes made to implement an account approval system where new user registrations require admin approval before gaining access to the system.

## Changes Made

### 1. Database Schema Updates

#### User Schema (`server/database.js` and `client/src/schemas.js`)
- Added `approved` field (Boolean, default: false) to track whether an account has been approved by an admin
- Admin accounts are automatically set to `approved: true` upon creation

### 2. Login Page Updates (`client/src/pages/Login.js`)

#### Visual Changes:
- **Moved** the first-time user warning from the bottom to the **top** of the login form
- **Updated** the warning message to inform users about the registration and approval process
- **Added** a "Register New Account" button that directs users to the registration page
- The warning now clearly states users need to visit Run Run Shaw Tower 4.40-4.41 Arts Tech Lab with their student ID

### 3. Registration System Updates

#### Registration Page (`client/src/pages/Register.js`)
- Modified to create accounts with `approved: false` by default
- Shows success message after registration directing users to check their email
- Informs users they need to visit the Arts Tech Lab in person for approval

#### Registration Route (`client/src/App.js`)
- Changed from redirecting to `/login` to allowing access to the registration page
- Added route for the new Account Approvals admin page

#### Backend Registration (`routes/userRoutes.js`)
- Creates new user accounts with `approved: false`
- Sends registration confirmation email automatically after account creation
- Email includes all submitted information and instructions to visit the lab

### 4. Email Notifications (`api/services/emailService.js`)

#### Registration Confirmation Email
Sent automatically when a user registers:
- Lists all registration information submitted
- Provides clear instructions to visit Run Run Shaw Tower 4.40-4.41
- Explains the next steps in the approval process
- Professional HTML template with organization branding

#### Account Approval Email
Sent automatically when an admin approves an account:
- Congratulates the user on approval
- Provides login credentials reminder
- Includes a direct link to the login page
- Lists available features and resources

### 5. Login Access Control (`routes/userRoutes.js`)

#### Approval Check
- Added validation during login to check if user account is approved
- Non-admin users with `approved: false` receive a clear error message
- Error message directs them to visit the Arts Tech Lab for approval
- Admin accounts bypass this check (always approved)

### 6. Admin Account Approval Interface

#### Integrated into: `client/src/pages/UserManage.js`
The account approval functionality has been integrated directly into the **Manage Users** page for convenience.

Features:
- **Approval Status Badge**: Shows "Pending" or "Approved" status on each user
- **Filter by Approval Status**: Dropdown to filter users by:
  - All Users
  - Pending Approval
  - Approved
- **Pending Count**: Badge showing total pending approvals
- **Visual Indicators**: Warning icon (⚠️) for pending users
- **Approve Button**: Large, prominent button in user details panel
- **Confirmation Dialog**: Confirms before approving
- **Auto-refresh**: Updates list after approval
- **Email Notification**: Automatically sends approval email to user

#### Also Available: `client/src/pages/ManageAccountApprovals.jsx`
A standalone dedicated page for account approvals (optional, can be used as alternative)

#### Backend Endpoints (`routes/userRoutes.js`)
- `GET /api/users/pending-approvals` - Fetches all unapproved users (Admin only)
- `POST /api/users/:userId/approve` - Approves a user account (Admin only)
  - Updates `approved` field to `true`
  - Sends approval confirmation email to user
  - Returns updated user information

### 7. Admin Dashboard Integration (`client/src/pages/AdminDashboard.jsx`)

#### New Navigation Item
- Added "Account Approvals" card in the Database Management section
- Positioned between "User Management" and "Booking Management"
- Icon: User icon (FiUsers)
- Description: "Review and approve pending user registrations"
- Links to: `/admin/account-approvals`

### 8. Navigation and Routing

#### App Routes (`client/src/App.js`)
- Added public route: `/register` → Register component
- Added protected admin route: `/admin/account-approvals` → ManageAccountApprovals component
- Imported ManageAccountApprovals component

## User Flow

### For New Users:
1. Visit login page and see registration information at the top
2. Click "Register New Account" button
3. Fill out registration form with all required information
4. Submit registration (account created with `approved: false`)
5. Receive confirmation email with submitted information
6. Visit Arts Tech Lab at Run Run Shaw Tower 4.40-4.41 with student ID
7. Staff verifies identity and admin approves account
8. Receive approval confirmation email
9. Can now log in and access all features

### For Admins:
1. Log in to admin account
2. Navigate to **Manage Users** (Admin → Manage Users)
3. Use the "Approval Status" filter to view "Pending Approval" users
4. Click on a pending user to view their details
5. Review all user information in the details panel
6. Click the green **"Approve User"** button
7. Confirm the approval
8. User receives approval email and can now log in

**Alternative**: Use the standalone Account Approvals page via Admin Dashboard → Database Management → Account Approvals

## Security Features

1. **Approval Requirement**: Prevents unauthorized access to the system
2. **In-Person Verification**: Ensures legitimate users with proper identification
3. **Admin-Only Access**: Only admins can view and approve accounts
4. **Email Notifications**: Both user and admin are notified at each step
5. **Auto-Approval for Admins**: Admin accounts created with tokens are automatically approved
6. **Password Excluded**: Pending user lists never display passwords

## Email Templates

### Registration Confirmation Email
- Subject: "Registration Application Received - ATL Dashboard"
- Contains: User information summary, next steps, location details
- Tone: Informative and welcoming

### Account Approval Email
- Subject: "Account Approved - Welcome to ATL Dashboard"
- Contains: Approval confirmation, login link, feature overview
- Tone: Congratulatory and encouraging

## Technical Notes

### Database Migration
- Existing users without the `approved` field will have it set to `undefined`
- Recommend running a migration to set existing users to `approved: true`
- New registrations will automatically have `approved: false`

### Admin Accounts
- Admin accounts created via token registration are automatically approved
- This ensures admins can always access the system
- Admin login bypasses the approval check

### Error Handling
- Registration email failures don't prevent account creation
- Approval email failures don't prevent account approval
- All email errors are logged for admin review

## Testing Checklist

- [ ] New user can register successfully
- [ ] Registration confirmation email is sent
- [ ] Unapproved user cannot log in
- [ ] Unapproved user sees appropriate error message
- [ ] Admin can see pending approvals list
- [ ] Admin can approve user accounts
- [ ] Approval email is sent to user
- [ ] Approved user can log in successfully
- [ ] Admin accounts are auto-approved
- [ ] Login page shows registration button
- [ ] Registration page is accessible

## Future Enhancements

1. **Bulk Approval**: Allow admins to approve multiple users at once
2. **Rejection Feature**: Add ability to reject applications with reason
3. **Approval History**: Track who approved which accounts and when
4. **Email Customization**: Allow admins to customize email templates
5. **Notification System**: Real-time notifications for new registrations
6. **QR Code Verification**: Scan student ID QR codes for faster verification
7. **Approval Workflow**: Multi-step approval process for different user types
8. **Analytics**: Track registration and approval metrics

## Support

For questions or issues related to the account approval system:
- Contact: ATL Admin Team
- Location: Run Run Shaw Tower 4.40-4.41
- Email: Check environment variables for SUPPORT_EMAIL

