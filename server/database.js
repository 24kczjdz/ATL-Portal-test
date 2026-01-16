import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the schema for each collection
const schema = {
    USER: {
        User_ID: String,
        First_Name: String,
        Last_Name: String,
        Nickname: String,
        Title: String,
        Gender: String,
        Email_Address: String,
        Password: String,
        Tel: String,
        User_Role: String, // ATL_ADMIN, ATL_Member_HKU_Staff, ATL_Member_HKU_Student, ATL_Member_General, Non_ATL_HKU_Staff, Non_ATL_HKU_Student, Non_ATL_General
        ATL_Member: Boolean, // Whether user is an ATL member
        Member_ID: String, // ATL Member ID (required if ATL_Member is true)
        UID: String, // HKU UID (required for HKU Staff and Students)
        approved: { type: Boolean, default: false }, // Whether admin has approved the account
        direct_marketing: Boolean,
        email_list: Boolean,
        card_id: String,
        createdAt: Date,
        lastLogin: Date,
        resetToken: String,
        resetTokenExpires: Date,
        oneTimeToken: String,
        oneTimeTokenExpires: Date
    },
    PASSWORD_RESET: {
        reset_id: String,
        user_id: String,
        email: String,
        token: String,
        type: String, // 'reset' or 'one_time'
        expires_at: Date,
        used: Boolean,
        created_at: Date,
        ip_address: String,
        user_agent: String
    },
    EVENT: {
        Event_ID: { type: String, required: true, unique: true },
        Event_Title: { type: String, required: true },
        Event_Type: { type: String, required: true },
        Event_Desc: { type: String, default: "" },
        Event_StartDate: { type: String, required: true },
        Event_EndDate: { type: String, required: true },
        Host_ID: { type: [String], default: [] }
    },
    ACTIVITY: {
        Act_ID: String,
        Title: String,
        Description: String,
        Questions: [{
            Text: String,        // Question text
            Type: String,        // 'multiple-choice', 'textbox scored', 'textbox unscored'
            Options: [String],   // For multiple-choice questions
            Answers: [String],   // For textbox scored questions
            Scores: [Number],    // Scores for each option/answer
            Required: Boolean,   // Whether the question is required
            Time_Limit: Number,  // Time limit in seconds, 0 for no limit
            Order: Number        // For custom ordering of questions
        }],
        Settings: {
            Randomize_Questions: Boolean,
            Show_Correct_Answers: Boolean,
            Allow_Retry: Boolean,
            Max_Attempts: Number,
            Time_Limit: Number   // Overall time limit in seconds, 0 for no limit
        },
        Pointer: Number,
        Ending: Number,
        Live: Boolean,
        Creator_ID: [String],
        Status: String,         // 'draft', 'scheduled', 'live', 'completed'
        Schedule: {
            Start_Time: Date,
            End_Time: Date
        },
        Created_At: Date,
        Last_Updated: Date
    },
    PARTICIPANT: {
        Parti_ID: String,
        User_ID: String,
        Act_ID: String,
        Nickname: String,
        Answers: [{
            QuestionIndex: Number,
            Answer: String,
            Timestamp: Date,
            Attempt: Number,     // For tracking multiple attempts
            Score: Number        // For storing individual question scores
        }],
        Scores: [{
            QuestionIndex: Number,
            Score: Number,
            Timestamp: Date
        }],
        Status: String,         // 'joined', 'active', 'completed', 'disconnected'
        Last_Active: Date,
        Created_At: Date,
        Last_Updated: Date
    },
    CHAT: {
        Chat_ID: String,
        User_ID: String,
        User_Context: {
            Nickname: String,
            First_Name: String,
            Last_Name: String,
            Title: String,
            Gender: String,
            Email_Address: String,
            Tel: String,
            User_Role: String
        },
        Messages: [{
            Text: String,
            Is_Bot: Boolean,
            Timestamp: Date
        }],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    },
    SURVEY: {
        Chat_ID: String,
        User_ID: String,
        User_Context: {
            Nickname: String,
            First_Name: String,
            Last_Name: String,
            Title: String,
            Gender: String,
            Email_Address: String,
            Tel: String,
            User_Role: String
        },
        Survey_Responses: {
            overallExperience: {
                question: String,
                rating: Number
            },
            suggestions: {
                question: String,
                response: String
            },
            primaryIntent: {
                question: String,
                response: String
            }
        },
        Export_Metadata: {
            exported_at: Date,
            total_messages: Number,
            has_survey: Boolean,
            survey_rating: Number,
            survey_suggestions: String,
            survey_primary_intent: String,
            chat_duration: Number
        },
        Chat_Messages: [{
            Text: String,
            Is_Bot: Boolean,
            Timestamp: Date
        }],
        Created_At: { type: Date, default: Date.now },
        Updated_At: { type: Date, default: Date.now }
    },
    TOKEN: {
        Token_ID: { type: String, required: true, unique: true },
        Token_Value: { type: String, required: true, unique: true },
        Token_Type: { type: String, required: true, default: 'admin_registration' }, // 'admin_registration', 'temporary', etc.
        Created_By: { type: String, required: true }, // User_ID of admin who created it
        Is_Used: { type: Boolean, default: false },
        Used_By: { type: String, default: null }, // User_ID who used the token
        Used_At: { type: Date, default: null },
        Expires_At: { type: Date, default: null }, // null for no expiration
        Description: { type: String, default: '' }, // Optional description
        Created_At: { type: Date, default: Date.now },
        Updated_At: { type: Date, default: Date.now }
    }
};

