import express from 'express';
import EmailTemplate from '../models/EmailTemplate.js';
import EmailNotification from '../models/EmailNotification.js';
import Project from '../models/Project.js';
import EquipmentBooking from '../models/EquipmentBooking.js';
import StudentInterestGroup from '../models/StudentInterestGroup.js';
import { models } from '../../server/database.js';
import crypto from 'crypto';

const router = express.Router();

// Dashboard stats endpoint
router.get('/dashboard-stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalBookings,
      totalProjects,
      totalSIGs,
      emailsSent
    ] = await Promise.all([
      models.USER.countDocuments(),
      EquipmentBooking.countDocuments(),
      Project.countDocuments(),
      StudentInterestGroup.countDocuments(),
      EmailNotification.countDocuments({ status: 'sent' })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalBookings,
        totalProjects,
        totalSIGs,
        emailsSent
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
});

// Create new email template
router.post('/email-templates', async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      template_id: crypto.randomUUID()
    };
    
    const template = new EmailTemplate(templateData);
    await template.save();
    
    res.status(201).json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message
    });
  }
});

// Update email template (full update)
router.put('/email-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const template = await EmailTemplate.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
});

// Update email template (partial update)
router.patch('/email-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const template = await EmailTemplate.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
});

// Default templates data
const defaultTemplates = [
  {
    template_id: crypto.randomUUID(),
    template_name: "Equipment Booking Status Change - Admin Notification",
    template_type: "booking_status",
    recipient_type: "admin",
    subject: "Equipment Booking Status Updated - {{booking_id}}",
    html_content: `
      <h2>Equipment Booking Status Update</h2>
      <p><strong>Booking ID:</strong> {{booking_id}}</p>
      <p><strong>Equipment:</strong> {{equipment_name}}</p>
      <p><strong>User:</strong> {{user_name}} ({{user_email}})</p>
      <p><strong>Date:</strong> {{booking_date}}</p>
      <p><strong>Time:</strong> {{booking_time}}</p>
      <p><strong>Duration:</strong> {{duration}} hours</p>
      <p><strong>Status Changed:</strong> {{old_status}} → {{new_status}}</p>
      <p><strong>Updated At:</strong> {{updated_at}}</p>
    `,
    variables: ["booking_id", "equipment_name", "user_name", "user_email", "booking_date", "booking_time", "duration", "old_status", "new_status", "updated_at"]
  },
  {
    template_id: crypto.randomUUID(),
    template_name: "Equipment Booking Status Change - User Notification",
    template_type: "booking_status",
    recipient_type: "user",
    subject: "Your Equipment Booking Status has been Updated",
    html_content: `
      <h2>Booking Status Update</h2>
      <p>Hello {{user_name}},</p>
      <p>The status of your equipment booking has been updated:</p>
      <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <p><strong>Equipment:</strong> {{equipment_name}}</p>
        <p><strong>Date:</strong> {{booking_date}}</p>
        <p><strong>Time:</strong> {{booking_time}}</p>
        <p><strong>Duration:</strong> {{duration}} hours</p>
        <p><strong>New Status:</strong> <span style="color: #4CAF50; font-weight: bold;">{{new_status}}</span></p>
      </div>
      <p>If you have any questions, please contact our support team.</p>
    `,
    variables: ["user_name", "equipment_name", "booking_date", "booking_time", "duration", "old_status", "new_status"]
  },
  {
    template_id: crypto.randomUUID(),
    template_name: "Project Status Change - Admin Notification",
    template_type: "project_status",
    recipient_type: "admin",
    subject: "Project Status Updated - {{project_name}}",
    html_content: `
      <h2>Project Status Update</h2>
      <p><strong>Project:</strong> {{project_name}}</p>
      <p><strong>Type:</strong> {{project_type}}</p>
      <p><strong>Creator:</strong> {{creator_name}}</p>
      <p><strong>Members:</strong> {{member_count}} members</p>
      <p><strong>Start Date:</strong> {{start_date}}</p>
      <p><strong>End Date:</strong> {{end_date}}</p>
      <p><strong>Status Changed:</strong> {{old_status}} → {{new_status}}</p>
      <p><strong>Updated At:</strong> {{updated_at}}</p>
      <p><strong>Description:</strong></p>
      <div style="background: #f9f9f9; padding: 10px; border-left: 4px solid #ddd;">
        {{project_description}}
      </div>
    `,
    variables: ["project_name", "project_type", "creator_name", "member_count", "start_date", "end_date", "old_status", "new_status", "updated_at", "project_description"]
  },
  {
    template_id: crypto.randomUUID(),
    template_name: "Project Status Change - User Notification",
    template_type: "project_status",
    recipient_type: "user",
    subject: "Project '{{project_name}}' Status Updated",
    html_content: `
      <h2>Project Update</h2>
      <p>Hello {{user_name}},</p>
      <p>A project you're involved in has been updated:</p>
      <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3>{{project_name}}</h3>
        <p><strong>Type:</strong> {{project_type}}</p>
        <p><strong>New Status:</strong> <span style="color: #4CAF50; font-weight: bold;">{{new_status}}</span></p>
        <p><strong>Timeline:</strong> {{start_date}} to {{end_date}}</p>
      </div>
      <p>Stay tuned for more updates on this project.</p>
    `,
    variables: ["user_name", "project_name", "project_type", "old_status", "new_status", "start_date", "end_date"]
  },
  {
    template_id: crypto.randomUUID(),
    template_name: "Student Interest Group Status Change - Admin Notification",
    template_type: "sig_status",
    recipient_type: "admin",
    subject: "SIG Status Updated - {{sig_name}}",
    html_content: `
      <h2>Student Interest Group Status Update</h2>
      <p><strong>Group:</strong> {{sig_name}} ({{sig_abbrev}})</p>
      <p><strong>Members:</strong> {{member_count}} members</p>
      <p><strong>Status Changed:</strong> {{old_status}} → {{new_status}}</p>
      <p><strong>Updated At:</strong> {{updated_at}}</p>
      <p><strong>Description:</strong></p>
      <div style="background: #f9f9f9; padding: 10px; border-left: 4px solid #ddd;">
        {{sig_description}}
      </div>
    `,
    variables: ["sig_name", "sig_abbrev", "member_count", "old_status", "new_status", "updated_at", "sig_description"]
  },
  {
    template_id: crypto.randomUUID(),
    template_name: "Student Interest Group Status Change - User Notification",
    template_type: "sig_status",
    recipient_type: "user",
    subject: "{{sig_name}} Status Updated",
    html_content: `
      <h2>Interest Group Update</h2>
      <p>Hello {{user_name}},</p>
      <p>A student interest group you're part of has been updated:</p>
      <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3>{{sig_name}} ({{sig_abbrev}})</h3>
        <p><strong>New Status:</strong> <span style="color: #4CAF50; font-weight: bold;">{{new_status}}</span></p>
        <p><strong>Total Members:</strong> {{member_count}}</p>
      </div>
      <p>Keep engaging with your interest group community!</p>
    `,
    variables: ["user_name", "sig_name", "sig_abbrev", "old_status", "new_status", "member_count"]
  }
];

