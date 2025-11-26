import express from 'express';
const router = express.Router();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { models, schemas } from '../server/database.js';
import { ensureConnected } from '../config/db.js';
import emailService from '../api/services/emailService.js';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        // Decode the token without verification first to see its contents
        const decodedWithoutVerify = jwt.decode(token);

        // Now verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Set user info in the request object
        req.userId = decoded.User_ID;
        req.userRole = decoded.User_Role;
        req.userEmail = decoded.Email_Address;
        
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to verify staff or admin access
const verifyStaff = async (req, res, next) => {
    try {
        // First verify the token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.User_ID;
        req.userRole = decoded.User_Role;

        // Check if user has staff or admin role (updated for new role system)
        const staffRoles = [
            'ATL_ADMIN',
            'ATL_Member_HKU_Staff', 
            'Non_ATL_HKU_Staff'
        ];
        
        if (!staffRoles.includes(req.userRole)) {
            return res.status(403).json({ 
                message: 'Access denied. You need staff or admin privileges to access this resource.' 
            });
        }

        next();
    } catch (error) {
        console.error('Staff verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to verify admin access only
const verifyAdmin = async (req, res, next) => {
    try {
        // First verify the token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.User_ID;
        req.userRole = decoded.User_Role;

        // Check if user has admin role
        if (req.userRole !== 'ATL_ADMIN') {
            return res.status(403).json({ 
                message: 'Access denied. You need admin privileges to access this resource.' 
            });
        }

        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// User registration validation function
const validateUserRegistration = (userData) => {
    // Validate ATL Member ID if user is ATL member
    if (userData.ATL_Member && !userData.Member_ID?.trim()) {
        return 'ATL Member ID is required for ATL members';
    }

    // Validate UID for HKU Staff and Students
    const hkuRoles = ['ATL_Member_HKU_Staff', 'ATL_Member_HKU_Student', 'Non_ATL_HKU_Staff', 'Non_ATL_HKU_Student'];
    if (hkuRoles.includes(userData.User_Role) && !userData.UID?.trim()) {
        return 'HKU UID is required for HKU Staff and Students';
    }

    // Validate role consistency
    if (userData.ATL_Member) {
        const atlRoles = ['ATL_Member_HKU_Staff', 'ATL_Member_HKU_Student', 'ATL_Member_General'];
        if (!atlRoles.includes(userData.User_Role)) {
            return 'Invalid role for ATL member';
        }
    } else {
        const nonAtlRoles = ['Non_ATL_HKU_Staff', 'Non_ATL_HKU_Student', 'Non_ATL_General'];
        if (!nonAtlRoles.includes(userData.User_Role)) {
            return 'Invalid role for non-ATL member';
        }
    }

    return null; // No validation errors
};

// Universal Routes
function toTitleCase(string) {
    return string.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}

// Universal reading, input {collection, ID, rowID, filter}, return {row} or array of rows
router.get('/database', verifyStaff, async (req, res) => {
    const { collection, ID, rowID, filter } = req.query;
    
    // Whitelist allowed collections to prevent injection
    const allowedCollections = ['USER', 'ACTIVITY', 'EVENT', 'PARTICIPANT', 'CHAT', 'SURVEY', 'TOKEN'];
    if (!allowedCollections.includes(collection)) {
        return res.status(400).json({ message: `Invalid collection: ${collection}.` });
    }
    
    // Sanitize collection name
    if (!/^[A-Z_]+$/.test(collection)) {
        return res.status(400).json({ message: 'Invalid collection format.' });
    }

    // Ensure MongoDB connection before proceeding
    try {
        await ensureConnected();
    } catch (error) {
        console.error('Failed to ensure MongoDB connection:', error.message);
        return res.status(500).json({ 
            message: 'Database connection error', 
            error: 'Unable to connect to MongoDB',
            details: error.message
        });
    }

    try {
        let query = {};
        
        // Add filter conditions if provided
        if (filter) {
            Object.entries(filter).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    query[key] = { $in: value };
                } else if (typeof value === 'object' && value !== null) {
                    query[key] = value;
                } else {
                    query[key] = value;
                }
            });
        }

        // Check if we need to filter by User_ID
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userId = decoded.userId;

                // Special handling for ACTIVITY collection
                if (collection === 'ACTIVITY') {
                    if (!query.Creator_ID) {
                        query.Creator_ID = { $in: [userId] };
                    } else if (query.Creator_ID.$in) {
                        query.Creator_ID.$in.push(userId);
                    }
                }
            } catch (err) {
                console.error('Error processing token:', err);
            }
        }

        // If rowID is provided, add it to the query
        if (rowID) {
            query[ID] = rowID;
        }

        const result = rowID 
            ? await models[collection].findOne(query).maxTimeMS(30000).exec()
            : await models[collection].find(query).maxTimeMS(30000).exec();

        if (!result) {
            return res.status(404).json({ message: `${toTitleCase(collection)} not found.` });
        }

        return res.status(200).json(result);
    } catch (err) {
        console.error('Read error:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Universal deleting, input {collection, ID, rowID}, return {rowID}
router.delete('/database/:id', async (req, res) => {
    const { collection, ID } = req.query;
    const rowID = req.params.id;
    if (!ID) {
        return res.status(400).json({ message: `Please provide ${ID}.` });
    } 
    if (!Object.keys(models).includes(collection)) {
        return res.status(400).json({ message: `Invalid collection: ${collection}.` });
    }
    try {
        models[collection].deleteMany({ [ID]: rowID }).then(async function(){
            try {
                        const row = await models[collection].findOne({ [ID]: rowID }).exec();
                if (!row) {
                    return res.status(200).json({ [ID]: rowID }); // Success
                }
                return res.status(406).json({ message: `${toTitleCase(collection)} still found.` });
            } catch (err) {
                return res.status(500).json({ message: 'Internal server error', error: err.message });
            }
        }).catch(function(error){
            return res.status(404).json({ message: `${toTitleCase(collection)} not found.` });
        });
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Universal ID existence check, input {collection, ID, rowID}, return {exists: boolean}
router.get('/database/:id/exists', async (req, res) => {
    const { collection, ID } = req.query;
    const rowID = req.params.id;
    if (!ID) {
        return res.status(400).json({ message: `Please provide ${ID}.` });
    }
    if (!Object.keys(models).includes(collection)) {
        return res.status(400).json({ message: `Invalid collection: ${collection}.` });
    }
    try {
        const exists = await models[collection].exists({ [ID]: rowID });
        return res.status(200).json({ exists: !!exists });
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Universal writing, input {collection, ID, row}, return {rowID}
router.post('/database', async (req, res) => {
    const { collection, ID, row } = req.body;
    if (!ID) {
        return res.status(400).json({ message: `Please provide ${ID}.` });
    } 
    if (!Object.keys(models).includes(collection)) {
        return res.status(400).json({ message: `Invalid collection: ${collection}.` });
    }
    try {
        // Ensure MongoDB connection is established
        await ensureConnected();
        
        
        // Special handling for USER collection - only for new users
        if (collection === 'USER') {
            // Check if user already exists
            const userExists = await models.USER.findOne({
                $or: [
                    { Email_Address: row.Email_Address },
                    { User_ID: row.User_ID }
                ]
            });

            if (userExists) {
                let message = 'User already exists with this ';
                if (userExists.Email_Address === row.Email_Address) message += 'email address.';
                else message += 'username.';
                return res.status(400).json({ message });
            }

            // Validate user role and required fields
            const validationError = validateUserRegistration(row);
            if (validationError) {
                return res.status(400).json({ message: validationError });
            }

            // Create new user
            const newUser = new models.USER(row);
            try {
                await newUser.save();
                return res.status(200).json({ 
                    message: 'User created successfully.', 
                    [ID]: row[ID] 
                });
            } catch (error) {
                console.error('User creation error:', error);
                return res.status(400).json({ 
                    message: 'Error creating user', 
                    error: error.message 
                });
            }
        }

        // Handle other collections
        const prerow = await models[collection].findOne({ [ID]: row[ID] }).exec();
        if (prerow) {
            prerow.overwrite(row);
            await prerow.save();
        } else {
            await models[collection].create(row);
            const newRow = await models[collection].findOne({ [ID]: row[ID] }).exec();
            if (!newRow) {
                return res.status(404).json({ message: `${toTitleCase(collection)} could not be written. Please try again.` });
            }
            await newRow.save();
        }
        return res.status(200).json({ message: `${toTitleCase(collection)} written successfully.`, [ID]: row[ID] });
    } catch (err) {
        console.error('Write error:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Authentication routes
// Login endpoint
router.post('/auth/login', async (req, res) => {
    try {
        console.log('🔍 Login attempt started');
        console.log('Request body:', { ...req.body, Password: '[REDACTED]', password: '[REDACTED]' });
        console.log('JWT_SECRET available:', !!process.env.JWT_SECRET);
        
        // Ensure MongoDB connection
        const dbConnected = await ensureConnected();
        if (!dbConnected) {
            console.error('Failed to ensure MongoDB connection during login');
            return res.status(500).json({ 
                message: 'Database connection error. Please try again later.',
                error: 'Database connection failed'
            });
        }
        
        // Handle different possible field names from frontend
        const email = req.body.Email_Address || req.body.email || req.body.Email;
        const password = req.body.Password || req.body.password;
        
        
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email and password are required',
                received: { email: !!email, password: !!password }
            });
        }
        
        // Find user by email
        console.log('🔍 Looking for user with email:', email);
        const user = await models.USER.findOne({ Email_Address: email });
        console.log('🔍 User found:', !!user);
        
        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.Password);
        
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Check if JWT_SECRET is available
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET environment variable is not set');
            return res.status(500).json({
                message: 'Server configuration error. Please try again later.',
                error: 'JWT_SECRET not configured'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                User_ID: user.User_ID,
                Email_Address: user.Email_Address,
                User_Role: user.User_Role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        
        // Return user data and token
        res.json({
            message: 'Login successful',
            token,
            user: {
                User_ID: user.User_ID,
                Nickname: user.Nickname,
                First_Name: user.First_Name,
                Last_Name: user.Last_Name,
                Email_Address: user.Email_Address,
                User_Role: user.User_Role,
                Title: user.Title,
                Gender: user.Gender,
                Tel: user.Tel
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Provide more specific error messages
        if (error.message.includes('Connection timeout')) {
            res.status(500).json({ 
                message: 'Database connection timeout. Please try again.',
                error: 'Database timeout'
            });
        } else if (error.message.includes('MongoDB')) {
            res.status(500).json({ 
                message: 'Database connection error. Please try again later.',
                error: 'Database error'
            });
        } else if (error.message.includes('jwt')) {
            res.status(500).json({ 
                message: 'Authentication token generation failed.',
                error: 'JWT error'
            });
        } else {
            res.status(500).json({ 
                message: 'Login failed. Please try again.',
                error: error.message || 'Server error'
            });
        }
    }
});

// Protected route example
router.get('/auth/me', verifyToken, async (req, res) => {
    try {
        // Ensure MongoDB connection is established
        await ensureConnected();
        
        const user = await models.USER.findOne({ User_ID: req.userId })
            .select('-Password -__v -_id');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Add debug info
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



// Chat routes
router.post('/chat/create', verifyToken, async (req, res) => {
    try {
        // Ensure MongoDB connection is established
        await ensureConnected();
        
        const { User_ID, initial_analysis_id } = req.body;
        
        // Fetch user profile for context
        const user = await models.USER.findOne({ User_ID }).select('Nickname School_Name Form');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate unique Chat_ID
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 7);
        const Chat_ID = `CHAT_${timestamp}${randomStr}`;

        const chat = new models.CHAT({
            Chat_ID,
            User_ID,
            User_Context: {
                Nickname: user.Nickname,
                School_Name: user.School_Name,
                Form: user.Form
            },
            Messages: []
        });

        await chat.save();
        res.status(201).json(chat);
    } catch (error) {
        console.error('Chat creation error:', error);
        res.status(500).json({ message: 'Error creating chat', error: error.message });
    }
});

router.post('/chat/:Chat_ID/messages', verifyToken, async (req, res) => {
    try {
        const { Chat_ID } = req.params;
        const { Text, detailed } = req.body;

        const chat = await models.CHAT.findOne({ Chat_ID });
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Add user message
        chat.Messages.push({
            Text,
            Is_Bot: false,
            Timestamp: new Date()
        });

        // Generate local bot response (no external APIs)
        const nickname = chat.User_Context?.Nickname || 'student';
        const school = chat.User_Context?.School_Name || '';
        const form = chat.User_Context?.Form || '';
        
        let responseText = `Hello ${nickname}! `;
        if (school && form) {
            responseText += `As a ${form} student from ${school}, `;
        }
        
        responseText += `I'm here to help you learn about the Arts Technology Lab at HKU. `;
        
        // Add contextual response based on message content
        const messageText = Text.toLowerCase();
        if (messageText.includes('workshop') || messageText.includes('class')) {
            responseText += `We offer various workshops throughout the year covering creative coding, digital arts, and interactive media. `;
        } else if (messageText.includes('equipment') || messageText.includes('facility')) {
            responseText += `Our lab is equipped with cutting-edge technology including 3D printers, VR systems, and digital media production tools. `;
        } else if (messageText.includes('help') || messageText.includes('start')) {
            responseText += `Whether you're interested in creative technology, digital arts, or interactive projects, we're here to support your journey. `;
        } else {
            responseText += `You can ask me about our workshops, equipment, facilities, programs, or how to get involved with ATL. `;
        }
        
        responseText += `How can I assist you today?`;

        const botResponse = {
            Text: responseText,
            Is_Bot: true,
            Timestamp: new Date()
        };

        // Add bot message
        chat.Messages.push(botResponse);
        chat.updatedAt = new Date();

        await chat.save();
        res.status(200).json(chat);
    } catch (error) {
        console.error('Message addition error:', error);
        res.status(500).json({ message: 'Error adding message', error: error.message });
    }
});

// Get chat history
router.get('/chat/:Chat_ID', verifyToken, async (req, res) => {
    try {
        const { Chat_ID } = req.params;
        const chat = await models.CHAT.findOne({ Chat_ID });
        
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        res.status(200).json(chat);
    } catch (error) {
        console.error('Chat retrieval error:', error);
        res.status(500).json({ message: 'Error retrieving chat', error: error.message });
    }
});

// Get available analyses for a chat
router.get('/chat/:Chat_ID/analyses', verifyToken, async (req, res) => {
    try {
        const { Chat_ID } = req.params;
        
        const chat = await models.CHAT.findOne({ Chat_ID });
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        
        // Return formatted list of available analyses
        const analyses = chat.User_Context.trajectory_analyses
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(analysis => ({
                id: analysis.id,
                timestamp: analysis.timestamp,
                content: analysis.content,
                preview: analysis.content.substring(0, 100) + '...'
            }));

        res.status(200).json(analyses);
    } catch (error) {
        console.error('Error fetching analyses:', error);
        res.status(500).json({ message: 'Error fetching analyses', error: error.message });
    }
});

// Get current user's profile data
router.get('/profile', verifyToken, async (req, res) => {
    try {
        await ensureConnected();
        
        const user = await models.USER.findOne({ User_ID: req.userId }).select('-Password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
});

// New route for updating user profiles
router.put('/user/:User_ID', verifyToken, async (req, res) => {
    try {
        // Ensure MongoDB connection is established
        await ensureConnected();
        
        const { User_ID } = req.params;
        const updates = req.body;


        // Verify the user is updating their own profile or is an admin
        if (req.userId !== User_ID) {
            const currentUser = await models.USER.findOne({ User_ID: req.userId });
            if (!currentUser || currentUser.User_Role !== 'ATL_ADMIN') {
                return res.status(403).json({ message: 'Not authorized to update this user' });
            }
        }

        // Find the user
        const user = await models.USER.findOne({ User_ID: User_ID });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If email is being changed, check if it's already in use
        if (updates.Email_Address && updates.Email_Address !== user.Email_Address) {
            const emailInUse = await models.USER.findOne({ 
                Email_Address: updates.Email_Address,
                User_ID: { $ne: User_ID }
            });
            
            if (emailInUse) {
                return res.status(400).json({ 
                    message: 'This email address is already in use by another user' 
                });
            }
        }

        // Update user fields
        Object.keys(updates).forEach(key => {
            if (key !== 'Password' && key !== 'User_ID') { // Don't allow changing User_ID
                user[key] = updates[key];
            }
        });

        // If password is being updated, handle it separately
        if (updates.Password) {
            user.Password = updates.Password;
        }

        await user.save();
        return res.status(200).json({ 
            message: 'User updated successfully',
            user: {
                User_ID: user.User_ID,
                First_Name: user.First_Name,
                Last_Name: user.Last_Name,
                Nickname: user.Nickname,
                Title: user.Title,
                Gender: user.Gender,
                Email_Address: user.Email_Address,
                Tel: user.Tel,
                User_Role: user.User_Role,
                ATL_Member: user.ATL_Member,
                Member_ID: user.Member_ID,
                UID: user.UID,
                direct_marketing: user.direct_marketing,
                email_list: user.email_list,
                card_id: user.card_id
            }
        });
    } catch (error) {
        console.error('User update error:', error);
        return res.status(500).json({ 
            message: 'Error updating user', 
            error: error.message 
        });
    }
});

// Activities Management Endpoints
// Get all activities with stats (Staff only)
router.get('/activities', verifyStaff, async (req, res) => {
    try {
        await ensureConnected();
        
        const activities = await models.ACTIVITY.find({}).sort({ Created_At: -1 });
        
        // Calculate stats
        const totalActivities = activities.length;
        const liveActivities = activities.filter(a => a.Live === true).length;
        const draftActivities = activities.filter(a => a.Status === 'draft').length;
        const thisMonth = activities.filter(a => {
            const createdDate = new Date(a.Created_At);
            const now = new Date();
            return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
        }).length;

        const stats = {
            totalActivities,
            liveActivities,
            draftActivities,
            thisMonth
        };

        res.json({ activities, stats });
    } catch (error) {
        console.error('Activities fetch error:', error);
        res.status(500).json({ message: 'Error fetching activities', error: error.message });
    }
});

// Get single activity by ID (Staff only)
router.get('/activities/:id', verifyStaff, async (req, res) => {
    try {
        await ensureConnected();
        
        const activity = await models.ACTIVITY.findOne({ Act_ID: req.params.id });
        if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }

        res.json({ activity });
    } catch (error) {
        console.error('Activity fetch error:', error);
        res.status(500).json({ message: 'Error fetching activity', error: error.message });
    }
});

// Delete activity (Staff only)
router.delete('/activities/:id', verifyStaff, async (req, res) => {
    try {
        await ensureConnected();
        
        const result = await models.ACTIVITY.deleteOne({ Act_ID: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Activity not found' });
        }

        res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('Activity delete error:', error);
        res.status(500).json({ message: 'Error deleting activity', error: error.message });
    }
});

// Export activities (Staff only)
router.post('/activities/export', verifyStaff, async (req, res) => {
    try {
        await ensureConnected();
        
        const activities = await models.ACTIVITY.find({});
        
        // Create CSV content
        const csvHeaders = 'Activity ID,Title,Description,Status,Live,Created At,Last Updated\n';
        const csvRows = activities.map(activity => {
            return [
                activity.Act_ID || '',
                (activity.Title || '').replace(/,/g, ''),
                (activity.Description || '').replace(/,/g, ''),
                activity.Status || '',
                activity.Live ? 'Yes' : 'No',
                activity.Created_At ? new Date(activity.Created_At).toISOString() : '',
                activity.Last_Updated ? new Date(activity.Last_Updated).toISOString() : ''
            ].join(',');
        }).join('\n');
        
        const csvContent = csvHeaders + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=activities_export.csv');
        res.send(csvContent);
    } catch (error) {
        console.error('Activities export error:', error);
        res.status(500).json({ message: 'Error exporting activities', error: error.message });
    }
});

// Events Management Endpoints
// Get all events with stats (Staff only)
router.get('/events', verifyStaff, async (req, res) => {
    try {
        await ensureConnected();
        
        const events = await models.EVENT.find({}).sort({ Event_StartDate: -1 });
        
        // Calculate stats
        const totalEvents = events.length;
        const now = new Date();
        const activeEvents = events.filter(e => {
            const start = new Date(e.Event_StartDate);
            const end = new Date(e.Event_EndDate);
            return now >= start && now <= end;
        }).length;
        const upcomingEvents = events.filter(e => {
            const start = new Date(e.Event_StartDate);
            return start > now;
        }).length;
        const thisMonth = events.filter(e => {
            const startDate = new Date(e.Event_StartDate);
            return startDate.getMonth() === now.getMonth() && startDate.getFullYear() === now.getFullYear();
        }).length;

        const stats = {
            totalEvents,
            activeEvents,
            upcomingEvents,
            thisMonth
        };

        res.json({ events, stats });
    } catch (error) {
        console.error('Events fetch error:', error);
        res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
});

// Get single event by ID (Staff only)
router.get('/events/:id', verifyStaff, async (req, res) => {
    try {
        await ensureConnected();
        
        const event = await models.EVENT.findOne({ Event_ID: req.params.id });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ event });
    } catch (error) {
        console.error('Event fetch error:', error);
        res.status(500).json({ message: 'Error fetching event', error: error.message });
    }
});

// Delete event (Staff only)
router.delete('/events/:id', verifyStaff, async (req, res) => {
    try {
        await ensureConnected();
        
        const result = await models.EVENT.deleteOne({ Event_ID: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Event delete error:', error);
        res.status(500).json({ message: 'Error deleting event', error: error.message });
    }
});

// Export events (Staff only)
router.post('/events/export', verifyStaff, async (req, res) => {
    try {
        await ensureConnected();
        
        const events = await models.EVENT.find({});
        
        // Create CSV content
        const csvHeaders = 'Event ID,Title,Type,Start Date,End Date,Host ID\n';
        const csvRows = events.map(event => {
            return [
                event.Event_ID || '',
                (event.Event_Title || '').replace(/,/g, ''),
                event.Event_Type || '',
                event.Event_StartDate ? new Date(event.Event_StartDate).toISOString() : '',
                event.Event_EndDate ? new Date(event.Event_EndDate).toISOString() : '',
                event.Host_ID || ''
            ].join(',');
        }).join('\n');
        
        const csvContent = csvHeaders + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=events_export.csv');
        res.send(csvContent);
    } catch (error) {
        console.error('Events export error:', error);
        res.status(500).json({ message: 'Error exporting events', error: error.message });
    }
});

// Users Management Endpoints
// Get all users with stats (Staff only)
router.get('/users', verifyStaff, async (req, res) => {
    try {
        await ensureConnected();
        
        // Hint: support lightweight responses via query in future (e.g., ?fields=basic, ?limit=100)
        const users = await models.USER
            .find({})
            .select('-Password')
            .sort({ createdAt: -1 })
            .lean();
        
        // Calculate stats
        const totalUsers = users.length;
        const atlMembers = users.filter(u => u.ATL_Member).length;
        const staff = users.filter(u => String(u.User_Role || '').includes('Staff')).length;
        const students = users.filter(u => String(u.User_Role || '').includes('Student')).length;

        const stats = {
            totalUsers,
            atlMembers,
            staff,
            students
        };

        // Encourage client-side caching briefly to avoid repeat hits during navigation
        res.set('Cache-Control', 'private, max-age=30');
        res.json({ users, stats });
    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Get single user by ID (Staff only)
router.get('/users/:id', verifyStaff, async (req, res) => {
    try {
        await ensureConnected();
        
        const user = await models.USER.findOne({ User_ID: req.params.id }).select('-Password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// Delete user (Staff only)
router.delete('/users/:id', verifyStaff, async (req, res) => {
    try {
        await ensureConnected();
        
        const result = await models.USER.deleteOne({ User_ID: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('User delete error:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});

// Get users (Staff only)
// (Removed duplicate /users route definition)

// Export users (Staff only)
router.post('/users/export', verifyStaff, async (req, res) => {
    try {
        await ensureConnected();
        
        const users = await models.USER.find({}).select('-Password');
        
        // Create CSV content
        const csvHeaders = 'User ID,First Name,Last Name,Nickname,Email,Role,ATL Member,Member ID,UID,Title,Gender,Phone,Direct Marketing,Email List,Card ID,Created At\n';
        const csvRows = users.map(user => {
            return [
                user.User_ID || '',
                (user.First_Name || '').replace(/,/g, ''),
                (user.Last_Name || '').replace(/,/g, ''),
                (user.Nickname || '').replace(/,/g, ''),
                user.Email_Address || '',
                user.User_Role || '',
                user.ATL_Member ? 'Yes' : 'No',
                user.Member_ID || '',
                user.UID || '',
                (user.Title || '').replace(/,/g, ''),
                user.Gender || '',
                user.Tel || '',
                user.direct_marketing ? 'Yes' : 'No',
                user.email_list ? 'Yes' : 'No',
                user.card_id || '',
                user.createdAt ? new Date(user.createdAt).toISOString() : ''
            ].join(',');
        }).join('\n');
        
        const csvContent = csvHeaders + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
        res.send(csvContent);
    } catch (error) {
        console.error('Users export error:', error);
        res.status(500).json({ message: 'Error exporting users', error: error.message });
    }
});

// Admin Registration with Token
router.post('/auth/register-admin', async (req, res) => {
    try {
        await ensureConnected();
        
        const { 
            User_ID, 
            Email_Address, 
            Password, 
            First_Name, 
            Last_Name, 
            Nickname, 
            Title,
            Gender,
            Tel,
            User_Role,
            ATL_Member,
            Member_ID,
            UID,
            direct_marketing,
            email_list,
            adminToken 
        } = req.body;
        
        if (!adminToken) {
            return res.status(400).json({ message: 'Admin registration token is required' });
        }
        
        // Verify the admin token
        const token = await models.TOKEN.findOne({ 
            Token_Value: adminToken, 
            Is_Used: false,
            Token_Type: 'admin_registration'
        });
        
        if (!token) {
            return res.status(400).json({ message: 'Invalid or expired admin registration token' });
        }
        
        // Check if token has expired
        if (token.Expires_At && new Date() > new Date(token.Expires_At)) {
            return res.status(400).json({ message: 'Admin registration token has expired' });
        }
        
        // Check if user already exists
        const existingUser = await models.USER.findOne({
            $or: [{ Email_Address }, { User_ID }]
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User already exists with this email or User ID' 
            });
        }
        
        // Validate user registration data
        const validationError = validateUserRegistration({
            User_Role: User_Role || 'ATL_ADMIN',
            ATL_Member: ATL_Member || false,
            Member_ID: Member_ID || '',
            UID: UID || ''
        });
        
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        // Create new admin user
        const newUser = new models.USER({
            User_ID,
            Email_Address,
            Password,
            First_Name,
            Last_Name,
            Nickname,
            Title,
            Gender,
            Tel,
            User_Role: User_Role || 'ATL_ADMIN',
            ATL_Member: ATL_Member || false,
            Member_ID: Member_ID || '',
            UID: UID || '',
            direct_marketing: direct_marketing || false,
            email_list: email_list || false,
            createdAt: new Date(),
            lastLogin: new Date()
        });
        
        await newUser.save();
        
        // Mark token as used
        token.Is_Used = true;
        token.Used_By = User_ID;
        token.Used_At = new Date();
        token.Updated_At = new Date();
        await token.save();
        
        // Generate JWT token
        const authToken = jwt.sign(
            { 
                User_ID: newUser.User_ID,
                Email_Address: newUser.Email_Address,
                User_Role: newUser.User_Role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            message: 'Admin account created successfully',
            token: authToken,
            user: {
                User_ID: newUser.User_ID,
                First_Name: newUser.First_Name,
                Last_Name: newUser.Last_Name,
                Nickname: newUser.Nickname,
                Email_Address: newUser.Email_Address,
                User_Role: newUser.User_Role
            }
        });
        
    } catch (error) {
        res.status(500).json({ 
            message: 'Error creating admin account', 
            error: error.message
        });
    }
});

// Token Management Endpoints (Admin Only)
// Get all tokens
router.get('/tokens', verifyAdmin, async (req, res) => {
    try {
        await ensureConnected();
        
        const tokens = await models.TOKEN.find({}).sort({ Created_At: -1 });
        
        // Calculate stats
        const totalTokens = tokens.length;
        const activeTokens = tokens.filter(t => !t.Is_Used && (!t.Expires_At || new Date() < t.Expires_At)).length;
        const usedTokens = tokens.filter(t => t.Is_Used).length;
        const expiredTokens = tokens.filter(t => t.Expires_At && new Date() > t.Expires_At && !t.Is_Used).length;
        
        const stats = {
            totalTokens,
            activeTokens,
            usedTokens,
            expiredTokens
        };
        
        res.json({ tokens, stats });
    } catch (error) {
        console.error('Tokens fetch error:', error);
        res.status(500).json({ message: 'Error fetching tokens', error: error.message });
    }
});

// Create new admin token
router.post('/tokens', verifyAdmin, async (req, res) => {
    try {
        await ensureConnected();
        
        const { description, expiresInHours } = req.body;
        
        // Generate unique token ID and value
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 15);
        const tokenId = `ADMIN_TOKEN_${timestamp}${randomStr}`;
        
        // Generate secure token value
        const tokenValue = Array.from({ length: 64 }, () => 
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'.charAt(
                Math.floor(Math.random() * 70)
            )
        ).join('');
        
        // Calculate expiration date if provided
        let expiresAt = null;
        if (expiresInHours && expiresInHours > 0) {
            expiresAt = new Date(Date.now() + (expiresInHours * 60 * 60 * 1000));
        }
        
        const newToken = new models.TOKEN({
            Token_ID: tokenId,
            Token_Value: tokenValue,
            Token_Type: 'admin_registration',
            Created_By: req.userId,
            Description: description || '',
            Expires_At: expiresAt,
            Created_At: new Date(),
            Updated_At: new Date()
        });
        
        await newToken.save();
        
        res.json({
            message: 'Admin registration token created successfully',
            token: newToken
        });
        
    } catch (error) {
        console.error('Token creation error:', error);
        res.status(500).json({ message: 'Error creating token', error: error.message });
    }
});

// Delete token
router.delete('/tokens/:id', verifyAdmin, async (req, res) => {
    try {
        await ensureConnected();
        
        const result = await models.TOKEN.deleteOne({ Token_ID: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Token not found' });
        }
        
        res.json({ message: 'Token deleted successfully' });
    } catch (error) {
        console.error('Token delete error:', error);
        res.status(500).json({ message: 'Error deleting token', error: error.message });
    }
});

// Export tokens (Admin Only)
router.post('/tokens/export', verifyAdmin, async (req, res) => {
    try {
        await ensureConnected();
        
        const tokens = await models.TOKEN.find({});
        
        // Create CSV content
        const csvHeaders = 'Token ID,Token Value,Type,Created By,Is Used,Used By,Created At,Expires At,Description\n';
        const csvRows = tokens.map(token => {
            return [
                token.Token_ID || '',
                token.Token_Value || '',
                token.Token_Type || '',
                token.Created_By || '',
                token.Is_Used ? 'Yes' : 'No',
                token.Used_By || '',
                token.Created_At ? new Date(token.Created_At).toISOString() : '',
                token.Expires_At ? new Date(token.Expires_At).toISOString() : '',
                (token.Description || '').replace(/,/g, '')
            ].join(',');
        }).join('\n');
        
        const csvContent = csvHeaders + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=admin_tokens_export.csv');
        res.send(csvContent);
    } catch (error) {
        console.error('Tokens export error:', error);
        res.status(500).json({ message: 'Error exporting tokens', error: error.message });
    }
});

// Password Recovery endpoints

// Request password recovery (with user choice)
router.post('/auth/forgot-password', async (req, res) => {
    try {
        const dbConnected = await ensureConnected();
        if (!dbConnected) {
            return res.status(500).json({ 
                message: 'Database connection error. Please try again later.' 
            });
        }

        const { email, type = 'reset' } = req.body; // type can be 'reset' or 'one_time'
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Validate type
        if (!['reset', 'one_time'].includes(type)) {
            return res.status(400).json({ message: 'Invalid recovery type' });
        }

        console.log(`Password recovery request: ${email}, type: ${type}`);

        // Find user by email
        const UserModel = models.USER;
        const user = await UserModel.findOne({ Email_Address: email });

        if (!user) {
            // For security, we still return success even if user doesn't exist
            return res.status(200).json({ 
                message: 'If an account with that email exists, a recovery email has been sent.',
                type: type
            });
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expirationTime = type === 'reset' 
            ? new Date(Date.now() + 60 * 60 * 1000) // 1 hour for reset
            : new Date(Date.now() + 30 * 60 * 1000); // 30 minutes for one-time access

        // Store reset token in user document
        if (type === 'reset') {
            user.resetToken = token;
            user.resetTokenExpires = expirationTime;
        } else {
            user.oneTimeToken = token;
            user.oneTimeTokenExpires = expirationTime;
        }
        await user.save();

        // Create password reset record for tracking
        const PasswordResetModel = models.PASSWORD_RESET;
        const resetRecord = new PasswordResetModel({
            reset_id: crypto.randomBytes(16).toString('hex'),
            user_id: user.User_ID,
            email: email,
            token: token,
            type: type,
            expires_at: expirationTime,
            used: false,
            created_at: new Date(),
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent'] || 'Unknown'
        });
        await resetRecord.save();

        // Send email
        const emailResult = await emailService.sendPasswordResetEmail(email, token, type);
        
        if (!emailResult.success) {
            console.error('Email sending failed:', emailResult.error);
            return res.status(500).json({ 
                message: 'Failed to send recovery email. Please try again later.' 
            });
        }

        console.log(`${type} email sent successfully to: ${email}`);

        res.status(200).json({ 
            message: `A ${type === 'reset' ? 'password reset' : 'one-time access'} email has been sent to your email address.`,
            type: type,
            expiresIn: type === 'reset' ? '1 hour' : '30 minutes'
        });

    } catch (error) {
        console.error('Password recovery error:', error);
        res.status(500).json({ 
            message: 'An error occurred while processing your request. Please try again later.' 
        });
    }
});

// Reset password with token
router.post('/auth/reset-password', async (req, res) => {
    try {
        const dbConnected = await ensureConnected();
        if (!dbConnected) {
            return res.status(500).json({ 
                message: 'Database connection error. Please try again later.' 
            });
        }

        const { token, newPassword, type = 'reset' } = req.body;
        
        if (!token) {
            return res.status(400).json({ message: 'Reset token is required' });
        }

        if (type === 'reset' && !newPassword) {
            return res.status(400).json({ message: 'New password is required' });
        }

        console.log(`Password reset attempt with token type: ${type}`);

        // Find user by token based on type
        const UserModel = models.USER;
        const tokenField = type === 'reset' ? 'resetToken' : 'oneTimeToken';
        const expiryField = type === 'reset' ? 'resetTokenExpires' : 'oneTimeTokenExpires';
        
        const user = await UserModel.findOne({ 
            [tokenField]: token,
            [expiryField]: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ 
                message: 'Invalid or expired token. Please request a new recovery email.' 
            });
        }

        // Mark token as used in tracking record
        const PasswordResetModel = models.PASSWORD_RESET;
        await PasswordResetModel.updateOne(
            { token: token, used: false },
            { used: true }
        );

        if (type === 'reset') {
            // Hash new password and update user
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            
            user.Password = hashedPassword;
            user.resetToken = undefined;
            user.resetTokenExpires = undefined;
            user.lastLogin = new Date();
            await user.save();

            console.log(`Password reset successful for user: ${user.Email_Address}`);

            res.status(200).json({ 
                message: 'Password has been reset successfully. You can now log in with your new password.' 
            });
        } else {
            // One-time access - generate temporary JWT token
            user.oneTimeToken = undefined;
            user.oneTimeTokenExpires = undefined;
            user.lastLogin = new Date();
            await user.save();

            // Generate JWT token for immediate login
            const jwtToken = jwt.sign(
                { 
                    User_ID: user.User_ID,
                    Email_Address: user.Email_Address,
                    User_Role: user.User_Role,
                    temporary: true // Mark as temporary access
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            console.log(`One-time access successful for user: ${user.Email_Address}`);

            res.status(200).json({ 
                message: 'One-time access granted successfully.',
                token: jwtToken,
                user: {
                    User_ID: user.User_ID,
                    First_Name: user.First_Name,
                    Last_Name: user.Last_Name,
                    Nickname: user.Nickname,
                    Email_Address: user.Email_Address,
                    User_Role: user.User_Role,
                    temporary: true
                }
            });
        }

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ 
            message: 'An error occurred while resetting your password. Please try again later.' 
        });
    }
});

// Validate reset token (for frontend validation)
router.get('/auth/validate-reset-token/:token', async (req, res) => {
    try {
        const dbConnected = await ensureConnected();
        if (!dbConnected) {
            return res.status(500).json({ 
                message: 'Database connection error. Please try again later.' 
            });
        }

        const { token } = req.params;
        const { type = 'reset' } = req.query;

        const UserModel = models.USER;
        const tokenField = type === 'reset' ? 'resetToken' : 'oneTimeToken';
        const expiryField = type === 'reset' ? 'resetTokenExpires' : 'oneTimeTokenExpires';
        
        const user = await UserModel.findOne({ 
            [tokenField]: token,
            [expiryField]: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ 
                valid: false,
                message: 'Invalid or expired token' 
            });
        }

        res.status(200).json({ 
            valid: true,
            type: type,
            email: user.Email_Address,
            expiresAt: user[expiryField]
        });

    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({ 
            valid: false,
            message: 'Error validating token' 
        });
    }
});

// User Directory Routes for Yellow Pages functionality

// Get all users for directory (Admin only)
router.get('/users/directory', verifyStaff, async (req, res) => {
    try {
        console.log('🔍 Fetching user directory');
        
        const dbConnected = await ensureConnected();
        if (!dbConnected) {
            return res.status(500).json({ message: 'Database connection error' });
        }

        const users = await models.USER.find({})
            .select('User_ID First_Name Last_Name Email_Address User_Role Tel Title Gender Last_Login')
            .sort({ First_Name: 1, Last_Name: 1 });

        console.log('✅ Found users:', users.length);
        res.json(users);
    } catch (error) {
        console.error('❌ Error fetching user directory:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Request counter to prevent infinite loops
const requestCounts = new Map();

// Get comprehensive user activity (Admin only)
router.get('/users/:userId/activity', verifyStaff, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Rate limiting to prevent infinite loops
        const requestKey = `${req.ip}-${userId}`;
        const currentCount = requestCounts.get(requestKey) || 0;
        
        if (currentCount > 10) {
            console.warn('⚠️ Rate limit exceeded for user activity request:', userId);
            return res.status(429).json({ message: 'Too many requests' });
        }
        
        requestCounts.set(requestKey, currentCount + 1);
        
        // Reset counter after 1 minute
        setTimeout(() => {
            requestCounts.delete(requestKey);
        }, 60000);
        
        console.log('🔍 Fetching activity for user:', userId);
        
        const dbConnected = await ensureConnected();
        if (!dbConnected) {
            return res.status(500).json({ message: 'Database connection error' });
        }

        // Import all activity models
        const EquipmentBooking = mongoose.model('EquipmentBooking');
        const VenueBooking = mongoose.model('VenueBooking');
        const Project = mongoose.model('Project');
        const StudentInterestGroup = mongoose.model('StudentInterestGroup');
        
        // Try to import survey and event models (they may not exist yet)
        let ChatSurvey, LiveActivity, LiveParticipant;
        try {
            ChatSurvey = mongoose.model('ChatSurvey');
        } catch (e) {
            console.log('ChatSurvey model not found, skipping survey data');
        }
        try {
            LiveActivity = mongoose.model('LiveActivity');
            LiveParticipant = mongoose.model('LiveParticipant');
        } catch (e) {
            console.log('Live Activity models not found, skipping event data');
        }

        // Fetch all user activities in parallel
        const activityPromises = [
            // Equipment bookings
            EquipmentBooking.find({ user_id: userId })
                .populate('equipment_id', 'eqm_name eqm_cat eqm_type')
                .sort({ eqm_booking_date: -1 })
                .limit(50),
                
            // Venue bookings  
            VenueBooking.find({ user_id: userId })
                .populate('venue_id', 'venue_unit venue_type')
                .sort({ booking_date: -1 })
                .limit(50),
                
            // Projects (both created and joined)
            Project.find({
                $or: [
                    { creator: userId },
                    { members: userId }
                ]
            })
            .populate('creator', 'First_Name Last_Name')
            .populate('members', 'First_Name Last_Name')
            .sort({ createdAt: -1 })
            .limit(50),
            
            // Student Interest Groups
            StudentInterestGroup.find({ members: userId })
                .sort({ createdAt: -1 })
                .limit(50)
        ];

        // Add survey data if model exists
        if (ChatSurvey) {
            activityPromises.push(
                ChatSurvey.find({ User_ID: userId })
                    .sort({ createdAt: -1 })
                    .limit(50)
            );
        }

        // Add event participation data if models exist
        if (LiveActivity && LiveParticipant) {
            activityPromises.push(
                LiveParticipant.find({ userId: userId })
                    .populate('activityId', 'title description startTime endTime status')
                    .sort({ joinedAt: -1 })
                    .limit(50)
            );
        }

        const results = await Promise.all(activityPromises);
        
        // Destructure results with fallbacks for missing data
        const [equipmentBookings, venueBookings, userProjects, userSIGs, ...optionalResults] = results;
        
        let surveyData = [];
        let eventParticipation = [];
        
        // Handle optional results
        let resultIndex = 0;
        if (ChatSurvey) {
            surveyData = optionalResults[resultIndex++] || [];
        }
        if (LiveActivity && LiveParticipant) {
            eventParticipation = optionalResults[resultIndex++] || [];
        }

        // Format the data for frontend consumption
        const activityData = {
            equipmentBookings: equipmentBookings.map(booking => ({
                id: booking._id,
                equipment_name: booking.equipment_id?.eqm_name || 'Unknown Equipment',
                equipment_category: booking.equipment_id?.eqm_cat,
                equipment_type: booking.equipment_id?.eqm_type,
                eqm_booking_date: booking.eqm_booking_date,
                eqm_booking_time: booking.eqm_booking_time,
                eqm_booking_duration: booking.eqm_booking_duration,
                status: booking.status,
                createdAt: booking.createdAt
            })),
            
            venueBookings: venueBookings.map(booking => ({
                id: booking._id,
                venue_name: `${booking.venue_id?.venue_unit} - ${booking.venue_id?.venue_type}` || 'Unknown Venue',
                venue_unit: booking.venue_id?.venue_unit,
                venue_type: booking.venue_id?.venue_type,
                booking_date: booking.booking_date,
                booking_time: booking.booking_time,
                booking_duration: booking.booking_duration,
                booking_desc: booking.booking_desc,
                total_pay: booking.total_pay,
                status: booking.status,
                createdAt: booking.createdAt
            })),
            
            projects: userProjects.map(project => ({
                id: project._id,
                proj_name: project.proj_name,
                proj_type: project.proj_type,
                proj_desc: project.proj_desc,
                proj_status: project.proj_status,
                isCreator: project.creator.toString() === userId,
                creator_name: `${project.creator.First_Name} ${project.creator.Last_Name}`,
                members: project.members.map(member => ({
                    id: member._id,
                    name: `${member.First_Name} ${member.Last_Name}`
                })),
                memberCount: project.members.length,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            })),
            
            sigMemberships: userSIGs.map(sig => ({
                id: sig._id,
                sig_name: sig.sig_name,
                sig_abbrev: sig.sig_abbrev,
                sig_desc: sig.sig_desc,
                sig_status: sig.sig_status,
                memberCount: sig.members.length,
                joinedAt: sig.createdAt,
                updatedAt: sig.updatedAt
            })),

            surveys: surveyData.map(survey => ({
                id: survey._id,
                session_id: survey.Session_ID,
                conversation_data: survey.Conversation_Data ? JSON.parse(survey.Conversation_Data) : null,
                feedback: survey.Feedback,
                rating: survey.Rating,
                suggestions: survey.Suggestions,
                createdAt: survey.createdAt || survey.Created_At,
                messageCount: survey.Conversation_Data ? 
                    JSON.parse(survey.Conversation_Data).messages?.length || 0 : 0
            })),

            eventParticipation: eventParticipation.map(participation => ({
                id: participation._id,
                event_title: participation.activityId?.title || 'Unknown Event',
                event_description: participation.activityId?.description,
                event_start: participation.activityId?.startTime,
                event_end: participation.activityId?.endTime,
                event_status: participation.activityId?.status,
                participation_role: participation.role || 'participant',
                joined_at: participation.joinedAt,
                is_active: participation.isActive
            }))
        };

        // Add summary statistics
        const summary = {
            totalEquipmentBookings: equipmentBookings.length,
            totalVenueBookings: venueBookings.length,
            totalProjects: userProjects.length,
            totalSIGMemberships: userSIGs.length,
            totalSurveys: surveyData.length,
            totalEventParticipation: eventParticipation.length,
            totalSpending: venueBookings.reduce((sum, booking) => sum + (booking.total_pay || 0), 0),
            projectsCreated: userProjects.filter(p => p.creator.toString() === userId).length,
            projectsJoined: userProjects.filter(p => p.creator.toString() !== userId).length,
            averageSurveyRating: surveyData.length > 0 ? 
                surveyData.reduce((sum, survey) => sum + (survey.Rating || 0), 0) / surveyData.length : 0,
            totalChatbotInteractions: surveyData.reduce((sum, survey) => 
                sum + (survey.Conversation_Data ? 
                    JSON.parse(survey.Conversation_Data).messages?.length || 0 : 0), 0)
        };

        console.log('✅ Activity data compiled for user:', userId);
        res.json({ ...activityData, summary });
        
    } catch (error) {
        console.error('❌ Error fetching user activity:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user profile with basic activity summary (Admin only)
router.get('/users/:userId/profile', verifyStaff, async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('🔍 Fetching profile for user:', userId);
        
        const dbConnected = await ensureConnected();
        if (!dbConnected) {
            return res.status(500).json({ message: 'Database connection error' });
        }

        // Get user basic info
        const user = await models.USER.findOne({ User_ID: userId })
            .select('-Password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get activity counts
        const EquipmentBooking = mongoose.model('EquipmentBooking');
        const VenueBooking = mongoose.model('VenueBooking');
        const Project = mongoose.model('Project');
        const StudentInterestGroup = mongoose.model('StudentInterestGroup');

        const [eqCount, venueCount, projCount, sigCount] = await Promise.all([
            EquipmentBooking.countDocuments({ user_id: userId }),
            VenueBooking.countDocuments({ user_id: userId }),
            Project.countDocuments({
                $or: [
                    { creator: userId },
                    { members: userId }
                ]
            }),
            StudentInterestGroup.countDocuments({ members: userId })
        ]);

        const profile = {
            ...user.toObject(),
            activityCounts: {
                equipmentBookings: eqCount,
                venueBookings: venueCount,
                projects: projCount,
                sigMemberships: sigCount
            }
        };

        console.log('✅ Profile data compiled for user:', userId);
        res.json(profile);
        
    } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Export user activity data (Admin only)
router.get('/users/:userId/activity/export', verifyStaff, async (req, res) => {
    try {
        const { userId } = req.params;
        const { format = 'csv', days = '30' } = req.query;
        
        console.log(`🔍 Exporting ${format} activity data for user:`, userId);
        
        const dbConnected = await ensureConnected();
        if (!dbConnected) {
            return res.status(500).json({ message: 'Database connection error' });
        }

        // Fetch user info
        const user = await models.USER.findOne({ User_ID: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Import activity models
        const EquipmentBooking = mongoose.model('EquipmentBooking');
        const VenueBooking = mongoose.model('VenueBooking');
        const Project = mongoose.model('Project');
        const StudentInterestGroup = mongoose.model('StudentInterestGroup');

        // Date filter
        let dateFilter = {};
        if (days !== 'all') {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
            dateFilter = { $gte: cutoffDate };
        }

        // Fetch all activities
        const [equipmentBookings, venueBookings, projects, sigs] = await Promise.all([
            EquipmentBooking.find({
                user_id: userId,
                ...(days !== 'all' && { eqm_booking_date: dateFilter })
            }).populate('equipment_id', 'eqm_name eqm_cat'),
            
            VenueBooking.find({
                user_id: userId,
                ...(days !== 'all' && { booking_date: dateFilter })
            }).populate('venue_id', 'venue_unit venue_type'),
            
            Project.find({
                $or: [{ creator: userId }, { members: userId }],
                ...(days !== 'all' && { createdAt: dateFilter })
            }),
            
            StudentInterestGroup.find({
                members: userId,
                ...(days !== 'all' && { createdAt: dateFilter })
            })
        ]);

        if (format === 'csv') {
            // Generate CSV
            const csvHeader = 'Date,Activity Type,Title,Details,Status\\n';
            let csvRows = [];

            // Equipment bookings
            equipmentBookings.forEach(booking => {
                csvRows.push([
                    booking.eqm_booking_date ? new Date(booking.eqm_booking_date).toISOString().split('T')[0] : '',
                    'Equipment Booking',
                    booking.equipment_id?.eqm_name || 'Unknown Equipment',
                    `Category: ${booking.equipment_id?.eqm_cat || 'N/A'}`,
                    booking.status || 'Unknown'
                ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
            });

            // Venue bookings
            venueBookings.forEach(booking => {
                csvRows.push([
                    booking.booking_date ? new Date(booking.booking_date).toISOString().split('T')[0] : '',
                    'Venue Booking',
                    booking.venue_id?.venue_unit || 'Unknown Venue',
                    `Type: ${booking.venue_id?.venue_type || 'N/A'}, Payment: $${booking.total_pay || 0}`,
                    booking.status || 'Confirmed'
                ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
            });

            // Projects
            projects.forEach(project => {
                const role = project.creator === userId ? 'Creator' : 'Member';
                csvRows.push([
                    project.createdAt ? new Date(project.createdAt).toISOString().split('T')[0] : '',
                    'Project',
                    project.name || 'Unnamed Project',
                    `Role: ${role}, Members: ${project.members?.length || 0}`,
                    project.status || 'Active'
                ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
            });

            // Student Interest Groups
            sigs.forEach(sig => {
                csvRows.push([
                    sig.createdAt ? new Date(sig.createdAt).toISOString().split('T')[0] : '',
                    'Student Interest Group',
                    sig.name || 'Unnamed SIG',
                    `Members: ${sig.members?.length || 0}`,
                    sig.status || 'Active'
                ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
            });

            const csvContent = csvHeader + csvRows.join('\\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="user_activity_${userId}_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvContent);

        } else if (format === 'json') {
            // Generate JSON export
            const exportData = {
                user: {
                    id: user.User_ID,
                    name: `${user.First_Name} ${user.Last_Name}`,
                    email: user.Email_Address,
                    role: user.User_Role
                },
                exportDate: new Date().toISOString(),
                dateRange: days === 'all' ? 'All time' : `Last ${days} days`,
                activities: {
                    equipmentBookings: equipmentBookings.map(b => ({
                        date: b.eqm_booking_date,
                        equipment: b.equipment_id?.eqm_name,
                        category: b.equipment_id?.eqm_cat,
                        status: b.status
                    })),
                    venueBookings: venueBookings.map(b => ({
                        date: b.booking_date,
                        venue: b.venue_id?.venue_unit,
                        type: b.venue_id?.venue_type,
                        payment: b.total_pay,
                        status: b.status
                    })),
                    projects: projects.map(p => ({
                        date: p.createdAt,
                        name: p.name,
                        role: p.creator === userId ? 'Creator' : 'Member',
                        memberCount: p.members?.length,
                        status: p.status
                    })),
                    studentInterestGroups: sigs.map(s => ({
                        date: s.createdAt,
                        name: s.name,
                        memberCount: s.members?.length,
                        status: s.status
                    }))
                },
                summary: {
                    totalEquipmentBookings: equipmentBookings.length,
                    totalVenueBookings: venueBookings.length,
                    totalProjects: projects.length,
                    totalSIGs: sigs.length,
                    grandTotal: equipmentBookings.length + venueBookings.length + projects.length + sigs.length
                }
            };

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="user_activity_${userId}_${new Date().toISOString().split('T')[0]}.json"`);
            res.json(exportData);

        } else {
            return res.status(400).json({ message: 'Unsupported export format. Use csv or json.' });
        }

    } catch (error) {
        console.error('❌ Error exporting user activity:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export let userRoutes = router;