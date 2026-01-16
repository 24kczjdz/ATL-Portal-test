import nodemailer from 'nodemailer';
import crypto from 'crypto';
import EmailTemplate from '../models/EmailTemplate.js';
import EmailNotification from '../models/EmailNotification.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection configuration
    this.transporter.verify(function (error, success) {
      if (error) {
        console.log('SMTP Configuration Error:', error);
      } else {
        console.log('SMTP Server is ready to take our messages');
      }
    });
  }

  generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendPasswordResetEmail(email, token, type = 'reset') {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}&type=${type}`;
    
    const subject = type === 'reset' 
      ? 'Password Reset Request - ATL Dashboard'
      : 'One-Time Access Link - ATL Dashboard';

    const htmlContent = type === 'reset' 
      ? this.getPasswordResetTemplate(resetUrl, email)
      : this.getOneTimeAccessTemplate(resetUrl, email);

    const textContent = type === 'reset'
      ? `Password Reset Request\n\nClick the following link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`
      : `One-Time Access Request\n\nClick the following link for one-time access to your account:\n${resetUrl}\n\nThis link will expire in 30 minutes and can only be used once.\n\nIf you didn't request this, please ignore this email.`;

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME || 'ATL Dashboard'}" <${process.env.EMAIL_SENDER_ADDRESS || process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getPasswordResetTemplate(resetUrl, email) {
    const organizationName = process.env.ORGANIZATION_NAME || 'ATL Dashboard';
    const organizationUrl = process.env.ORGANIZATION_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
    const logoUrl = process.env.LOGO_URL || '';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - ATL Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #4338ca; }
          .warning { background: #fef3cd; border: 1px solid #fdd835; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="${organizationName}" style="max-height: 60px; margin-bottom: 10px;">` : ''}
            <h1>🔐 Password Reset Request</h1>
            <p>${organizationName}</p>
          </div>
          <div class="content">
            <h2>Hello,</h2>
            <p>We received a request to reset the password for your account associated with <strong>${email}</strong>.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul>
                <li>This link will expire in <strong>1 hour</strong></li>
                <li>The link can only be used once</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
              </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${resetUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p><strong>Why did I receive this email?</strong></p>
            <p>This email was sent because someone (hopefully you) requested a password reset for this email address on ${organizationName}. If this wasn't you, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>${organizationName}<br>
            ${supportEmail ? `For support, contact: <a href="mailto:${supportEmail}">${supportEmail}</a><br>` : ''}
            This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getOneTimeAccessTemplate(resetUrl, email) {
    const organizationName = process.env.ORGANIZATION_NAME || 'ATL Dashboard';
    const organizationUrl = process.env.ORGANIZATION_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
    const logoUrl = process.env.LOGO_URL || '';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>One-Time Access - ATL Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #047857; }
          .warning { background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="${organizationName}" style="max-height: 60px; margin-bottom: 10px;">` : ''}
            <h1>🔑 One-Time Access Link</h1>
            <p>${organizationName}</p>
          </div>
          <div class="content">
            <h2>Hello,</h2>
            <p>We received a request for one-time access to your account associated with <strong>${email}</strong>.</p>
            
            <p>Click the button below for immediate access to your account:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Access My Account</a>
            </div>
            
            <div class="warning">
              <strong>🔐 Security Information:</strong>
              <ul>
                <li>This link will expire in <strong>30 minutes</strong></li>
                <li>The link can <strong>only be used once</strong></li>
                <li>You'll be automatically logged in without entering a password</li>
                <li>After using this link, your password remains unchanged</li>
                <li>Consider updating your password after logging in</li>
              </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${resetUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p><strong>Why did I receive this email?</strong></p>
            <p>This email was sent because someone requested one-time access for this email address on ${organizationName}. If this wasn't you, you can safely ignore this email.</p>
            
            <p><strong>What is one-time access?</strong></p>
            <p>One-time access allows you to log in without your password. It's perfect for when you've forgotten your password but need quick access to your account.</p>
          </div>
          <div class="footer">
            <p>${organizationName}<br>
            ${supportEmail ? `For support, contact: <a href="mailto:${supportEmail}">${supportEmail}</a><br>` : ''}
            This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendStatusChangeNotification(recordData, changeData) {
    try {
      const { record_type, record_id, old_status, new_status } = changeData;
      
      // Get appropriate templates
      const adminTemplate = await EmailTemplate.findOne({
        template_type: `${record_type}_status`,
        recipient_type: 'admin',
        is_active: true
      });
      
      const userTemplate = await EmailTemplate.findOne({
        template_type: `${record_type}_status`,
        recipient_type: 'user',
        is_active: true
      });

      const notifications = [];

      // Send admin notification
      if (adminTemplate && process.env.ADMIN_EMAIL) {
        const adminNotification = await this.sendTemplateEmail(
          adminTemplate,
          process.env.ADMIN_EMAIL,
          recordData,
          changeData,
          'admin'
        );
        notifications.push(adminNotification);
      }

      // Send user notifications
      if (userTemplate && recordData.user_emails) {
        for (const userEmail of recordData.user_emails) {
          const userNotification = await this.sendTemplateEmail(
            userTemplate,
            userEmail,
            recordData,
            changeData,
            'user'
          );
          notifications.push(userNotification);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error sending status change notification:', error);
      return [];
    }
  }

  async sendTemplateEmail(template, recipientEmail, recordData, changeData, recipientType) {
    try {
      // Replace template variables
      const subject = this.replaceTemplateVariables(template.subject, recordData, changeData);
      const htmlContent = this.replaceTemplateVariables(template.html_content, recordData, changeData);

      const mailOptions = {
        from: `"${process.env.EMAIL_SENDER_NAME || 'ATL Dashboard'}" <${process.env.EMAIL_SENDER_ADDRESS || process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: subject,
        html: htmlContent,
      };

      // Create notification log entry
      const notificationLog = new EmailNotification({
        notification_id: crypto.randomUUID(),
        record_id: changeData.record_id,
        record_type: changeData.record_type,
        action_type: changeData.action_type || 'status_change',
        old_status: changeData.old_status,
        new_status: changeData.new_status,
        recipient_email: recipientEmail,
        recipient_type: recipientType,
        template_used: template.template_id,
        additional_data: recordData
      });

      // Send email
      const result = await this.transporter.sendMail(mailOptions);
      
      // Update notification log
      notificationLog.status = 'sent';
      notificationLog.sent_at = new Date();
      await notificationLog.save();

      console.log(`Email sent successfully to ${recipientEmail}:`, result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        notificationId: notificationLog.notification_id
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      
      // Log failed notification
      try {
        const notificationLog = new EmailNotification({
          notification_id: crypto.randomUUID(),
          record_id: changeData.record_id,
          record_type: changeData.record_type,
          action_type: changeData.action_type || 'status_change',
          old_status: changeData.old_status,
          new_status: changeData.new_status,
          recipient_email: recipientEmail,
          recipient_type: recipientType,
          template_used: template.template_id,
          status: 'failed',
          error_message: error.message,
          additional_data: recordData
        });
        await notificationLog.save();
      } catch (logError) {
        console.error('Failed to log email notification:', logError);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  replaceTemplateVariables(content, recordData, changeData) {
    let result = content;
    
    // Replace change data variables
    Object.keys(changeData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, changeData[key] || '');
    });

    // Replace record data variables
    Object.keys(recordData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, recordData[key] || '');
    });

    // Replace common variables
    const commonVariables = {
      updated_at: new Date().toLocaleString(),
      organization_name: process.env.ORGANIZATION_NAME || 'ATL Dashboard',
      support_email: process.env.SUPPORT_EMAIL || process.env.SMTP_USER
    };

    Object.keys(commonVariables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, commonVariables[key]);
    });

    return result;
  }

  async getAdminEmail() {
    return process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  }

  async sendAccountApprovalEmail(userData) {
    const organizationName = process.env.ORGANIZATION_NAME || 'ATL Dashboard';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
    const logoUrl = process.env.LOGO_URL || '';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approved - ATL Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .success-box { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #059669; }
          .info-box { background: #e0f2fe; border: 1px solid #0284c7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="${organizationName}" style="max-height: 60px; margin-bottom: 10px;">` : ''}
            <h1>🎉 Account Approved!</h1>
            <p>${organizationName}</p>
          </div>
          <div class="content">
            <h2>Hello ${userData.First_Name || 'User'},</h2>
            
            <div class="success-box">
              <h3 style="margin: 0 0 10px 0; color: #059669;">✓ Your Account Has Been Approved</h3>
              <p style="margin: 0;">You now have full access to the Arts Tech Lab Dashboard</p>
            </div>
            
            <p>Congratulations! Your account has been verified and approved. You can now log in and access all features of the ATL Dashboard.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Your Account Details:</h3>
              <p><strong>Username:</strong> ${userData.User_ID || 'N/A'}</p>
              <p><strong>Email:</strong> ${userData.Email_Address || 'N/A'}</p>
              <p><strong>Role:</strong> ${userData.User_Role?.replace(/_/g, ' ') || 'N/A'}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${frontendUrl}/login" class="button">Log In Now</a>
            </div>
            
            <p><strong>What you can do now:</strong></p>
            <ul>
              <li>Book equipment and venues</li>
              <li>Join or create projects</li>
              <li>Participate in student interest groups</li>
              <li>Access ATL resources and facilities</li>
              <li>Connect with the ATL community</li>
            </ul>
            
            <p><strong>Need help getting started?</strong></p>
            <p>Visit our Help Center or contact us at ${supportEmail} for assistance.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p>Welcome to the Arts Tech Lab community! We're excited to have you with us.</p>
          </div>
          <div class="footer">
            <p>${organizationName}<br>
            ${supportEmail ? `For support, contact: <a href="mailto:${supportEmail}">${supportEmail}</a><br>` : ''}
            This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Account Approved - ${organizationName}

Hello ${userData.First_Name || 'User'},

Congratulations! Your account has been verified and approved. You can now log in and access all features of the ATL Dashboard.

Your Account Details:
Username: ${userData.User_ID || 'N/A'}
Email: ${userData.Email_Address || 'N/A'}
Role: ${userData.User_Role?.replace(/_/g, ' ') || 'N/A'}

Log in now at: ${frontendUrl}/login

What you can do now:
- Book equipment and venues
- Join or create projects
- Participate in student interest groups
- Access ATL resources and facilities
- Connect with the ATL community

Need help? Contact us at ${supportEmail}

Welcome to the Arts Tech Lab community!

---
${organizationName}
    `;

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME || 'ATL Dashboard'}" <${process.env.EMAIL_SENDER_ADDRESS || process.env.SMTP_USER}>`,
      to: userData.Email_Address,
      subject: `Account Approved - Welcome to ${organizationName}`,
      text: textContent,
      html: htmlContent,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Account approval email sent successfully:', result.messageId);
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Account approval email failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendRegistrationConfirmationEmail(userData) {
    const organizationName = process.env.ORGANIZATION_NAME || 'ATL Dashboard';
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
    const logoUrl = process.env.LOGO_URL || '';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Received - ATL Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: #e0f2fe; border: 1px solid #0284c7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .info-item { margin: 10px 0; }
          .info-label { font-weight: bold; color: #0284c7; }
          .warning { background: #fef3cd; border: 1px solid #fdd835; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .location { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="${organizationName}" style="max-height: 60px; margin-bottom: 10px;">` : ''}
            <h1>📝 Registration Received</h1>
            <p>${organizationName}</p>
          </div>
          <div class="content">
            <h2>Hello ${userData.First_Name || 'User'},</h2>
            <p>Thank you for submitting your registration application for the Arts Tech Lab Dashboard. We have received your information and it is currently pending approval.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Your Registration Information:</h3>
              <div class="info-item">
                <span class="info-label">Username:</span> ${userData.User_ID || 'N/A'}
              </div>
              <div class="info-item">
                <span class="info-label">Name:</span> ${userData.First_Name || ''} ${userData.Last_Name || ''}
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span> ${userData.Email_Address || 'N/A'}
              </div>
              <div class="info-item">
                <span class="info-label">Role:</span> ${userData.User_Role || 'N/A'}
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span> ${userData.Tel || 'N/A'}
              </div>
              ${userData.UID ? `<div class="info-item"><span class="info-label">HKU UID:</span> ${userData.UID}</div>` : ''}
              ${userData.Member_ID ? `<div class="info-item"><span class="info-label">ATL Member ID:</span> ${userData.Member_ID}</div>` : ''}
            </div>
            
            <div class="warning">
              <strong>⚠️ Next Steps:</strong>
              <p style="margin: 10px 0 0 0;">To complete your account registration and gain access, please visit us in person at:</p>
            </div>

            <div class="location">
              <h3 style="margin-top: 0; color: #0284c7;">📍 Arts Tech Lab</h3>
              <p style="margin: 5px 0;"><strong>Location:</strong> Run Run Shaw Tower 4.40-4.41</p>
              <p style="margin: 5px 0;"><strong>What to bring:</strong> Your student ID card or identification</p>
            </div>

            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Visit the Arts Tech Lab with your ID</li>
              <li>Our staff will verify your information</li>
              <li>Your account will be approved for access</li>
              <li>You'll receive a confirmation email once approved</li>
            </ul>

            <p><strong>Why is this process necessary?</strong></p>
            <p>This in-person verification helps us maintain security and ensure that all users have legitimate access to our facilities and resources.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p>If you did not submit this registration, please contact us immediately at ${supportEmail}.</p>
          </div>
          <div class="footer">
            <p>${organizationName}<br>
            ${supportEmail ? `For questions, contact: <a href="mailto:${supportEmail}">${supportEmail}</a><br>` : ''}
            This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Registration Received - ${organizationName}

Hello ${userData.First_Name || 'User'},

Thank you for submitting your registration application. We have received your information:

Username: ${userData.User_ID || 'N/A'}
Name: ${userData.First_Name || ''} ${userData.Last_Name || ''}
Email: ${userData.Email_Address || 'N/A'}
Role: ${userData.User_Role || 'N/A'}
Phone: ${userData.Tel || 'N/A'}
${userData.UID ? `HKU UID: ${userData.UID}\n` : ''}
${userData.Member_ID ? `ATL Member ID: ${userData.Member_ID}\n` : ''}

Next Steps:
To complete your account registration, please visit us at:

Arts Tech Lab
Run Run Shaw Tower 4.40-4.41

Please bring your student ID card or identification for verification.

Once verified, your account will be approved and you'll receive a confirmation email.

If you did not submit this registration, please contact us at ${supportEmail}.

---
${organizationName}
    `;

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME || 'ATL Dashboard'}" <${process.env.EMAIL_SENDER_ADDRESS || process.env.SMTP_USER}>`,
      to: userData.Email_Address,
      subject: `Registration Application Received - ${organizationName}`,
      text: textContent,
      html: htmlContent,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Registration confirmation email sent successfully:', result.messageId);
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Registration confirmation email failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

}

export default new EmailService();