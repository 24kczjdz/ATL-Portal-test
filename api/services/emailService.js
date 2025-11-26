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

}

export default new EmailService();