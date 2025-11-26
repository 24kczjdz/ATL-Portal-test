# Email Service Setup Guide

This document explains how to configure the email service for password recovery functionality in the ATL Dashboard.

## Features

The password recovery system provides users with two options:

1. **Password Reset**: Users receive an email with a link to create a new password (expires in 1 hour)
2. **One-Time Access**: Users receive an email with a link for immediate access without changing their password (expires in 30 minutes)

## 📧 Email Sender & Templates

### Email Sender Configuration

The email sender is **NOT handled by MongoDB Atlas** - you control it completely through environment variables:

```env
# Basic Email Configuration (Required)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Customization (Optional)
EMAIL_SENDER_NAME="Your Organization Name"
EMAIL_SENDER_ADDRESS=noreply@yourdomain.com
ORGANIZATION_NAME="Your Organization"
ORGANIZATION_URL=https://yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
LOGO_URL=https://yourdomain.com/logo.png

# Frontend URL (Required for email links)
FRONTEND_URL=http://localhost:3000
# For production: FRONTEND_URL=https://your-domain.com
```

### Template Customization

Email templates are located in `/api/services/emailService.js`:

- **`getPasswordResetTemplate()`** - Password reset email template
- **`getOneTimeAccessTemplate()`** - One-time access email template

You can customize:
- Organization name and branding
- Logo (set `LOGO_URL` environment variable)
- Colors and styling (modify CSS in templates)
- Email content and messaging
- Support contact information

## Email Provider Setup

### Gmail Configuration

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate a password
   - Use this password as `SMTP_PASS`

3. **Environment Variables for Gmail**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-character-app-password
```

### Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

## API Endpoints

The system provides the following endpoints:

### Request Password Recovery
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com",
  "type": "reset" // or "one_time"
}
```

### Reset Password
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "new-password",
  "type": "reset"
}
```

### One-Time Access
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "one-time-token-from-email",
  "type": "one_time"
}
```

### Validate Token
```
GET /api/auth/validate-reset-token/:token?type=reset
```

## Frontend Routes

The following routes have been added:

- `/forgot-password` - Password recovery options page
- `/auth/reset-password` - Password reset/one-time access page

## Database Schema

New fields added to the USER collection:
```javascript
{
  resetToken: String,           // Password reset token
  resetTokenExpires: Date,      // Reset token expiration
  oneTimeToken: String,         // One-time access token
  oneTimeTokenExpires: Date     // One-time token expiration
}
```

New PASSWORD_RESET collection for tracking:
```javascript
{
  reset_id: String,       // Unique reset ID
  user_id: String,        // User ID
  email: String,          // User email
  token: String,          // Reset/one-time token
  type: String,           // 'reset' or 'one_time'
  expires_at: Date,       // Token expiration
  used: Boolean,          // Whether token was used
  created_at: Date,       // Creation timestamp
  ip_address: String,     // Requester IP
  user_agent: String      // Requester user agent
}
```

## Security Features

1. **Token Expiration**: 
   - Reset tokens expire in 1 hour
   - One-time access tokens expire in 30 minutes

2. **Single Use**: All tokens can only be used once

3. **Secure Generation**: Tokens use crypto.randomBytes(32) for security

4. **Rate Limiting**: Consider implementing rate limiting on the forgot-password endpoint

5. **Audit Trail**: All password reset attempts are logged in the PASSWORD_RESET collection

## Testing

To test the email service:

1. **Install nodemailer**: Already added to package.json
2. **Configure environment variables**
3. **Test password recovery**:
   ```bash
   # Test the forgot password endpoint
   curl -X POST http://localhost:5000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","type":"reset"}'
   ```

## Troubleshooting

### Common Issues

1. **"Invalid email or password" for Gmail**
   - Ensure 2FA is enabled
   - Use App Password, not regular password
   - Check that "Less secure app access" is disabled (use App Password instead)

2. **Connection timeout**
   - Check firewall settings
   - Verify SMTP_HOST and SMTP_PORT
   - Try different ports (25, 465, 587)

3. **Email not sent**
   - Check environment variables
   - Verify SMTP credentials
   - Check spam folder
   - Look at server logs for detailed errors

4. **Token validation fails**
   - Check FRONTEND_URL matches your domain
   - Verify database connection
   - Check token expiration

### Debug Mode

Add this to your environment for detailed email debugging:
```env
NODE_DEBUG=nodemailer
```

## 🚀 Vercel Deployment Guide

### Step-by-Step Vercel Deployment

#### 1. **Prepare Your Code**

