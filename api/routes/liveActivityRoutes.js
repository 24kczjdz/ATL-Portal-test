import express from 'express';
import jwt from 'jsonwebtoken';
import LiveActivity from '../models/LiveActivity.js';
import LiveParticipant from '../models/LiveParticipant.js';
import LiveQAQuestion from '../models/LiveQuestion.js';
import LivePoll from '../models/LivePoll.js';

const router = express.Router();

// Live routes request logger (debug)
router.use((req, _res, next) => {
  if (req.originalUrl.includes('/polls')) {
    console.log('🛰️ Live route hit:', {
      method: req.method,
      url: req.originalUrl,
      contentType: req.headers['content-type'],
      hasAuth: !!req.headers['authorization']
    });
  }
  next();
});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    console.log('🔍 Authenticated user from token:', user);
    req.user = user;
    next();
  });
};

// Middleware to check host permissions
const checkHostPermissions = async (req, res, next) => {
  const userRole = req.user?.User_Role || req.user?.Role;
  
  // Standardized role list - ATL_MEMBER replaced with specific ATL member roles
  const allowedRoles = [
    'ATL_ADMIN',
    'ATL_Member_HKU_Staff',
    'ATL_Member_HKU_Student', 
    'ATL_Member_General',
    'Non_ATL_HKU_Staff',
    'Non_ATL_HKU_Student',
    'Non_ATL_General'
  ];
  
  console.log('🔍 Checking host permissions:');
  console.log('- User Role:', userRole);
  console.log('- User object:', req.user);
  console.log('- Allowed roles:', allowedRoles);
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    console.log('❌ Permission denied for role:', userRole);
    return res.status(403).json({ 
      error: 'Insufficient permissions to host activities',
      userRole: userRole,
      allowedRoles: allowedRoles
    });
  }
  
  console.log('✅ Permission granted for role:', userRole);
  next();
};