// Password complexity requirements
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordRequirements = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true
};

// Create User Schema with methods and middleware
const userSchema = new mongoose.Schema(schema.USER);

// Add password validation method
userSchema.methods.validatePassword = function(password) {
    // Only validate if password is being set
    if (!password) {
        return true;
    }

    console.log('Validating password:', password);
    console.log('Password length:', password.length);
    console.log('Has uppercase:', /[A-Z]/.test(password));
    console.log('Has lowercase:', /[a-z]/.test(password));
    console.log('Has number:', /\d/.test(password));
    console.log('Has special:', /[@$!%*?&]/.test(password));
    console.log('Regex test result:', passwordRegex.test(password));
    
    if (!passwordRegex.test(password)) {
        throw new Error(
            'Password must be at least 8 characters long and contain:\n' +
            '- At least one uppercase letter\n' +
            '- At least one lowercase letter\n' +
            '- At least one number\n' +
            '- At least one special character (@$!%*?&)'
        );
    }
    return true;
};

// Add password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        console.log('Comparing passwords...');
        console.log('Candidate password:', candidatePassword);
        console.log('Stored password hash:', this.Password);
        
        // If the stored password is not hashed (for existing users), hash it first
        if (!this.Password.startsWith('$2')) {
            console.log('Password not hashed, hashing now...');
            this.Password = await bcrypt.hash(this.Password, 10);
            await this.save();
        }
        
        const isMatch = await bcrypt.compare(candidatePassword, this.Password);
        console.log('Password match result:', isMatch);
        return isMatch;
    } catch (error) {
        console.error('Error in comparePassword:', error);
        throw error;
    }
};

// Add pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    try {
        // Only hash password if it's being modified and is not empty
        if (this.isModified('Password') && this.Password) {
            console.log('Password modified, hashing...');
            // Only validate password if it's being set (not when updating other fields)
            if (this.isNew || this.isModified('Password')) {
                this.validatePassword(this.Password);
            }
            this.Password = await bcrypt.hash(this.Password, 10);
            console.log('Password hashed successfully');
        }
        next();
    } catch (error) {
        console.error('Error in pre-save middleware:', error);
        next(error);
    }
});

// Create Mongoose models with uppercase collection names
const User = mongoose.model('USER', userSchema, 'USER');
const Event = mongoose.model('EVENT', new mongoose.Schema(schema.EVENT), 'EVENT');
const Activity = mongoose.model('ACTIVITY', new mongoose.Schema(schema.ACTIVITY), 'ACTIVITY');
const Participant = mongoose.model('PARTICIPANT', new mongoose.Schema(schema.PARTICIPANT), 'PARTICIPANT');
const Chat = mongoose.model('CHAT', new mongoose.Schema(schema.CHAT), 'CHAT');
const Survey = mongoose.model('SURVEY', new mongoose.Schema(schema.SURVEY), 'SURVEY');
const Token = mongoose.model('TOKEN', new mongoose.Schema(schema.TOKEN), 'TOKEN');

// Create indexes
mongoose.connection.on('connected', () => {
    User.collection.createIndex({ User_ID: 1 }, { unique: true });
    Event.collection.createIndex({ Event_ID: 1 }, { unique: true });
    Activity.collection.createIndex({ Act_ID: 1 }, { unique: true });
    Activity.collection.createIndex({ Creator_ID: 1 });
    Participant.collection.createIndex({ User_ID: 1 });
    Participant.collection.createIndex({ Act_ID: 1 });
    Participant.collection.createIndex({ "Answers.QuestionIndex": 1 });
    Chat.collection.createIndex({ Chat_ID: 1 }, { unique: true });
    Chat.collection.createIndex({ User_ID: 1 });
    Survey.collection.createIndex({ Chat_ID: 1 }, { unique: true });
    Survey.collection.createIndex({ User_ID: 1 });
    Token.collection.createIndex({ Token_ID: 1 }, { unique: true });
    Token.collection.createIndex({ Token_Value: 1 }, { unique: true });
    Token.collection.createIndex({ Created_By: 1 });
});

// Export models and schemas
export const models = {
    USER: User,
    EVENT: Event,
    ACTIVITY: Activity,
    PARTICIPANT: Participant,
    CHAT: Chat,
    SURVEY: Survey,
    TOKEN: Token
};

export const schemas = schema; 