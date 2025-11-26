// Enhanced Activity Schema for Mentimeter-like functionality

export const ActivitySchema = {
  Act_ID: String, // Unique activity ID
  Title: String,
  Description: String,
  Creator_ID: [String], // Array of user IDs who can host
  Live: Boolean, // Whether activity is currently live
  Status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed'],
    default: 'draft'
  },
  Settings: {
    allowAnonymous: Boolean,
    allowComments: Boolean,
    allowVoting: Boolean,
    showResults: {
      type: String,
      enum: ['live', 'after_question', 'after_activity'],
      default: 'live'
    },
    moderateComments: Boolean,
    allowMultipleAnswers: Boolean
  },
  Questions: [{
    ID: String,
    Type: {
      type: String,
      enum: ['MultiChoice', 'Poll', 'OpenText', 'Rating', 'WordCloud', 'Ranking', 'QA'],
      required: true
    },
    Text: String,
    Answers: [String], // For multiple choice, poll options
    Scores: [Number], // Scoring for each answer
    Settings: {
      multipleChoice: Boolean,
      required: Boolean,
      timeLimit: Number, // in seconds
      characterLimit: Number,
      allowOther: Boolean
    },
    Metadata: {
      order: Number,
      category: String,
      tags: [String]
    }
  }],
  Pointer: Number, // Current active question index
  Ending: Number,
  Analytics: {
    totalParticipants: Number,
    totalResponses: Number,
    averageResponseTime: Number,
    completionRate: Number
  },
  Created_At: Date,
  Updated_At: Date,
  Scheduled_At: Date,
  Ends_At: Date
};

export const ParticipantSchema = {
  Parti_ID: String,
  User_ID: String,
  Act_ID: String,
  Nickname: String,
  IsAnonymous: Boolean,
  Answers: [{
    QuestionID: String,
    QuestionIndex: Number,
    Answer: String, // Can be text, selected option, or JSON for complex answers
    Score: Number,
    ResponseTime: Number, // Time taken to answer in seconds
    Timestamp: Date,
    IsCorrect: Boolean,
    Metadata: {
      ipAddress: String,
      userAgent: String,
      location: {
        country: String,
        city: String
      }
    }
  }],
  Scores: [{
    QuestionIndex: Number,
    Score: Number,
    MaxScore: Number
  }],
  TotalScore: Number,
  Comments: [{
    QuestionIndex: Number,
    Text: String,
    Timestamp: Date,
    IsApproved: Boolean,
    Likes: Number,
    Replies: [{
      Text: String,
      Author: String,
      Timestamp: Date
    }]
  }],
  Votes: [{
    QuestionIndex: Number,
    VotedFor: String, // Other participant's answer or comment
    Timestamp: Date
  }],
  JoinedAt: Date,
  LastActivity: Date,
  ConnectionStatus: {
    type: String,
    enum: ['connected', 'disconnected', 'idle'],
    default: 'connected'
  }
};

export const LiveSessionSchema = {
  Session_ID: String,
  Act_ID: String,
  Host_IDs: [String],
  Participants: [{
    User_ID: String,
    Nickname: String,
    JoinedAt: Date,
    IsConnected: Boolean,
    SocketID: String
  }],
  CurrentQuestion: {
    Index: Number,
    StartedAt: Date,
    TimeLimit: Number,
    Responses: [{
      Participant_ID: String,
      Response: String,
      Timestamp: Date,
      ResponseTime: Number
    }]
  },
  QAQueue: [{
    ID: String,
    Participant_ID: String,
    Question: String,
    Timestamp: Date,
    Status: {
      type: String,
      enum: ['pending', 'answered', 'dismissed'],
      default: 'pending'
    },
    Upvotes: [String], // Array of participant IDs who upvoted
    Answer: {
      Text: String,
      AnsweredBy: String,
      AnsweredAt: Date
    }
  }],
  LivePolls: [{
    Poll_ID: String,
    Question: String,
    Options: [String],
    Votes: [{
      Participant_ID: String,
      Option: String,
      Timestamp: Date
    }],
    IsActive: Boolean,
    CreatedAt: Date,
    ExpiresAt: Date
  }],
  WordClouds: [{
    Question_ID: String,
    Words: [{
      Text: String,
      Count: Number,
      Participants: [String]
    }]
  }],
  Settings: {
    moderationMode: Boolean,
    allowQuestions: Boolean,
    allowPolls: Boolean,
    maxParticipants: Number
  },
  Created_At: Date,
  Updated_At: Date
};

export const AnalyticsSchema = {
  Analytics_ID: String,
  Act_ID: String,
  Session_ID: String,
  Metrics: {
    participation: {
      totalJoined: Number,
      peakConcurrent: Number,
      averageConcurrent: Number,
      dropoffRate: Number
    },
    engagement: {
      averageResponseTime: Number,
      questionsAsked: Number,
      commentsPosted: Number,
      votescast: Number
    },
    performance: {
      averageScore: Number,
      highestScore: Number,
      questionDifficulty: [{
        QuestionIndex: Number,
        CorrectRate: Number,
        AverageTime: Number
      }]
    }
  },
  Timeline: [{
    Timestamp: Date,
    Event: String,
    Data: Object
  }],
  Generated_At: Date
};

export const NotificationSchema = {
  Notification_ID: String,
  User_ID: String,
  Act_ID: String,
  Type: {
    type: String,
    enum: ['activity_start', 'question_change', 'new_comment', 'new_qa', 'activity_end'],
    required: true
  },
  Title: String,
  Message: String,
  Data: Object,
  IsRead: Boolean,
  Created_At: Date,
  Expires_At: Date
};