// Seed email templates endpoint
router.post('/seed-email-templates', async (req, res) => {
  try {
    // Check if templates already exist
    const existingTemplates = await EmailTemplate.countDocuments();
    if (existingTemplates > 0) {
      return res.status(400).json({
        success: false,
        message: `Email templates already exist (${existingTemplates} templates found). Use force=true to recreate.`
      });
    }

    // Create templates
    const createdTemplates = await EmailTemplate.insertMany(defaultTemplates);
    
    res.json({
      success: true,
      message: 'Email templates seeded successfully',
      count: createdTemplates.length,
      templates: createdTemplates.map(t => ({
        id: t.template_id,
        name: t.template_name,
        type: t.template_type,
        recipient: t.recipient_type
      }))
    });
  } catch (error) {
    console.error('Error seeding email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed email templates',
      error: error.message
    });
  }
});

// Force recreate templates endpoint
router.post('/seed-email-templates/force', async (req, res) => {
  try {
    // Delete existing templates
    await EmailTemplate.deleteMany({});
    
    // Create new templates
    const createdTemplates = await EmailTemplate.insertMany(defaultTemplates);
    
    res.json({
      success: true,
      message: 'Email templates recreated successfully',
      count: createdTemplates.length,
      templates: createdTemplates.map(t => ({
        id: t.template_id,
        name: t.template_name,
        type: t.template_type,
        recipient: t.recipient_type
      }))
    });
  } catch (error) {
    console.error('Error recreating email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recreate email templates',
      error: error.message
    });
  }
});

