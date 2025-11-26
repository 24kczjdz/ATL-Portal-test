import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

class WebSocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || ["http://localhost:3000"],
        credentials: true
      }
    });
    
    this.rooms = new Map(); // Track active activity rooms
    this.participants = new Map(); // Track participant connections
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          // Allow anonymous users for public activities
          socket.user = { isAnonymous: true };
          return next();
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (err) {
        console.error('WebSocket auth error:', err);
        next(new Error('Authentication failed'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.user?.User_ID || 'Anonymous'} (${socket.id})`);
      
      // Join activity room
      socket.on('join_activity', (data) => {
        this.handleJoinActivity(socket, data);
      });

      // Leave activity room
      socket.on('leave_activity', (data) => {
        this.handleLeaveActivity(socket, data);
      });

      // Host controls
      socket.on('host_next_question', (data) => {
        this.handleNextQuestion(socket, data);
      });

      socket.on('host_previous_question', (data) => {
        this.handlePreviousQuestion(socket, data);
      });

      socket.on('host_toggle_activity', (data) => {
        this.handleToggleActivity(socket, data);
      });

      // Participant interactions
      socket.on('submit_answer', (data) => {
        this.handleSubmitAnswer(socket, data);
      });

      socket.on('submit_comment', (data) => {
        this.handleSubmitComment(socket, data);
      });

      socket.on('vote_comment', (data) => {
        this.handleVoteComment(socket, data);
      });

      // Q&A System
      socket.on('ask_question', (data) => {
        this.handleAskQuestion(socket, data);
      });

      socket.on('upvote_question', (data) => {
        this.handleUpvoteQuestion(socket, data);
      });

      socket.on('answer_question', (data) => {
        this.handleAnswerQuestion(socket, data);
      });

      // Live polling
      socket.on('create_live_poll', (data) => {
        this.handleCreateLivePoll(socket, data);
      });

      socket.on('vote_live_poll', (data) => {
        this.handleVoteLivePoll(socket, data);
      });

      // Word cloud
      socket.on('submit_word', (data) => {
        this.handleSubmitWord(socket, data);
      });

      // Connection management
      socket.on('heartbeat', () => {
        socket.emit('heartbeat_ack');
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  handleJoinActivity(socket, { activityId, nickname }) {
    try {
      const roomKey = `activity_${activityId}`;
      socket.join(roomKey);
      
      const participant = {
        socketId: socket.id,
        userId: socket.user?.User_ID || null,
        nickname: nickname || socket.user?.Nickname || 'Anonymous',
        isHost: this.isHost(socket.user, activityId),
        joinedAt: new Date(),
        isConnected: true
      };

      // Track participants
      if (!this.rooms.has(roomKey)) {
        this.rooms.set(roomKey, {
          activityId,
          participants: new Map(),
          hosts: new Set(),
          currentQuestion: null,
          qaQueue: [],
          livePolls: [],
          wordClouds: new Map()
        });
      }

      const room = this.rooms.get(roomKey);
      room.participants.set(socket.id, participant);

      if (participant.isHost) {
        room.hosts.add(socket.id);
      }

      // Notify others about new participant
      socket.to(roomKey).emit('participant_joined', {
        participant: {
          nickname: participant.nickname,
          isHost: participant.isHost
        },
        totalParticipants: room.participants.size
      });

      // Send current activity state to new participant
      socket.emit('activity_state', {
        currentQuestion: room.currentQuestion,
        participantCount: room.participants.size,
        qaQueue: room.qaQueue.filter(q => q.status !== 'dismissed'),
        livePolls: room.livePolls.filter(p => p.isActive)
      });

      console.log(`${participant.nickname} joined activity ${activityId}`);
    } catch (error) {
      console.error('Error joining activity:', error);
      socket.emit('error', { message: 'Failed to join activity' });
    }
  }

  handleLeaveActivity(socket, { activityId }) {
    const roomKey = `activity_${activityId}`;
    const room = this.rooms.get(roomKey);
    
    if (room && room.participants.has(socket.id)) {
      const participant = room.participants.get(socket.id);
      room.participants.delete(socket.id);
      room.hosts.delete(socket.id);
      
      socket.leave(roomKey);
      
      // Notify others
      socket.to(roomKey).emit('participant_left', {
        nickname: participant.nickname,
        totalParticipants: room.participants.size
      });

      // Clean up empty rooms
      if (room.participants.size === 0) {
        this.rooms.delete(roomKey);
      }
    }
  }

  handleNextQuestion(socket, { activityId, questionIndex }) {
    if (!this.isSocketHost(socket, activityId)) return;
    
    const roomKey = `activity_${activityId}`;
    const room = this.rooms.get(roomKey);
    
    if (room) {
      room.currentQuestion = {
        index: questionIndex,
        startedAt: new Date()
      };
      
      // Broadcast to all participants
      this.io.to(roomKey).emit('question_changed', {
        questionIndex,
        timestamp: new Date()
      });
    }
  }

  handleSubmitAnswer(socket, { activityId, questionIndex, answer, responseTime }) {
    const roomKey = `activity_${activityId}`;
    const room = this.rooms.get(roomKey);
    
    if (room && room.participants.has(socket.id)) {
      const participant = room.participants.get(socket.id);
      
      const answerData = {
        participantId: socket.id,
        nickname: participant.nickname,
        answer,
        responseTime,
        timestamp: new Date()
      };

      // Broadcast answer to hosts only (for real-time monitoring)
      room.hosts.forEach(hostSocketId => {
        this.io.to(hostSocketId).emit('new_answer', {
          questionIndex,
          answer: answerData
        });
      });

      // Update live results for visualization
      this.updateLiveResults(roomKey, questionIndex, answerData);
    }
  }

  handleSubmitComment(socket, { activityId, questionIndex, comment }) {
    const roomKey = `activity_${activityId}`;
    const room = this.rooms.get(roomKey);
    
    if (room && room.participants.has(socket.id)) {
      const participant = room.participants.get(socket.id);
      
      const commentData = {
        id: this.generateId(),
        participantId: socket.id,
        nickname: participant.nickname,
        comment,
        timestamp: new Date(),
        likes: 0
      };

      // Broadcast comment to all participants
      this.io.to(roomKey).emit('new_comment', {
        questionIndex,
        comment: commentData
      });
    }
  }

  handleAskQuestion(socket, { activityId, question }) {
    const roomKey = `activity_${activityId}`;
    const room = this.rooms.get(roomKey);
    
    if (room && room.participants.has(socket.id)) {
      const participant = room.participants.get(socket.id);
      
      const qaItem = {
        id: this.generateId(),
        participantId: socket.id,
        nickname: participant.nickname,
        question,
        timestamp: new Date(),
        status: 'pending',
        upvotes: [],
        answer: null
      };

      room.qaQueue.push(qaItem);

      // Notify hosts about new question
      room.hosts.forEach(hostSocketId => {
        this.io.to(hostSocketId).emit('new_qa_question', qaItem);
      });

      // Notify all participants for Q&A feed
      this.io.to(roomKey).emit('qa_updated', {
        qaQueue: room.qaQueue.filter(q => q.status !== 'dismissed')
      });
    }
  }

  handleCreateLivePoll(socket, { activityId, question, options, duration = 60 }) {
    if (!this.isSocketHost(socket, activityId)) return;
    
    const roomKey = `activity_${activityId}`;
    const room = this.rooms.get(roomKey);
    
    if (room) {
      const poll = {
        id: this.generateId(),
        question,
        options,
        votes: [],
        isActive: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + duration * 1000)
      };

      room.livePolls.push(poll);

      // Broadcast poll to all participants
      this.io.to(roomKey).emit('new_live_poll', poll);

      // Auto-expire poll
      setTimeout(() => {
        poll.isActive = false;
        this.io.to(roomKey).emit('poll_expired', { pollId: poll.id });
      }, duration * 1000);
    }
  }

  updateLiveResults(roomKey, questionIndex, answerData) {
    const room = this.rooms.get(roomKey);
    if (!room) return;

    // Broadcast updated results for live visualization
    this.io.to(roomKey).emit('live_results_update', {
      questionIndex,
      totalResponses: room.participants.size,
      newAnswer: answerData
    });
  }

  isHost(user, activityId) {
    // This should check against your database
    // For now, returning basic check
    return user && !user.isAnonymous && [
      'ATL_ADMIN',
      'ATL_Member_HKU_Staff',
      'ATL_Member_HKU_Student', 
      'ATL_Member_General'
    ].includes(user.User_Role);
  }

  isSocketHost(socket, activityId) {
    const roomKey = `activity_${activityId}`;
    const room = this.rooms.get(roomKey);
    return room && room.hosts.has(socket.id);
  }

  handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.id}`);
    
    // Clean up from all rooms
    for (const [roomKey, room] of this.rooms.entries()) {
      if (room.participants.has(socket.id)) {
        const participant = room.participants.get(socket.id);
        room.participants.delete(socket.id);
        room.hosts.delete(socket.id);
        
        socket.to(roomKey).emit('participant_left', {
          nickname: participant.nickname,
          totalParticipants: room.participants.size
        });
        
        if (room.participants.size === 0) {
          this.rooms.delete(roomKey);
        }
      }
    }
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Public methods for external use
  getActivityParticipants(activityId) {
    const roomKey = `activity_${activityId}`;
    const room = this.rooms.get(roomKey);
    return room ? Array.from(room.participants.values()) : [];
  }

  broadcastToActivity(activityId, event, data) {
    const roomKey = `activity_${activityId}`;
    this.io.to(roomKey).emit(event, data);
  }

  broadcastToHosts(activityId, event, data) {
    const roomKey = `activity_${activityId}`;
    const room = this.rooms.get(roomKey);
    if (room) {
      room.hosts.forEach(hostSocketId => {
        this.io.to(hostSocketId).emit(event, data);
      });
    }
  }
}

export default WebSocketService;