Make sure your project structure is ready:
```
Lab-Database-Docker/
├── api/                    # Backend code
├── client/                 # Frontend code  
├── package.json           # Root package.json
├── vercel.json            # Vercel configuration
└── .env.example           # Environment template
```

#### 2. **Create vercel.json Configuration**

Create `/vercel.json` in your root directory:

```json
{
  "version": 2,
  "functions": {
    "api/**/*.js": {
      "runtime": "@vercel/node"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/client/build/$1"
    }
  ],
  "builds": [
    {
      "src": "api/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ]
}
```

#### 3. **Environment Variables Setup**

In Vercel Dashboard → Project Settings → Environment Variables, add:

```env
# Database (Required)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Email Configuration (Required)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password

# URLs (Required)
FRONTEND_URL=https://your-vercel-app.vercel.app

# Customization (Optional)
EMAIL_SENDER_NAME=Your Organization Name
EMAIL_SENDER_ADDRESS=noreply@yourdomain.com
ORGANIZATION_NAME=Your Organization
ORGANIZATION_URL=https://yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
LOGO_URL=https://yourdomain.com/logo.png

# Security (Required)
JWT_SECRET=your-super-secure-random-string-here

# CORS (Optional)
CORS_ORIGINS=https://your-vercel-app.vercel.app,https://yourdomain.com
```

#### 4. **Deploy to Vercel**

**Option A: Via Vercel CLI**
```bash
npm install -g vercel
cd Lab-Database-Docker
vercel --prod
```

**Option B: Via GitHub Integration**
1. Push code to GitHub
2. Connect repository in Vercel dashboard
3. Configure environment variables
4. Deploy automatically

#### 5. **Post-Deployment Setup**

After deployment:

1. **Test Email Functionality**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","type":"reset"}'
   ```

2. **Update FRONTEND_URL**: Update the environment variable with your actual Vercel URL

3. **Test Password Recovery**: Visit `/forgot-password` on your deployed site

#### 6. **Custom Domain Setup** (Optional)

1. **Add Domain in Vercel**:
   - Go to Project Settings → Domains
   - Add your custom domain

2. **Update Environment Variables**:
   ```env
   FRONTEND_URL=https://yourdomain.com
   ORGANIZATION_URL=https://yourdomain.com
   ```

3. **Update DNS Settings**:
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or A record pointing to Vercel's IP

### Gmail App Password Setup for Production

1. **Enable 2-Factor Authentication** on Gmail
2. **Generate App Password**:
   - Google Account → Security → 2-Step Verification
   - App passwords → Select "Mail" → Generate
   - Use this 16-character password as `SMTP_PASS`

### Production Email Settings

```env
# Production Example
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=abcd efgh ijkl mnop
EMAIL_SENDER_NAME=Your Company
EMAIL_SENDER_ADDRESS=noreply@yourdomain.com
ORGANIZATION_NAME=Your Company
FRONTEND_URL=https://yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
```

### MongoDB Atlas

Ensure your MongoDB Atlas cluster allows connections and has the updated schema.

### Vercel Deployment Troubleshooting

#### Common Issues & Solutions

1. **Environment Variables Not Working**
   ```bash
   # Check if variables are set in Vercel dashboard
   # Variables must be added for "Production" environment
   # Redeploy after adding variables
   ```

2. **Email Service 500 Error**
   ```bash
   # Check Vercel function logs
   # Verify SMTP credentials
   # Ensure nodemailer is in dependencies
   ```

3. **CORS Issues**
   ```bash
   # Add your Vercel URL to CORS_ORIGINS
   CORS_ORIGINS=https://your-app.vercel.app
   ```

4. **Database Connection Timeout**
   ```bash
   # Verify MONGO_URI format
   # Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for Vercel)
   # Ensure database user has correct permissions
   ```

5. **Email Links Not Working**
   ```bash
   # Verify FRONTEND_URL points to your Vercel deployment
   # Check that routes are properly configured in vercel.json
   ```

#### Debugging Steps

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Functions tab
   - Click on function to see logs
   - Look for error messages

2. **Test API Endpoints**:
   ```bash
   # Test health endpoint
   curl https://your-app.vercel.app/health
   
   # Test auth endpoint
   curl https://your-app.vercel.app/api/auth/forgot-password
   ```

3. **Verify Environment Variables**:
   ```bash
   # In Vercel dashboard, check all required variables are set
   # Make sure they're set for "Production" environment
   ```

## Support

For issues with email delivery:
1. Check server logs for detailed error messages
2. Verify email provider settings
3. Test with a different email address
4. Check spam/junk folders

The system gracefully handles email failures and provides user-friendly error messages without exposing sensitive information.