// Get all email templates
router.get('/email-templates', async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort({ template_type: 1, recipient_type: 1 });
    res.json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email templates',
      error: error.message
    });
  }
});

// Get email notifications log
router.get('/email-notifications', async (req, res) => {
  try {
    const { page = 1, limit = 50, record_type, status } = req.query;
    const filter = {};
    
    if (record_type) filter.record_type = record_type;
    if (status) filter.status = status;
    
    const notifications = await EmailNotification.find(filter)
      .sort({ sent_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await EmailNotification.countDocuments(filter);
    
    res.json({
      success: true,
      count: notifications.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email notifications',
      error: error.message
    });
  }
});

// Get recent activity
router.get('/recent-activity', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // For now, we'll create mock data based on actual data patterns
    // In a real implementation, you would query recent activities from various collections
    const mockActivities = [
      {
        action: 'New user registered',
        user: 'System',
        time: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        type: 'user'
      },
      {
        action: 'Equipment booking created',
        user: 'Jane Smith',
        time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        type: 'booking'
      },
      {
        action: 'Project updated',
        user: 'Alex Johnson',
        time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        type: 'project'
      },
      {
        action: 'Student Interest Group created',
        user: 'Sarah Wilson',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        type: 'group'
      },
      {
        action: 'Email notification sent',
        user: 'Admin',
        time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        type: 'email'
      }
    ];
    
    // Format time for display
    const formattedActivities = mockActivities.slice(0, limit).map(activity => ({
      ...activity,
      time: formatTimeAgo(activity.time)
    }));
    
    res.json({
      success: true,
      count: formattedActivities.length,
      activities: formattedActivities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message
    });
  }
});

// Helper function to format time ago
function formatTimeAgo(isoString) {
  const now = new Date();
  const activityTime = new Date(isoString);
  const diffMs = now - activityTime;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Get received emails
router.get('/received-emails', async (req, res) => {
  try {
    const { page = 1, limit = 50, isRead } = req.query;
    const filter = {};
    
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    
    // For now, we'll create mock data as there's no received email model yet
    // In a real implementation, you would have a ReceivedEmail model
    const mockEmails = [
      {
        id: '1',
        sender: 'user@example.com',
        subject: 'Question about equipment booking',
        body: 'Hello, I have a question about the booking process for the 3D printer. Can you help me understand the requirements?',
        receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: false
      },
      {
        id: '2',
        sender: 'student@hku.hk',
        subject: 'Project collaboration inquiry',
        body: 'Hi, I am interested in joining the robotics project mentioned on your website. Could you provide more information about the requirements?',
        receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        isRead: true
      },
      {
        id: '3',
        sender: 'faculty@hku.hk',
        subject: 'Lab access request',
        body: 'I would like to request access to the advanced lab facilities for my research project. Please let me know the procedure.',
        receivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        isRead: false
      },
      {
        id: '4',
        sender: 'admin@university.edu',
        subject: 'System maintenance notification',
        body: 'This is to inform you about the scheduled maintenance of the booking system next weekend.',
        receivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        isRead: true
      }
    ];
    
    // Apply filter
    let filteredEmails = mockEmails;
    if (isRead !== undefined) {
      filteredEmails = mockEmails.filter(email => email.isRead === (isRead === 'true'));
    }
    
    // Sort by received date (newest first)
    filteredEmails.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedEmails = filteredEmails.slice(startIndex, startIndex + limit);
    
    res.json({
      success: true,
      count: paginatedEmails.length,
      total: filteredEmails.length,
      page: parseInt(page),
      pages: Math.ceil(filteredEmails.length / limit),
      emails: paginatedEmails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch received emails',
      error: error.message
    });
  }
});

export default router;