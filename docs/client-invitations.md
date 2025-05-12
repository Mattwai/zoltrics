# Client Invitation System

This document outlines the client invitation system that allows you to invite clients to your Zoltrics platform after they contact sales.

## Overview

The client invitation system provides a seamless flow for onboarding new clients:

1. A potential client submits a contact form
2. You receive an email notification with their details
3. You can invite them to create an account with appropriate access levels
4. They receive an email invitation with a secure link
5. They accept the invitation and create their account
6. They can now access your Zoltrics platform with client permissions

## Features

- **Secure token-based invitations**: Each invitation has a unique token
- **Expiring invitations**: Invitations expire after 7 days for security
- **Role-based access**: Clients are assigned the CLIENT role automatically
- **Customizable details**: Include name and company information with invitations
- **Email notifications**: Automated emails for both you and the invited clients

## How to Use

### Sending Invitations

1. Go to the **Client Invitations** page at `/clients/invitations`
2. Click the **Invite Client** button
3. Enter the client's email address (required)
4. Optionally add their name and company
5. Click **Send Invitation**

The system will check if:
- The email is valid
- The user doesn't already exist
- There isn't an active invitation for this email

### Managing Invitations

On the **Client Invitations** page, you can:
- View all pending invitations
- See which invitations have been accepted
- Track when invitations expire
- Resend invitations if needed

### Client Acceptance Flow

When a client receives an invitation:

1. They click the link in the email
2. They're taken to the invitation acceptance page
3. They create a password and confirm their details
4. Their account is created with CLIENT access level
5. They're redirected to sign in with their new credentials

## Implementation Details

The client invitation system consists of:

- Database schema additions (Invitation model)
- API endpoints for creating and verifying invitations
- Email notification system
- User interface for sending and managing invitations
- User interface for accepting invitations

### API Endpoints

- `POST /api/invitations` - Create a new invitation
- `GET /api/invitations` - List all invitations
- `GET /api/invitations/:token` - Validate an invitation token
- `PATCH /api/invitations/:token` - Accept an invitation

### Database Schema

The Invitation model stores:
- Email address
- Name (optional)
- Company (optional) 
- Secure token
- Status (PENDING, ACCEPTED, EXPIRED)
- Role (defaults to CLIENT)
- Expiration date
- Created by (user ID)
- Creation date

## Security Considerations

- Invitations expire after 7 days
- Each invitation has a unique token
- Invitations can only be created by authenticated users
- Clients can only access features appropriate for their role
- Token validation happens on the server side

## Future Enhancements

Potential improvements for the invitation system:

- Ability to customize the invitation email template
- Option to set expiration period (days, weeks, etc.)
- Bulk invitation import from CSV
- Invitation analytics (acceptance rate, time to accept)
- Integration with team/project assignment 