// Create new live activity
router.post('/activities', authenticateToken, checkHostPermissions, async (req, res) => {
  try {
    const { title, description, questions, settings = {} } = req.body;
    
    const pin = LiveActivity.generatePin();
    
    const activity = new LiveActivity({
      Act_ID: `live_${Date.now()}`,
      title,
      description,
      pin,
      hostIds: [req.user.User_ID],
      questions: questions.map((q, index) => ({
        id: `q_${index}`,
        ...q
      })),
      settings: {
        allowAnonymous: true,
        allowComments: true,
        allowQuestions: true,
        showResultsLive: true,
        moderateQA: false,
        ...settings
      }
    });

    await activity.save();
    
    res.json({
      success: true,
      activity: {
        id: activity.Act_ID,
        pin: activity.pin,
        title: activity.title,
        description: activity.description,
        isLive: activity.isLive
      }
    });

  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// Update activity
router.put('/activities/:activityId', authenticateToken, checkHostPermissions, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { title, description, questions, settings } = req.body;
    
    const activity = await LiveActivity.findOne({ Act_ID: activityId });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (!activity.hostIds.includes(req.user.User_ID)) {
      return res.status(403).json({ error: 'Not authorized to edit this activity' });
    }

    // Update activity fields
    activity.title = title;
    activity.description = description;
    activity.questions = questions.map((q, index) => ({
      id: q.id || `q_${index}`,
      ...q
    }));
    activity.settings = {
      ...activity.settings,
      ...settings
    };

    await activity.save();
    
    res.json({
      success: true,
      activity: {
        Act_ID: activity.Act_ID,
        title: activity.title,
        description: activity.description,
        questions: activity.questions,
        settings: activity.settings,
        isLive: activity.isLive
      }
    });

  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// Get activity by PIN (for participants)
router.get('/activities/pin/:pin', async (req, res) => {
  try {
    const { pin } = req.params;
    
    console.log('🔍 Looking for activity with PIN:', pin);
    
    // First check if activity exists
    const activity = await LiveActivity.findOne({ pin });
    console.log('📋 Activity search result:', activity ? 'Found' : 'Not found');
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    // Check if activity is live
    if (!activity.isLive) {
      console.log('📋 Activity exists but not live:', { isLive: activity.isLive, title: activity.title });
      return res.status(404).json({ error: 'Activity not live' });
    }

    // Get current question
    const currentQuestion = activity.questions[activity.currentQuestionIndex];
    
    // Get participant count
    const participantCount = await LiveParticipant.countDocuments({ 
      activityId: activity.Act_ID,
      isConnected: true 
    });

    console.log('✅ Returning activity data:', { 
      id: activity.Act_ID, 
      title: activity.title, 
      isLive: activity.isLive 
    });

    res.json({
      activity: {
        id: activity.Act_ID,
        title: activity.title,
        description: activity.description,
        currentQuestionIndex: activity.currentQuestionIndex,
        currentQuestion,
        totalQuestions: activity.questions.length,
        settings: activity.settings,
        participantCount,
        hostIds: activity.hostIds, // Add missing hostIds field
        pin: activity.pin // Add PIN for reference
      }
    });

  } catch (error) {
    console.error('❌ Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Get host's activities
router.get('/activities/host', authenticateToken, checkHostPermissions, async (req, res) => {
  try {
    const activities = await LiveActivity.find({ 
      hostIds: req.user.User_ID 
    }).sort({ createdAt: -1 });

    res.json({ activities });

  } catch (error) {
    console.error('Error fetching host activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Start/Stop activity
router.patch('/activities/:activityId/toggle', authenticateToken, checkHostPermissions, async (req, res) => {
  try {
    const { activityId } = req.params;
    
    const activity = await LiveActivity.findOne({ Act_ID: activityId });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (!activity.hostIds.includes(req.user.User_ID)) {
      return res.status(403).json({ error: 'Not authorized to control this activity' });
    }

    activity.isLive = !activity.isLive;
    if (activity.isLive) {
      activity.currentQuestionIndex = 0;
    }
    
    await activity.save();

    res.json({ 
      success: true, 
      isLive: activity.isLive,
      currentQuestionIndex: activity.currentQuestionIndex
    });

  } catch (error) {
    console.error('Error toggling activity:', error);
    res.status(500).json({ error: 'Failed to toggle activity' });
  }
});

// (Removed old navigate endpoint that used direction-only logic)

// Join activity as participant
router.post('/activities/:activityId/join', authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { nickname, participateAnonymously = false } = req.body;
    
    const activity = await LiveActivity.findOne({ Act_ID: activityId, isLive: true });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found or not live' });
    }

    // Check if participant already exists (using user ID since login is required)
    let participant = await LiveParticipant.findOne({
      activityId,
      userId: req.user.User_ID
    });

    if (!participant) {
      participant = new LiveParticipant({
        activityId,
        userId: req.user.User_ID,
        nickname: nickname || req.user.First_Name || req.user.Nickname,
        isAnonymous: participateAnonymously, // Use the participateAnonymously flag
        isConnected: true
      });
    } else {
      participant.isConnected = true;
      participant.lastActivity = new Date();
      participant.isAnonymous = participateAnonymously; // Update anonymous preference
      if (nickname) {
        participant.nickname = nickname;
      }
    }

    await participant.save();

    // Update participant count
    const participantCount = await LiveParticipant.countDocuments({ 
      activityId,
      isConnected: true 
    });
    
    activity.analytics.totalParticipants = Math.max(
      activity.analytics.totalParticipants, 
      participantCount
    );
    await activity.save();

    res.json({ 
      success: true, 
      participantId: participant._id,
      currentQuestion: activity.questions[activity.currentQuestionIndex],
      currentQuestionIndex: activity.currentQuestionIndex
    });

  } catch (error) {
    console.error('Error joining activity:', error);
    res.status(500).json({ error: 'Failed to join activity' });
  }
});

// Get participant info
router.get('/participants/:participantId', authenticateToken, async (req, res) => {
  try {
    const { participantId } = req.params;
    
    const participant = await LiveParticipant.findById(participantId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Verify the participant belongs to the authenticated user
    if (participant.userId !== req.user.User_ID) {
      return res.status(403).json({ error: 'Not authorized to access this participant' });
    }

    res.json({ 
      participant: {
        id: participant._id,
        nickname: participant.nickname,
        isAnonymous: participant.isAnonymous,
        joinedAt: participant.joinedAt
      }
    });

  } catch (error) {
    console.error('Error fetching participant info:', error);
    res.status(500).json({ error: 'Failed to fetch participant info' });
  }
});

// Submit response
router.post('/activities/:activityId/responses', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { participantId, questionId, questionIndex, answer, responseTime = 0 } = req.body;

    const participant = await LiveParticipant.findById(participantId);
    if (!participant || participant.activityId !== activityId) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Remove existing response for this question
    participant.responses = participant.responses.filter(r => r.questionIndex !== questionIndex);
    
    // Add new response
    participant.responses.push({
      questionId,
      questionIndex,
      answer,
      responseTime,
      timestamp: new Date()
    });

    await participant.save();

    // Fast, non-blocking analytics update to avoid timeouts during submissions
    // Increment total responses atomically instead of running an expensive aggregation
    LiveActivity.updateOne(
      { Act_ID: activityId },
      { $inc: { 'analytics.totalResponses': 1 } }
    ).catch((err) => {
      console.warn('Non-blocking analytics update failed:', err?.message);
    });

    // Respond immediately to keep the submit fast; analytics and word cloud are computed on GET /results
    res.json({ success: true });

  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Get live results for current question or poll
router.get('/activities/:activityId/results', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { questionIndex } = req.query;
    
    const activity = await LiveActivity.findOne({ Act_ID: activityId });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const qIndex = questionIndex !== undefined ? parseInt(questionIndex) : activity.currentQuestionIndex;
    const totalQuestions = activity.questions.length;
    
    // Check if this is a question or a poll
    if (qIndex < totalQuestions) {
      // This is a question
      const question = activity.questions[qIndex];
      
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Get all responses for this question
      const participants = await LiveParticipant.find({ 
        activityId,
        'responses.questionIndex': qIndex 
      });

      const responses = participants.flatMap(p => 
        p.responses
          .filter(r => r.questionIndex === qIndex)
          .map(r => ({
            participantId: p._id,
            nickname: p.nickname,
            answer: r.answer,
            responseTime: r.responseTime,
            timestamp: r.timestamp
          }))
      );

      // Calculate analytics based on question type
      let analytics = {
        totalResponses: responses.length,
        averageResponseTime: 0,
        answerCounts: {},
        wordCloud: []
      };

      if (responses.length > 0) {
        analytics.averageResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;

        if (question.type === 'MultiChoice' || question.type === 'MultiVote') {
          // Count option frequencies
          question.options.forEach(option => {
            analytics.answerCounts[option] = responses.filter(r => r.answer === option).length;
          });
        } else if (question.type === 'OpenText') {
          // Create word frequency map for word cloud
          const wordMap = {};
          responses.forEach(r => {
            const words = r.answer.toLowerCase().split(/\s+/);
            words.forEach(word => {
              if (word.length > 2) { // Ignore short words
                wordMap[word] = (wordMap[word] || 0) + 1;
              }
            });
          });
          
          analytics.wordCloud = Object.entries(wordMap)
            .map(([word, count]) => ({ text: word, value: count }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 50); // Top 50 words
        }
      }

      return res.json({
        question,
        responses: activity.settings.showResultsLive ? responses : [],
        analytics
      });
    } else {
      // This is a poll
      const pollIndex = qIndex - totalQuestions;
      
      // Get all polls for this activity
      const polls = await LivePoll.find({ 
        activityId,
        isActive: true 
      }).sort({ createdAt: -1 });
      
      const poll = polls[pollIndex];
      
      if (!poll) {
        return res.status(404).json({ error: 'Poll not found' });
      }
      
      // Get poll results
      const pollResults = await poll.getResults();
      
      return res.json({
        poll,
        results: pollResults,
        analytics: {
          totalVotes: pollResults.totalVotes,
          isActive: poll.isActive,
          expiresAt: poll.expiresAt
        }
      });
    }

  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Reaction endpoints

// Submit reaction
router.post('/activities/:activityId/participants/:participantId/react', authenticateToken, async (req, res) => {
  try {
    const { activityId, participantId } = req.params;
    const { questionIndex, type } = req.body;
    
    console.log('🎭 Reaction submission:', {
      activityId,
      participantId,
      questionIndex,
      type,
      timestamp: new Date().toISOString()
    });

    // Verify participant exists and belongs to activity
    const participant = await LiveParticipant.findById(participantId);
    if (!participant) {
      console.error('❌ Participant not found:', participantId);
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.activityId !== activityId) {
      console.error('❌ Participant not in activity:', { participantId, activityId, participantActivity: participant.activityId });
      return res.status(403).json({ error: 'Participant not in this activity' });
    }

    // Validate reaction type
    const validTypes = ['like', 'love', 'laugh', 'wow', 'confused', 'clap'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    // Check if participant already reacted to this question
    const existingReaction = participant.reactions.find(
      r => r.questionIndex === questionIndex
    );

    if (existingReaction) {
      // Update existing reaction
      existingReaction.type = type;
      existingReaction.timestamp = new Date();
    } else {
      // Add new reaction
      participant.reactions.push({
        questionIndex,
        type,
        timestamp: new Date()
      });
    }

    await participant.save();

    console.log('✅ Reaction submitted successfully:', {
      participantId,
      questionIndex,
      type,
      nickname: participant.nickname
    });

    res.status(200).json({ 
      message: 'Reaction submitted successfully',
      reaction: { questionIndex, type }
    });

  } catch (error) {
    console.error('❌ Error submitting reaction:', error);
    res.status(500).json({ error: 'Failed to submit reaction' });
  }
});

// Get reactions for a question
router.get('/activities/:activityId/questions/:questionIndex/reactions', async (req, res) => {
  try {
    const { activityId, questionIndex } = req.params;
    
    // Get all participants for this activity
    const participants = await LiveParticipant.find({ activityId });
    
    // Aggregate reactions by type
    const reactionCounts = {
      like: 0,
      love: 0,
      laugh: 0,
      wow: 0,
      confused: 0,
      clap: 0
    };

    const reactionDetails = [];

    participants.forEach(participant => {
      const reaction = participant.reactions.find(
        r => r.questionIndex === parseInt(questionIndex)
      );
      
      if (reaction) {
        reactionCounts[reaction.type]++;
        reactionDetails.push({
          participantId: participant._id,
          nickname: participant.isAnonymous ? 'Anonymous' : participant.nickname,
          type: reaction.type,
          timestamp: reaction.timestamp
        });
      }
    });

    res.json({
      questionIndex: parseInt(questionIndex),
      counts: reactionCounts,
      total: reactionDetails.length,
      details: reactionDetails
    });

  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

// Q&A endpoints

// Submit question
router.post('/activities/:activityId/questions', authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { participantId, question } = req.body;

    console.log('🔐 Q&A submission request:', {
      activityId,
      participantId,
      questionLength: question?.length,
      userFromToken: req.user?.User_ID,
      timestamp: new Date().toISOString()
    });

    const participant = await LiveParticipant.findById(participantId);
    if (!participant) {
      console.error('❌ Participant not found:', participantId);
      return res.status(404).json({ error: 'Participant not found' });
    }

    console.log('🔍 Participant verification:', {
      participantUserId: participant.userId,
      tokenUserId: req.user.User_ID,
      match: participant.userId === req.user.User_ID
    });

    // Verify the participant belongs to the authenticated user
    if (participant.userId !== req.user.User_ID) {
      console.error('❌ Participant user mismatch:', {
        participantUserId: participant.userId,
        tokenUserId: req.user.User_ID
      });
      return res.status(403).json({ error: 'Not authorized to submit questions for this participant' });
    }

    const qaQuestion = new LiveQAQuestion({
      id: `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      activityId,
      participantId: participant._id,
      nickname: participant.isAnonymous ? 'Anonymous' : participant.nickname,
      isAnonymous: participant.isAnonymous,
      question
    });

    await qaQuestion.save();
    
    console.log('✅ Q&A question saved successfully:', qaQuestion.id);
    res.json({ success: true, questionId: qaQuestion.id });

  } catch (error) {
    console.error('❌ Error submitting question:', error);
    console.error('Q&A submission error details:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      userFromToken: req.user?.User_ID
    });
    res.status(500).json({ error: 'Failed to submit question' });
  }
});

// Submit reply to a question
router.post('/activities/:activityId/questions/:questionId/reply', authenticateToken, async (req, res) => {
  try {
    const { activityId, questionId } = req.params;
    const { participantId, question } = req.body;
    
    console.log('🔐 Reply submission request:', {
      activityId,
      questionId,
      participantId,
      questionLength: question?.length,
      userFromToken: req.user?.User_ID,
      timestamp: new Date().toISOString()
    });

    // Verify participant exists and belongs to activity
    const participant = await LiveParticipant.findById(participantId);
    if (!participant) {
      console.error('❌ Participant not found:', participantId);
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.activityId !== activityId) {
      console.error('❌ Participant not in activity:', { participantId, activityId, participantActivity: participant.activityId });
      return res.status(403).json({ error: 'Participant not in this activity' });
    }

    // Verify parent question exists
    const parentQuestion = await LiveQAQuestion.findOne({ id: questionId, activityId });
    if (!parentQuestion) {
      return res.status(404).json({ error: 'Parent question not found' });
    }

    // Create the reply
    const reply = new LiveQAQuestion({
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      activityId,
      participantId: participant.isAnonymous ? null : participantId,
      nickname: participant.nickname,
      isAnonymous: participant.isAnonymous,
      question: question.trim(),
      parentQuestionId: questionId,
      isReply: true,
      status: 'pending'
    });

    await reply.save();

    console.log('✅ Reply submitted successfully:', {
      replyId: reply.id,
      parentQuestionId: questionId,
      nickname: reply.nickname
    });

    res.status(201).json({ 
      message: 'Reply submitted successfully', 
      reply: {
        id: reply.id,
        question: reply.question,
        nickname: reply.nickname,
        isAnonymous: reply.isAnonymous,
        parentQuestionId: reply.parentQuestionId,
        createdAt: reply.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error submitting reply:', error);
    res.status(500).json({ error: 'Failed to submit reply' });
  }
});

// Get Q&A questions with threading support
router.get('/activities/:activityId/questions', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { status = 'pending', threaded = 'false' } = req.query;
    
    if (threaded === 'true') {
      // Get top-level questions with their replies
      const topLevelQuestions = await LiveQAQuestion.find({
        activityId,
        parentQuestionId: null,
        ...(status !== 'all' && { status })
      }).sort({ upvoteCount: -1, createdAt: -1 });

      // For each question, get its replies
      const questionsWithReplies = await Promise.all(
        topLevelQuestions.map(async (question) => {
          const replies = await LiveQAQuestion.find({
            parentQuestionId: question.id
          }).sort({ createdAt: 1 });
          
          return {
            ...question.toObject(),
            replies: replies,
            replyCount: replies.length
          };
        })
      );

      res.json({ questions: questionsWithReplies, threaded: true });
    } else {
      // Original flat view
      const questions = await LiveQAQuestion.find({
        activityId,
        ...(status !== 'all' && { status })
      }).sort({ upvoteCount: -1, createdAt: -1 });

      res.json({ questions, threaded: false });
    }

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Upvote question
router.post('/activities/:activityId/questions/:questionId/upvote', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { participantId } = req.body;

    const question = await LiveQAQuestion.findOne({ id: questionId });
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.upvotes.includes(participantId)) {
      await question.removeUpvote(participantId);
    } else {
      await question.addUpvote(participantId);
    }

    res.json({ 
      success: true, 
      upvotes: question.upvoteCount,
      hasUpvoted: question.upvotes.includes(participantId)
    });

  } catch (error) {
    console.error('Error upvoting question:', error);
    res.status(500).json({ error: 'Failed to upvote question' });
  }
});

// Answer question (host only)
router.post('/activities/:activityId/questions/:questionId/answer', authenticateToken, checkHostPermissions, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;

    const question = await LiveQAQuestion.findOne({ id: questionId });
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    question.answer = {
      text: answer,
      answeredBy: req.user.User_ID,
      answeredAt: new Date()
    };
    question.status = 'answered';

    await question.save();

    res.json({ success: true });

  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

// Live Poll endpoints

// Create live poll as a question
router.post('/activities/:activityId/polls', authenticateToken, checkHostPermissions, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { question, options, duration = 300, allowMultiple = false, type, description } = req.body;

    console.log('📊 Creating poll as question:', { activityId, type, duration, allowMultiple, hasOptions: Array.isArray(options), optionsCount: options?.length });
    console.log('📊 Raw body for poll creation:', req.body);

    // Find the activity
    const activity = await LiveActivity.findOne({ Act_ID: activityId });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Handle different poll types
    let pollOptions = options;
    
    if (!pollOptions || pollOptions.length === 0) {
      // Set default options based on type
      if (type === 'Rating') {
        pollOptions = ['1', '2', '3', '4', '5'];
      } else if (type === 'OpenText') {
        pollOptions = ['Response']; // Single response option for text-based polls
      } else if (type === 'MultiChoice' || type === 'MultiVote') {
        return res.status(400).json({ error: 'Options are required for multiple choice polls' });
      } else {
        return res.status(400).json({ error: 'Options are required for this poll type' });
      }
    }

    // Add the poll as a question using the new unified system
    const pollQuestion = await activity.addLivePoll(req.user.User_ID, {
      question,
      description,
      type: type || 'MultiChoice',
      options: pollOptions,
      duration,
      allowMultiple: type === 'MultiVote' || allowMultiple
    });
    
    console.log('✅ Poll created as question successfully:', { id: pollQuestion.id, type: pollQuestion.type, options: pollQuestion.options, index: activity.questions.length - 1 });

    res.json({ 
      success: true, 
      poll: {
        id: pollQuestion.id,
        question: pollQuestion.text,
        options: pollQuestion.options,
        expiresAt: pollQuestion.settings.expiresAt,
        allowMultiple: pollQuestion.settings.allowMultiple,
        type: pollQuestion.type,
        isPoll: pollQuestion.isPoll,
        questionIndex: activity.questions.length - 1 // Index of the newly added question
      }
    });

  } catch (error) {
    console.error('❌ Error creating poll:', error);
    console.error('Poll creation error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      requestBody: req.body,
      headers: req.headers
    });
    res.status(500).json({ error: 'Failed to create poll', details: error.message });
  }
});

// Vote on poll/question
router.post('/activities/:activityId/polls/:pollId/vote', async (req, res) => {
  try {
    const { activityId, pollId } = req.params;
    const { participantId, option } = req.body;

    // Find the activity
    const activity = await LiveActivity.findOne({ Act_ID: activityId });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const participant = await LiveParticipant.findById(participantId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Optional: ensure participant belongs to this activity
    if (participant.activityId !== activityId) {
      return res.status(403).json({ error: 'Participant not in this activity' });
    }

    // Find the question/poll in the activity (questions use custom id field)
    const question = activity.questions.find(q => q.id === pollId);
    if (!question) {
      console.error('Question not found for pollId:', pollId);
      console.error('Available questions:', activity.questions.map(q => ({ id: q.id, _id: q._id, text: q.text })));
      return res.status(404).json({ error: 'Question/Poll not found' });
    }

    // Normalize option payload
    const normalizedOption = typeof option === 'string' ? option : (option?.value ?? option?.label ?? String(option));
    console.log('🗳️ Vote submission:', {
      pollId,
      type: question.type,
      receivedOption: option,
      normalizedOption,
      validOptions: question.options
    });

    // Validate for multiple choice types
    if ((question.type === 'MultiChoice' || question.type === 'MultiVote') && !question.options.includes(normalizedOption)) {
      return res.status(400).json({ error: 'Invalid option selected', validOptions: question.options });
    }

    // Add response using the unified system
    await activity.addResponse(pollId, participantId, participant.nickname, normalizedOption);

    console.log('✅ Vote/response recorded successfully for question:', pollId);
    
    res.json({ success: true });

  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get poll/question results
router.get('/activities/:activityId/polls/:pollId/results', async (req, res) => {
  try {
    const { activityId, pollId } = req.params;

    // Find the activity
    const activity = await LiveActivity.findOne({ Act_ID: activityId });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Get results using the unified system
    const results = activity.getQuestionResults(pollId);
    if (!results) {
      return res.status(404).json({ error: 'Question/Poll not found' });
    }
    
    res.json(results);

  } catch (error) {
    console.error('Error fetching poll results:', error);
    res.status(500).json({ error: 'Failed to fetch poll results' });
  }
});

// Get active polls/questions for activity
router.get('/activities/:activityId/polls', async (req, res) => {
  try {
    const { activityId } = req.params;

    // Find the activity
    const activity = await LiveActivity.findOne({ Act_ID: activityId });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Expire old polls first
    await activity.expireOldPolls();

    // Get all active polls (questions marked as polls and still active)
    const activePolls = activity.questions
      .filter(q => q.isPoll && q.isActive && (!q.settings.expiresAt || new Date() <= q.settings.expiresAt))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(q => ({
        id: q.id || q._id.toString(),
        question: q.text,
        type: q.type,
        options: q.options,
        isActive: q.isActive,
        isPoll: q.isPoll,
        createdAt: q.createdAt,
        expiresAt: q.settings.expiresAt,
        allowMultiple: q.settings.allowMultiple
      }));

    res.json({ polls: activePolls });

  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

// Navigate to specific question/poll
router.patch('/activities/:activityId/navigate', authenticateToken, checkHostPermissions, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { questionIndex, questionId } = req.body;

    const activity = await LiveActivity.findOne({ Act_ID: activityId });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    let targetIndex = questionIndex;
    if (typeof targetIndex === 'string') {
      const parsed = parseInt(targetIndex, 10);
      if (!Number.isNaN(parsed)) targetIndex = parsed;
    }
    
    // If questionId is provided, find the index
    if (questionId && questionIndex === undefined) {
      targetIndex = activity.questions.findIndex(q => q.id === questionId);
      if (targetIndex === -1) {
        return res.status(404).json({ error: 'Question not found' });
      }
    }

    // Navigate to the question; if index is unchanged, still return success
    await activity.navigateToQuestion(targetIndex);

    const currentQuestion = activity.getCurrentQuestion();
    
    res.json({ 
      success: true, 
      currentQuestionIndex: activity.currentQuestionIndex,
      currentQuestion: currentQuestion ? {
        id: currentQuestion.id,
        text: currentQuestion.text,
        type: currentQuestion.type,
        options: currentQuestion.options,
        isPoll: currentQuestion.isPoll,
        isActive: currentQuestion.isActive
      } : null
    });

  } catch (error) {
    console.error('Error navigating to question:', error);
    res.status(400).json({ error: error.message });
  }
});

// Polling endpoint for real-time updates
router.get('/activities/:activityId/status', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { lastUpdate } = req.query;

    const activity = await LiveActivity.findOne({ Act_ID: activityId });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const lastUpdateDate = lastUpdate ? new Date(lastUpdate) : new Date(0);
    
    // Get current participant count
    const participantCount = await LiveParticipant.countDocuments({ 
      activityId,
      isConnected: true 
    });

    // Check for updates since last poll
    const hasUpdates = activity.updatedAt > lastUpdateDate;

    const response = {
      hasUpdates,
      timestamp: new Date(),
      data: {
        isLive: activity.isLive,
        currentQuestionIndex: activity.currentQuestionIndex,
        currentQuestion: activity.questions[activity.currentQuestionIndex],
        participantCount,
        analytics: activity.analytics
      }
    };

    // Include recent Q&A if updated
    if (hasUpdates) {
      const recentQuestions = await LiveQAQuestion.find({
        activityId,
        updatedAt: { $gt: lastUpdateDate }
      }).sort({ createdAt: -1 }).limit(10);
      
      response.data.recentQuestions = recentQuestions;
    }

    res.json(response);

  } catch (error) {
    console.error('Error fetching activity status:', error);
    res.status(500).json({ error: 'Failed to fetch activity status' });
  }
});

// Export activity data as CSV
router.get('/activities/:activityId/export', authenticateToken, checkHostPermissions, async (req, res) => {
  try {
    const { activityId } = req.params;
    
    const activity = await LiveActivity.findOne({ Act_ID: activityId });
    if (!activity || !activity.hostIds.includes(req.user.User_ID)) {
      return res.status(404).json({ error: 'Activity not found or unauthorized' });
    }

    // Get all participants and their data
    const participants = await LiveParticipant.find({ activityId });
    const qaQuestions = await LiveQAQuestion.find({ activityId });
    const livePolls = await LivePoll.find({ activityId });

    // Generate CSV content
    let csvContent = '';
    
    // Activity Information
    csvContent += 'ACTIVITY INFORMATION\n';
    csvContent += `Title,"${activity.title}"\n`;
    csvContent += `Description,"${activity.description || ''}"\n`;
    csvContent += `PIN,${activity.pin}\n`;
    csvContent += `Created,${activity.createdAt.toISOString()}\n`;
    csvContent += `Total Participants,${activity.analytics.totalParticipants}\n`;
    csvContent += `Total Responses,${activity.analytics.totalResponses}\n`;
    csvContent += '\n';

    // Questions and Responses
    csvContent += 'QUESTIONS AND RESPONSES\n';
    csvContent += 'Question Index,Question Text,Question Type,Participant,Answer,Response Time (ms),Timestamp\n';
    
    participants.forEach(participant => {
      participant.responses.forEach(response => {
        const question = activity.questions[response.questionIndex];
        csvContent += `${response.questionIndex},"${question?.text || 'N/A'}",${question?.type || 'N/A'},"${participant.nickname}","${response.answer}",${response.responseTime},${response.timestamp.toISOString()}\n`;
      });
    });
    
    csvContent += '\n';

    // Q&A Questions
    if (qaQuestions.length > 0) {
      csvContent += 'Q&A QUESTIONS\n';
      csvContent += 'Question,Participant,Upvotes,Status,Answer,Timestamp\n';
      
      qaQuestions.forEach(qa => {
        csvContent += `"${qa.question}","${qa.nickname}",${qa.upvoteCount},${qa.status},"${qa.answer?.text || ''}",${qa.createdAt.toISOString()}\n`;
      });
      
      csvContent += '\n';
    }

    // Live Polls
    if (livePolls.length > 0) {
      csvContent += 'LIVE POLLS\n';
      csvContent += 'Poll Question,Option,Participant,Timestamp\n';
      
      livePolls.forEach(poll => {
        poll.votes.forEach(vote => {
          csvContent += `"${poll.question}","${vote.option}","${vote.nickname}",${vote.timestamp.toISOString()}\n`;
        });
      });
      
      csvContent += '\n';
    }

    // Participant Summary
    csvContent += 'PARTICIPANT SUMMARY\n';
    csvContent += 'Participant,Total Responses,Average Response Time (ms),Total Comments,Total Votes,Join Time\n';
    
    participants.forEach(participant => {
      csvContent += `"${participant.nickname}",${participant.responses.length},${participant.averageResponseTime},${participant.comments.length},${participant.votes?.length || 0},${participant.joinedAt.toISOString()}\n`;
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="activity-${activityId}-export.csv"`);
    
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting activity data:', error);
    res.status(500).json({ error: 'Failed to export activity data' });
  }
});

export default router;