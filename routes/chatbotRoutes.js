import express from 'express';
import axios from 'axios';
import { models } from '../server/database.js';
import { ensureConnected } from '../config/db.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Function to generate ATL-specific fallback responses
function generateATLFallbackResponse(userInput) {
    const messageLower = userInput.toLowerCase();
    
    if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('hey') || messageLower.includes('start')) {
        return "Hello! Welcome to the Arts Technology Lab at HKU. I'm here to help you learn about our facilities, workshops, and creative technology programs. What would you like to know?";
    } else if (messageLower.includes('workshop') || messageLower.includes('class') || messageLower.includes('course')) {
        return "We offer various workshops throughout the year covering creative coding, digital arts, interactive media, and emerging technologies. Our workshops are designed for both beginners and advanced practitioners. Would you like to know about upcoming workshops?";
    } else if (messageLower.includes('equipment') || messageLower.includes('facility') || messageLower.includes('lab') || messageLower.includes('space')) {
        return "Our lab is equipped with cutting-edge technology including 3D printers, VR/AR systems, digital media production tools, electronics prototyping equipment, and collaborative workspaces for creative projects. What specific equipment are you interested in?";
    } else if (messageLower.includes('program') || messageLower.includes('study') || messageLower.includes('learn')) {
        return "ATL offers programs that bridge art, technology, and innovation. We focus on creative coding, digital fabrication, interactive design, and interdisciplinary collaboration between arts and technology. What area interests you most?";
    } else if (messageLower.includes('help') || messageLower.includes('support') || messageLower.includes('guidance')) {
        return "I'm here to provide information about ATL's resources, upcoming events, workshop schedules, equipment booking, and how to get involved in our creative community. What specific help do you need?";
    } else if (messageLower.includes('booking') || messageLower.includes('reserve') || messageLower.includes('schedule')) {
        return "To book equipment or reserve space at ATL, please contact our lab staff or check our booking system. We have various time slots available for students and faculty. Would you like to know about our booking procedures?";
    } else if (messageLower.includes('location') || messageLower.includes('where') || messageLower.includes('address')) {
        return "The Arts Technology Lab is located at HKU. We're easily accessible and provide a creative environment for students and faculty to explore the intersection of art and technology. Would you like directions or more information about our location?";
    } else {
        return `Thank you for your question about "${userInput}". The Arts Technology Lab is a creative space where art meets technology. We offer workshops, equipment access, and collaborative opportunities. What specific aspect of ATL would you like to know more about?`;
    }
}

// Function to safely get HuggingFace API configuration
function getHuggingFaceConfig() {
    const config = {
        url: process.env.ML_API_URL || 
             process.env.HUGGINGFACE_API_URL || 
             'https://candyyetszyu-atl-chatbot-api.hf.space/chat',
        token: process.env.HUGGINGFACE_API_TOKEN,
        isConfigured: false
    };

    // Check if token is properly configured (not placeholder)
    if (config.token && 
        config.token !== 'hf_your_token_here_replace_with_actual_token' && 
        config.token.startsWith('hf_') && 
        config.token.length > 10) {
        config.isConfigured = true;
    }

    return config;
}

