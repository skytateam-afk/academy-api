# Auth Module

## Overview
The Auth module handles all authentication and authorization functionality for the SchoolBox API.

## Features
- User login (email/username + password)
- OTP-based authentication
- JWT token generation
- Password management
- Network list management
- Email notifications (OTP, welcome emails)

## Structure
```
auth/
├── controllers/
│   └── authController.js    # Authentication logic
├── routes/
│   └── authRoutes.js         # Auth API routes
├── services/
│   └── emailService.js       # Email sending service
├── templates/
│   └── email/                # Email templates
│       ├── base.html         # Base email template
│       ├── otp.html          # OTP email template
│       └── welcome.html      # Welcome email template
├── tests/
│   └── auth.test.js          # Auth module tests
└── index.js                  # Module exports
```

## API Endpoints

### GET /api/auth/networklist
Get list of available networks
- **Access**: Public
- **Response**: List of networks

### POST /api/auth/login
User login with credentials
- **Access**: Public
- **Body**: `{ user/email, password, network }`
- **Response**: JWT token and user data

### POST /api/auth/register
Register new user (requires authentication)
- **Access**: Protected
- **Body**: `{ email, password }`
- **Response**: New user data

### GET /api/auth/profile
Get current user profile
- **Access**: Protected
- **Response**: User profile data

### PUT /api/auth/mfa
Toggle MFA for user
- **Access**: Protected
- **Body**: `{ enabled: boolean }`
- **Response**: Updated MFA status

### PUT /api/auth/password
Update user password
- **Access**: Protected
- **Body**: `{ currentPassword, newPassword }`
- **Response**: Success message

### POST /api/auth/request-otp
Request OTP for email login
- **Access**: Public
- **Body**: `{ email }`
- **Response**: OTP sent confirmation

### POST /api/auth/verify-otp
Verify OTP and login
- **Access**: Public
- **Body**: `{ email, otp }`
- **Response**: JWT token and user data

## Usage

```javascript
// Import the auth module
const { auth } = require('../modules');

// Use in Express app
app.use('/api/auth', auth.routes);

// Access controller directly
const authController = auth.controllers.authController;

// Access email service
const emailService = auth.services.emailService;
```

## Dependencies
- Shared middleware: `auth.js` (for protected routes)
- Shared config: `database.js`, `winston.js`
- Shared utils: `logger.js`, `usernameGenerator.js`

## Testing
```bash
npm test -- modules/auth/tests/auth.test.js
```

## Configuration
Email service requires environment variables:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM_NAME`
- `SMTP_FROM_EMAIL`

JWT configuration:
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
