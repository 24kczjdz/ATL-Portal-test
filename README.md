# ATL Dashboard

A comprehensive web application for the Arts Technology Lab (ATL) at the University of Hong Kong, featuring an intelligent chatbot, booking systems, project management, and complete lab administration tools.

## 🏗️ Architecture

This project uses a multi-tier architecture:

- **Frontend**: React.js application with modern UI/UX and Tailwind CSS
- **Backend**: Node.js server with Express.js and RESTful APIs
- **Database**: MongoDB for data persistence
- **ML API**: Python FastAPI deployed on Hugging Face Spaces
- **Deployment**: Vercel for hosting and CI/CD
- **Email**: SMTP integration for notifications

## 🚀 Features

### Core Functionality
- **Intelligent Chatbot**: AI-powered assistant for ATL information and support
- **Equipment & Venue Booking**: Complete reservation system with calendar availability
- **Project Management**: Collaborative project creation and membership system
- **Student Interest Groups**: Community groups with admin-managed creation
- **Live Activities**: Real-time Q&A sessions and interactive workshops
- **User Management**: Role-based authentication with multiple user types
- **Admin Dashboard**: Comprehensive backend management tools

### User Roles & Permissions
- **ATL_ADMIN**: Full system access and management capabilities
- **ATL_Member_HKU_Staff**: Lab member with booking and project creation rights
- **ATL_Member_HKU_Student**: Student lab member with participation rights
- **ATL_Member_General**: General lab member access
- **Non_ATL_HKU_Staff**: Limited access for HKU staff

### Booking System
- **Equipment Booking**: Reserve lab equipment with availability calendar
- **Venue Booking**: Book lab spaces with pricing and duration management
- **Calendar Integration**: Visual availability checking and date selection
- **Admin Management**: Full CRUD operations for equipment and venues

### Project & Community Features
- **Projects**: Collaborative projects with member management (ATL_Members can create)
- **Student Interest Groups**: Specialized communities (Admin-created only)
- **Live Activities**: Real-time interactive sessions with polls and Q&A
- **Activity Management**: Workshop and event scheduling system

### Chatbot Capabilities
- ATL-specific information and FAQs
- Workshop and program details
- Equipment and facility information
- Booking assistance
- Staff directory and contact information
- Survey integration and data collection

## 🛠️ Technology Stack

- **Frontend**: React.js, Tailwind CSS, JavaScript ES6+
- **Backend**: Node.js, Express.js, RESTful APIs
- **Database**: MongoDB with Mongoose ODM
- **AI/ML**: Python FastAPI, Hugging Face Spaces
- **Real-time**: WebSocket connections for live features
- **Authentication**: JWT with role-based access control
- **Email**: SMTP integration for notifications
- **Deployment**: Vercel with automatic CI/CD

## 📁 Project Structure

```
Lab-Database-Docker/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── nav.jsx                  # Navigation with role-based access
│   │   │   ├── AvailabilityCalendar.jsx # Calendar component for bookings
│   │   │   ├── auth/                    # Authentication components
│   │   │   ├── charts/                  # Data visualization components
│   │   │   ├── host/                    # Activity hosting components
│   │   │   ├── live/                    # Live activity components
│   │   │   └── participant/             # Participant interface components
│   │   ├── pages/          # Main page components
│   │   │   ├── Home.js                  # Landing page
│   │   │   ├── Login.js                 # Authentication
│   │   │   ├── Profile.js               # User profile management
│   │   │   ├── ChatBot.js               # AI chatbot interface
│   │   │   ├── EquipmentBooking.js      # Equipment reservation system
│   │   │   ├── VenueBooking.js          # Venue reservation system
│   │   │   ├── Projects.js              # Project management for users
│   │   │   ├── StudentInterestGroup.js  # SIG participation interface
│   │   │   ├── LiveActivity.jsx         # Real-time activity interface
│   │   │   ├── LiveActivityDashboard.jsx# Activity management dashboard
│   │   │   ├── ManageBooking.js         # Admin booking management
│   │   │   ├── ManageProjects.js        # Admin project management
│   │   │   ├── ManageStudentInterestGroup.js # Admin SIG management
│   │   │   ├── ActivityManage.js        # Activity administration
│   │   │   ├── UserManage.js            # User administration
│   │   │   ├── SurveyManage.js          # Survey management
│   │   │   └── TokenManage.js           # Token administration
│   │   ├── contexts/       # React context providers
│   │   ├── handlers/       # Business logic handlers
│   │   ├── hooks/          # Custom React hooks
│   │   └── services/       # API service layers
├── api/                    # Node.js backend API
├── routes/                 # API route handlers
│   ├── chatbotRoutes.js               # Chatbot API endpoints
│   ├── userRoutes.js                  # User management APIs
│   └── liveActivityRoutes.js          # Live activity APIs
├── models/                 # MongoDB data models
│   ├── LiveActivity.js               # Activity model
│   ├── LiveParticipant.js            # Participant model
│   ├── LivePoll.js                   # Poll model
│   └── LiveQuestion.js               # Q&A model
├── services/               # Backend services
│   ├── emailService.js               # SMTP email integration
│   └── websocket-service.js          # Real-time communication
├── server/                 # Database configuration
├── config/                 # Configuration files
├── ml-api/                 # Python ML API (Hugging Face)
├── atl-chatbot-api/        # Alternative ML API implementation
└── docs/                   # Documentation
    ├── README.md                     # This file
    ├── EMAIL_SETUP.md               # Email configuration guide
    └── WebAPI.md                    # API documentation
```