// Function to call HuggingFace API with proper error handling
async function callHuggingFaceAPI(message, sessionId) {
    const config = getHuggingFaceConfig();
    
    console.log('🤖 HuggingFace API Configuration:');
    console.log('   URL:', config.url);
    console.log('   Token configured:', config.isConfigured ? 'Yes' : 'No');
    console.log('   Environment:', process.env.NODE_ENV);
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (config.isConfigured) {
        headers['Authorization'] = `Bearer ${config.token}`;
        console.log('🔑 Using HuggingFace API token for authentication');
    } else {
        console.log('⚠️  No valid HuggingFace API token found - Space must be public');
        console.log('   To use private Spaces, set HUGGINGFACE_API_TOKEN in environment variables');
    }
    
    const payload = {
        message: message,
        session_id: sessionId
    };
    
    try {
        console.log('📡 Calling HuggingFace API...');
        const response = await axios.post(config.url, payload, {
            headers: headers,
            timeout: 30000 // 30 second timeout
        });
        
        console.log('✅ HuggingFace API response received');
        console.log('   Status:', response.status);
        console.log('   Response keys:', Object.keys(response.data));
        
        return {
            success: true,
            response: response.data.response || response.data.message || 'I apologize, but I received an unexpected response format.',
            data: response.data
        };
        
    } catch (error) {
        console.error('❌ HuggingFace API Error:');
        console.error('   Message:', error.message);
        console.error('   Status:', error.response?.status);
        console.error('   Status Text:', error.response?.statusText);
        console.error('   URL:', error.config?.url);
        
        if (error.response?.status === 401) {
            console.error('   🔐 Authentication failed - check your API token');
        } else if (error.response?.status === 403) {
            console.error('   🚫 Access forbidden - Space might be private without proper token');
        } else if (error.code === 'ECONNABORTED') {
            console.error('   ⏰ Request timeout - API might be slow or unavailable');
        } else if (error.code === 'ENOTFOUND') {
            console.error('   🌐 Network error - Cannot reach HuggingFace Space');
        }
        
        return {
            success: false,
            error: error.message,
            fallback: generateATLFallbackResponse(message)
        };
    }
}

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.User_ID; // Using User_ID to match database schema
        console.log('Decoded token:', decoded); // Debug log
        next();
    } catch (error) {
        console.error('Token verification error:', error); // Debug log
        return res.status(401).json({ message: 'Invalid token' });
    }
};

function exportChatToFile(chat) {
    try {
        // Skip file export in serverless environments (Vercel)
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            console.log('Skipping file export in serverless environment');
            return;
        }
        
        const exportDir = '/app/client_questions';
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }
        const filename = `${chat.User_Context?.Nickname || 'anonymous'}_${chat.Chat_ID}.json`;
        const filepath = path.join(exportDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(chat, null, 2), 'utf-8');
        console.log(`Chat exported to ${filepath}`);
    } catch (err) {
        console.error('Failed to export chat:', err);
    }
}

// Create a new chat
router.post('/chat', verifyToken, async (req, res) => {
    try {
        // Ensure MongoDB connection
        await ensureConnected();
        
        console.log('Creating chat for user ID:', req.userId); // Debug log
        const user = await models.USER.findOne({ User_ID: req.userId });
        console.log('Found user:', user ? 'Yes' : 'No'); // Debug log

        if (!user) {
            console.log('User not found with ID:', req.userId); // Debug log
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate unique Chat_ID
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 7);
        const Chat_ID = `CHAT_${timestamp}${randomStr}`;

        // Create initial message if provided
        let initialMessage = null;
        let botWelcomeMessage = null;
        
        if (req.body.initialMessage) {
            initialMessage = {
                Text: req.body.initialMessage,
                Is_Bot: false,
                Timestamp: new Date()
            };

            // Get bot response for initial message
            const apiResult = await callHuggingFaceAPI(req.body.initialMessage, Chat_ID);
            
            if (apiResult.success) {
                botWelcomeMessage = {
                    Text: apiResult.response,
                    Is_Bot: true,
                    Timestamp: new Date()
                };
            } else {
                console.log('Using fallback response for initial message');
                botWelcomeMessage = {
                    Text: apiResult.fallback,
                    Is_Bot: true,
                    Timestamp: new Date()
                };
            }
        }

        const messages = [];
        if (initialMessage) messages.push(initialMessage);
        if (botWelcomeMessage) messages.push(botWelcomeMessage);

        const chat = new models.CHAT({
            Chat_ID,
            User_ID: user.User_ID,
            User_Context: {
                Nickname: user.Nickname,
                First_Name: user.First_Name,
                Last_Name: user.Last_Name,
                Title: user.Title,
                Gender: user.Gender,
                Email_Address: user.Email_Address,
                Tel: user.Tel,
                User_Role: user.User_Role
            },
            Messages: messages
        });

        await chat.save();
        exportChatToFile(chat);
        res.status(201).json(chat);
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ message: 'Error creating chat session' });
    }
});

