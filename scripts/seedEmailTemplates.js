import { connectDB } from '../config/db.js';
import EmailTemplate from '../api/models/EmailTemplate.js';
import crypto from 'crypto';

const defaultTemplates = [
  // Booking Status Templates
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

  // Project Status Templates
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

  // Student Interest Group Status Templates
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

async function seedEmailTemplates() {
  try {
    console.log('🌱 Connecting to database...');
    await connectDB();
    
    console.log('🗑️ Clearing existing email templates...');
    await EmailTemplate.deleteMany({});
    
    console.log('📧 Creating default email templates...');
    const createdTemplates = await EmailTemplate.insertMany(defaultTemplates);
    
    console.log('✅ Email templates seeded successfully!');
    console.log(`📊 Created ${createdTemplates.length} templates:`);
    
    createdTemplates.forEach(template => {
      console.log(`  - ${template.template_name} (${template.template_type}/${template.recipient_type})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEmailTemplates();
}

export default seedEmailTemplates;