## 🗄️ Database Collections

### MongoDB Collections Required

**User Management:**
- `users` - User accounts and profiles
- `sessions` - Authentication sessions

**Booking System:**
- `equipmentBookings` - Equipment reservation records
- `equipment` - Equipment inventory
- `venueBookings` - Venue reservation records  
- `venues` - Venue inventory

**Projects & Community:**
- `projects` - Project information and details
- `projectMembers` - Project membership tracking
- `studentInterestGroups` - Student Interest Group data
- `sigMembers` - SIG membership tracking

**Activities & Engagement:**
- `liveActivities` - Live session data
- `liveParticipants` - Session participant tracking
- `livePolls` - Interactive poll data
- `liveQuestions` - Q&A session data
- `surveys` - Survey data and responses

**System:**
- `tokens` - API and access token management
- `chatSessions` - Chatbot conversation history

## 🔧 Configuration

### Environment Variables

The application uses the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT token secret key | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `ML_API_URL` | Hugging Face API endpoint | Yes |
| `HUGGINGFACE_API_URL` | Alternative API URL | No |
| `HUGGINGFACE_API_TOKEN` | API token for private Spaces | No |
| `CORS_ORIGINS` | Allowed CORS origins | Yes |
| `SMTP_HOST` | Email server hostname | For email features |
| `SMTP_PORT` | Email server port | For email features |
| `SMTP_USER` | Email username | For email features |
| `SMTP_PASS` | Email password | For email features |

### Email Configuration

For email notifications, configure SMTP settings in your environment. See `EMAIL_SETUP.md` for detailed setup instructions including:

- Gmail SMTP configuration
- Outlook/Hotmail setup
- Custom SMTP server configuration
- Security and authentication settings

### Hugging Face Configuration

The chatbot API is deployed on Hugging Face Spaces:
- **Space URL**: `https://candyyetszyu-atl-chatbot-api.hf.space`
- **API Endpoint**: `/chat`
- **Authentication**: Bearer token (for private spaces)

## 🚀 Deployment

### Prerequisites
- Node.js 16+ 
- MongoDB database
- Hugging Face account (for ML API)
- Vercel account (for deployment)
- SMTP server access (for email features)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Lab-Database-Docker
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   npm install
   
   # Frontend dependencies
   cd client
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up MongoDB collections**
   Create the required collections in your MongoDB database as listed above.

5. **Start development servers**
   ```bash
   # Backend (from root directory)
   npm run dev
   
   # Frontend (from client directory)
   cd client
   npm start
   ```

### Production Deployment

The application is automatically deployed on Vercel:

1. **Connect repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - automatic on git push

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration

### Chatbot
- `POST /api/chat/:sessionId/message` - Send message to chatbot
- `GET /api/chat/:sessionId/history` - Get chat history

### Booking System
- `GET /api/equipment` - Get equipment list
- `POST /api/equipment-bookings` - Create equipment booking
- `GET /api/equipment-bookings/user` - Get user's equipment bookings
- `GET /api/venues` - Get venue list
- `POST /api/venue-bookings` - Create venue booking
- `GET /api/venue-bookings/user` - Get user's venue bookings

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project (ATL_Members+)
- `POST /api/projects/:id/join` - Join project
- `DELETE /api/projects/:id/leave` - Leave project
- `GET /api/projects/my-projects` - Get user's projects

### Student Interest Groups
- `GET /api/student-interest-groups` - Get all SIGs
- `POST /api/student-interest-groups` - Create SIG (Admin only)
- `POST /api/student-interest-groups/:id/join` - Join SIG
- `DELETE /api/student-interest-groups/:id/leave` - Leave SIG

### Live Activities
- `POST /api/live-activities` - Create live activity
- `GET /api/live-activities` - Get activities list
- `POST /api/live-activities/:id/join` - Join activity
- `POST /api/live-activities/:id/questions` - Submit question
- `POST /api/live-activities/:id/polls` - Create poll

### Admin Management
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/equipment-bookings/all` - Get all bookings (Admin only)
- `PATCH /api/equipment-bookings/:id/status` - Update booking status (Admin only)

### Health Check
- `GET /health` - Application health status
- `GET /api/test` - API test endpoint

## 🔐 Security

- JWT-based authentication with role-based access control
- Environment variable protection for sensitive data
- CORS configuration for cross-origin requests
- Input validation and sanitization
- Secure API token handling
- Protected admin routes and functions
- Session management and timeout handling

## 🎯 User Guide

### For Regular Users
1. **Registration/Login**: Create account and log in
2. **Booking**: Reserve equipment and venues using the calendar interface
3. **Projects**: Browse and join projects, create your own (if ATL_Member)
4. **Student Interest Groups**: Join groups that match your interests
5. **Live Activities**: Participate in real-time workshops and Q&A sessions
6. **Chatbot**: Get help and information about ATL services

### For ATL Members
- All regular user features
- Create and manage projects
- Host live activities and workshops
- Access to member-exclusive equipment and venues

### For Administrators
- Full system access and user management
- Create and manage Student Interest Groups
- Oversee all bookings, projects, and activities
- Manage equipment and venue inventory
- Access comprehensive analytics and reports
- Token and system configuration management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is developed for the Arts Technology Lab at the University of Hong Kong.

## 🆘 Support

For technical support or questions about the ATL Dashboard, please contact the development team or refer to the internal documentation.

---

**Arts Technology Lab** | University of Hong Kong | 2024