// Get chat history
router.get('/chat/:Chat_ID', verifyToken, async (req, res) => {
    try {
        const chat = await models.CHAT.findOne({
            Chat_ID: req.params.Chat_ID,
            User_ID: req.userId
        });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        res.json(chat);
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ message: 'Error fetching chat history' });
    }
});

// Send a message
router.post('/chat/:Chat_ID/message', verifyToken, async (req, res) => {
    try {
        // Ensure MongoDB connection
        await ensureConnected();
        
        const { Text: messageText, detailed: isDetailed } = req.body;
        const chat = await models.CHAT.findOne({
            Chat_ID: req.params.Chat_ID,
            User_ID: req.userId
        });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Add user message
        chat.Messages.push({
            Text: messageText,
            Is_Bot: false,
            Timestamp: new Date()
        });

        // Call HuggingFace API for bot response
        const apiResult = await callHuggingFaceAPI(messageText, req.params.Chat_ID);
        
        if (apiResult.success) {
            // Add bot response
            chat.Messages.push({
                Text: apiResult.response,
                Is_Bot: true,
                Timestamp: new Date()
            });
        } else {
            console.log('Using fallback response for user message');
            // Add bot response
            chat.Messages.push({
                Text: apiResult.fallback,
                Is_Bot: true,
                Timestamp: new Date()
            });
        }

        await chat.save();
        exportChatToFile(chat);
        res.json(chat);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
});

// Get all chats for a user
router.get('/chat/user/:user_id', verifyToken, async (req, res) => {
    try {
        const { user_id } = req.params;
        const chats = await models.CHAT.find({ User_ID: user_id })
            .sort({ updatedAt: -1 }) // Sort by most recent first
            .exec();
        
        res.status(200).json(chats);
    } catch (error) {
        console.error('Error fetching user chats:', error);
        res.status(500).json({ message: 'Error fetching chat history', error: error.message });
    }
});

// Get available analyses for a chat
router.get('/chat/:Chat_ID/analyses', verifyToken, async (req, res) => {
    try {
        const { Chat_ID } = req.params;
        console.log('Fetching analyses for chat:', Chat_ID);
        
        const chat = await models.CHAT.findOne({ Chat_ID });
        if (!chat) {
            console.log('Chat not found:', Chat_ID);
            return res.status(404).json({ message: 'Chat not found' });
        }

        console.log('Found chat with analyses:', chat.User_Context?.trajectory_analyses?.length || 0);
        
        // Return formatted list of available analyses
        const analyses = chat.User_Context.trajectory_analyses
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(analysis => ({
                id: analysis.id,
                timestamp: analysis.timestamp,
                content: analysis.content,
                preview: analysis.content.substring(0, 100) + '...'
            }));

        console.log('Returning analyses:', analyses.length);
        res.status(200).json(analyses);
    } catch (error) {
        console.error('Error fetching analyses:', error);
        res.status(500).json({ message: 'Error fetching analyses', error: error.message });
    }
});

// Submit chat survey
router.post('/chat/:Chat_ID/survey', verifyToken, async (req, res) => {
    try {
        const { Chat_ID } = req.params;
        const surveyData = req.body;
        
        console.log('Survey submission for chat:', Chat_ID);
        console.log('Survey data:', surveyData);

        // Verify the chat exists and belongs to the user
        const chat = await models.CHAT.findOne({
            Chat_ID: Chat_ID,
            User_ID: req.userId
        });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Calculate chat duration in seconds
        const chatDuration = chat.updatedAt ? 
            Math.floor((new Date(chat.updatedAt) - new Date(chat.createdAt)) / 1000) : 0;

        // Create survey data for MongoDB
        const surveyDataForDB = {
            Chat_ID: Chat_ID,
            User_ID: chat.User_ID,
            User_Context: chat.User_Context,
            Survey_Responses: {
                overallExperience: {
                    question: 'How satisfied are you with today\'s conversation experience?',
                    rating: surveyData.responses?.overallExperience?.rating || null
                },
                suggestions: {
                    question: 'Is there anything we can do better?',
                    response: surveyData.responses?.suggestions?.response || ''
                },
                primaryIntent: {
                    question: 'What information were you primarily looking for today?',
                    response: surveyData.responses?.primaryIntent?.response || ''
                }
            },
            Export_Metadata: {
                exported_at: new Date(),
                total_messages: chat.Messages.length,
                has_survey: true,
                survey_rating: surveyData.responses?.overallExperience?.rating || null,
                survey_suggestions: surveyData.responses?.suggestions?.response || '',
                survey_primary_intent: surveyData.responses?.primaryIntent?.response || '',
                chat_duration: chatDuration
            },
            Chat_Messages: chat.Messages,
            Created_At: new Date(),
            Updated_At: new Date()
        };

        // Save survey to MongoDB
        const survey = new models.SURVEY(surveyDataForDB);
        await survey.save();
        
        console.log(`Survey saved to MongoDB with ID: ${survey._id}`);

        res.status(200).json({ 
            message: 'Survey submitted successfully',
            surveyId: survey._id
        });
    } catch (error) {
        console.error('Error submitting survey:', error);
        res.status(500).json({ message: 'Error submitting survey', error: error.message });
    }
});



// Get all surveys for admin management  
router.get('/surveys', verifyToken, async (req, res) => {
    try {
        // Ensure MongoDB connection
        await ensureConnected();
        
        // Check if user has admin privileges
        const user = await models.USER.findOne({ User_ID: req.userId });
        const staffRoles = ['ATL_ADMIN', 'ATL_Member_HKU_Staff', 'Non_ATL_HKU_Staff'];
        if (!user || !staffRoles.includes(user.User_Role)) {
            return res.status(403).json({ message: 'Admin privileges required' });
        }

        // Get surveys from MongoDB - only complete survey records
        const allSurveys = await models.SURVEY.find({})
            .sort({ Created_At: -1 })
            .exec();
        
        // Filter to only include surveys with the required complete structure
        const surveys = allSurveys.filter(survey => {
            return survey.Chat_ID && 
                   survey.User_ID && 
                   survey.User_Context && 
                   survey.Survey_Responses && 
                   survey.Export_Metadata && 
                   survey.Chat_Messages && 
                   Array.isArray(survey.Chat_Messages) &&
                   survey.Created_At &&
                   survey.Updated_At;
        });
        
        console.log(`Survey filtering: ${allSurveys.length} total, ${surveys.length} complete surveys`);

        const stats = {
            totalSurveys: surveys.length,
            averageRating: 0,
            ratingDistribution: {},
            surveysWithComments: 0,
            thisMonth: 0,
            commonThemes: []
        };

        // Process survey data with enhanced user information
        const processedSurveys = await Promise.all(surveys.map(async (survey) => {
            // Get full user information from database
            const user = await models.USER.findOne({ User_ID: survey.User_ID });
            
            return {
                _id: survey._id,
                Chat_ID: survey.Chat_ID,
                User_ID: survey.User_ID,
                User_Context: {
                    ...survey.User_Context,
                    // Add full user information
                    First_Name: user?.First_Name || '',
                    Last_Name: user?.Last_Name || '',
                    Email_Address: user?.Email_Address || survey.User_Context?.Email_Address || '',
                    Nickname: user?.Nickname || survey.User_Context?.Nickname || 'Unknown'
                },
                Survey_Responses: survey.Survey_Responses,
                Export_Metadata: survey.Export_Metadata,
                Created_At: survey.Created_At,
                Updated_At: survey.Updated_At
            };
        }));

        // Calculate stats
        let totalRating = 0;
        let ratingCount = 0;
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        surveys.forEach(survey => {
            const rating = survey.Export_Metadata?.survey_rating || survey.Survey_Responses?.overallExperience?.rating;
            if (rating) {
                totalRating += rating;
                ratingCount++;
                stats.ratingDistribution[rating] = (stats.ratingDistribution[rating] || 0) + 1;
            }
            
            // Check for comments
            const hasComments = survey.Export_Metadata?.survey_suggestions?.trim() || 
                               survey.Export_Metadata?.survey_primary_intent?.trim() ||
                               survey.Survey_Responses?.suggestions?.response?.trim() ||
                               survey.Survey_Responses?.primaryIntent?.response?.trim();
            if (hasComments) {
                stats.surveysWithComments++;
            }
            
            // Check if from this month
            const surveyDate = new Date(survey.Created_At);
            if (surveyDate.getMonth() === currentMonth && surveyDate.getFullYear() === currentYear) {
                stats.thisMonth++;
            }
        });

        if (ratingCount > 0) {
            stats.averageRating = totalRating / ratingCount;
        }

        res.status(200).json({ surveys: processedSurveys, stats });
    } catch (error) {
        console.error('Error fetching surveys:', error);
        res.status(500).json({ message: 'Error fetching surveys', error: error.message });
    }
});

// Export surveys to CSV
router.post('/surveys/export', verifyToken, async (req, res) => {
    try {
        // Ensure MongoDB connection
        await ensureConnected();
        
        // Check if user has admin privileges
        const user = await models.USER.findOne({ User_ID: req.userId });
        const staffRoles = ['ATL_ADMIN', 'ATL_Member_HKU_Staff', 'Non_ATL_HKU_Staff'];
        if (!user || !staffRoles.includes(user.User_Role)) {
            return res.status(403).json({ message: 'Admin privileges required' });
        }

        const { filters = {} } = req.body;
        
        // Build query based on filters
        let query = {};
        if (filters.rating) {
            query['Export_Metadata.survey_rating'] = filters.rating;
        }
        if (filters.dateFrom || filters.dateTo) {
            query.Created_At = {};
            if (filters.dateFrom) {
                query.Created_At.$gte = new Date(filters.dateFrom);
            }
            if (filters.dateTo) {
                query.Created_At.$lte = new Date(filters.dateTo);
            }
        }

        const allSurveys = await models.SURVEY.find(query).sort({ Created_At: -1 });

        // Filter to only include complete survey records
        const surveys = allSurveys.filter(survey => {
            return survey.Chat_ID && 
                   survey.User_ID && 
                   survey.User_Context && 
                   survey.Survey_Responses && 
                   survey.Export_Metadata && 
                   survey.Chat_Messages && 
                   Array.isArray(survey.Chat_Messages) &&
                   survey.Created_At &&
                   survey.Updated_At;
        });

        // Filter surveys with comments if requested
        let filteredSurveys = surveys;
        if (filters.hasComments) {
            filteredSurveys = surveys.filter(survey => 
                survey.Export_Metadata?.survey_suggestions?.trim() || 
                survey.Export_Metadata?.survey_primary_intent?.trim()
            );
        }

        // Process surveys with enhanced user information for CSV export
        const processedSurveys = await Promise.all(filteredSurveys.map(async (survey) => {
            // Get full user information from database
            const user = await models.USER.findOne({ User_ID: survey.User_ID });
            
            return {
                ...survey.toObject(),
                User_Context: {
                    ...survey.User_Context,
                    First_Name: user?.First_Name || '',
                    Last_Name: user?.Last_Name || '',
                    Email_Address: user?.Email_Address || survey.User_Context?.Email_Address || '',
                    Nickname: user?.Nickname || survey.User_Context?.Nickname || 'Unknown'
                }
            };
        }));

        // Generate CSV content
        const csvHeaders = [
            'Chat_ID', 'User_Name', 'User_Email', 'Submitted_At', 'Rating', 
            'Suggestions', 'Primary_Intent', 'Total_Messages', 'Chat_Duration'
        ];
        
        const csvContent = [
            csvHeaders.join(','),
            ...processedSurveys.map(survey => [
                survey.Chat_ID,
                `"${survey.User_Context?.Last_Name && survey.User_Context?.First_Name 
                    ? `${survey.User_Context.Last_Name} ${survey.User_Context.First_Name}`
                    : 'Unknown'}"`,
                `"${survey.User_Context?.Email_Address || ''}"`,
                survey.Created_At.toISOString(),
                survey.Export_Metadata?.survey_rating || '',
                `"${(survey.Export_Metadata?.survey_suggestions || '').replace(/"/g, '""')}"`,
                `"${(survey.Export_Metadata?.survey_primary_intent || '').replace(/"/g, '""')}"`,
                survey.Export_Metadata?.total_messages || 0,
                survey.Export_Metadata?.chat_duration || 0
            ].join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=chat_surveys_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);
    } catch (error) {
        console.error('Error exporting surveys:', error);
        res.status(500).json({ message: 'Error exporting surveys', error: error.message });
    }
});

// Delete survey by ID
router.delete('/surveys/:id', verifyToken, async (req, res) => {
    try {
        // Ensure MongoDB connection
        await ensureConnected();

        // Check if user has admin privileges
        const user = await models.USER.findOne({ User_ID: req.userId });
        const staffRoles = ['ATL_ADMIN', 'ATL_Member_HKU_Staff', 'Non_ATL_HKU_Staff'];
        if (!user || !staffRoles.includes(user.User_Role)) {
            return res.status(403).json({ message: 'Admin privileges required' });
        }

        const { id } = req.params;
        
        // Check if survey exists and has complete structure
        const survey = await models.SURVEY.findById(id);
        
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        
        // Validate survey has complete structure
        const isComplete = survey.Chat_ID && 
                          survey.User_ID && 
                          survey.User_Context && 
                          survey.Survey_Responses && 
                          survey.Export_Metadata && 
                          survey.Chat_Messages && 
                          Array.isArray(survey.Chat_Messages) &&
                          survey.Created_At &&
                          survey.Updated_At;
        
        if (!isComplete) {
            return res.status(404).json({ message: 'Survey has incomplete data structure and cannot be deleted' });
        }
        
        // Delete survey from MongoDB
        const deletedSurvey = await models.SURVEY.findByIdAndDelete(id);

        console.log(`Survey deleted: ${id}`);
        res.status(200).json({ 
            message: 'Survey deleted successfully',
            deletedSurvey: {
                Chat_ID: deletedSurvey.Chat_ID,
                User_Context: deletedSurvey.User_Context,
                Created_At: deletedSurvey.Created_At
            }
        });
    } catch (error) {
        console.error('Error deleting survey:', error);
        res.status(500).json({ message: 'Error deleting survey', error: error.message });
    }
});

// Get survey by ID
router.get('/surveys/:id', verifyToken, async (req, res) => {
    try {
        // Ensure MongoDB connection
        await ensureConnected();

        // Check if user has admin privileges
        const user = await models.USER.findOne({ User_ID: req.userId });
        const staffRoles = ['ATL_ADMIN', 'ATL_Member_HKU_Staff', 'Non_ATL_HKU_Staff'];
        if (!user || !staffRoles.includes(user.User_Role)) {
            return res.status(403).json({ message: 'Admin privileges required' });
        }

        const { id } = req.params;
        
        // Get survey from MongoDB
        const survey = await models.SURVEY.findById(id);
        
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        
        // Validate survey has complete structure
        const isComplete = survey.Chat_ID && 
                          survey.User_ID && 
                          survey.User_Context && 
                          survey.Survey_Responses && 
                          survey.Export_Metadata && 
                          survey.Chat_Messages && 
                          Array.isArray(survey.Chat_Messages) &&
                          survey.Created_At &&
                          survey.Updated_At;
        
        if (!isComplete) {
            return res.status(404).json({ message: 'Survey has incomplete data structure' });
        }

        // Get full user information from database
        const surveyUser = await models.USER.findOne({ User_ID: survey.User_ID });
        
        // Process survey data for frontend with enhanced user information
        const processedSurvey = {
            _id: survey._id,
            Chat_ID: survey.Chat_ID,
            User_ID: survey.User_ID,
            User_Context: {
                ...survey.User_Context,
                // Add full user information
                First_Name: surveyUser?.First_Name || '',
                Last_Name: surveyUser?.Last_Name || '',
                Email_Address: surveyUser?.Email_Address || survey.User_Context?.Email_Address || '',
                Nickname: surveyUser?.Nickname || survey.User_Context?.Nickname || 'Unknown'
            },
            Survey_Responses: survey.Survey_Responses,
            Export_Metadata: survey.Export_Metadata,
            Chat_Messages: survey.Chat_Messages,
            Created_At: survey.Created_At,
            Updated_At: survey.Updated_At
        };

        res.status(200).json({ survey: processedSurvey });
    } catch (error) {
        console.error('Error fetching survey:', error);
        res.status(500).json({ message: 'Error fetching survey', error: error.message });
    }
});

// Update survey by ID
router.put('/surveys/:id', verifyToken, async (req, res) => {
    try {
        // Ensure MongoDB connection
        await ensureConnected();

        // Check if user has admin privileges
        const user = await models.USER.findOne({ User_ID: req.userId });
        const staffRoles = ['ATL_ADMIN', 'ATL_Member_HKU_Staff', 'Non_ATL_HKU_Staff'];
        if (!user || !staffRoles.includes(user.User_Role)) {
            return res.status(403).json({ message: 'Admin privileges required' });
        }

        const { id } = req.params;
        const updates = req.body;
        
        // Check if survey exists and has complete structure
        const existingSurvey = await models.SURVEY.findById(id);
        
        if (!existingSurvey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        
        // Validate survey has complete structure
        const isComplete = existingSurvey.Chat_ID && 
                          existingSurvey.User_ID && 
                          existingSurvey.User_Context && 
                          existingSurvey.Survey_Responses && 
                          existingSurvey.Export_Metadata && 
                          existingSurvey.Chat_Messages && 
                          Array.isArray(existingSurvey.Chat_Messages) &&
                          existingSurvey.Created_At &&
                          existingSurvey.Updated_At;
        
        if (!isComplete) {
            return res.status(404).json({ message: 'Survey has incomplete data structure and cannot be updated' });
        }
        
        // Update survey in MongoDB
        const updatedSurvey = await models.SURVEY.findByIdAndUpdate(
            id, 
            { 
                ...updates,
                Updated_At: new Date()
            }, 
            { new: true }
        );

        console.log(`Survey updated: ${id}`);
        res.status(200).json({ 
            message: 'Survey updated successfully',
            survey: {
                _id: updatedSurvey._id,
                Chat_ID: updatedSurvey.Chat_ID,
                User_Context: updatedSurvey.User_Context,
                Survey_Responses: updatedSurvey.Survey_Responses,
                Export_Metadata: updatedSurvey.Export_Metadata,
                Created_At: updatedSurvey.Created_At,
                Updated_At: updatedSurvey.Updated_At
            }
        });
    } catch (error) {
        console.error('Error updating survey:', error);
        res.status(500).json({ message: 'Error updating survey', error: error.message });
    }
});

export default router;