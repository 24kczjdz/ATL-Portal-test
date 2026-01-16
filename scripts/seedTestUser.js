import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        return false;
    }
};

// User schema (simplified version matching the main schema)
const userSchema = new mongoose.Schema({
    User_ID: { type: String, required: true, unique: true },
    Email_Address: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    First_Name: { type: String, required: true },
    Last_Name: { type: String, required: true },
    Nickname: String,
    Title: String,
    Gender: String,
    Tel: String,
    User_Role: { type: String, default: 'Non_ATL_General' },
    ATL_Member: { type: Boolean, default: false },
    Member_ID: String,
    UID: String,
    direct_marketing: { type: Boolean, default: false },
    email_list: { type: Boolean, default: false },
    card_id: String,
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('Password')) {
        this.Password = await bcrypt.hash(this.Password, 12);
    }
    next();
});

const User = mongoose.model('USER', userSchema);

// Test user data
const testUser = {
    User_ID: 'testuser',
    Email_Address: 'testuser@hku.hk',
    Password: 'Test@1234',  // This will be hashed
    First_Name: 'Test',
    Last_Name: 'User',
    Nickname: 'Tester',
    Title: 'Mr.',
    Gender: 'Prefer not to say',
    Tel: '+85212345678',
    User_Role: 'ATL_Member_HKU_Student',
    ATL_Member: true,
    Member_ID: 'ATL2024TEST',
    UID: '3031234567',
    direct_marketing: false,
    email_list: true
};

const seedTestUser = async () => {
    try {
        const connected = await connectDB();
        if (!connected) {
            process.exit(1);
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { Email_Address: testUser.Email_Address },
                { User_ID: testUser.User_ID }
            ]
        });

        if (existingUser) {
            console.log('⚠️  Test user already exists!');
            console.log('\n📋 Test User Credentials:');
            console.log('   Email: testuser@hku.hk');
            console.log('   Password: Test@1234');
            console.log('   Role: ATL Member - HKU Student');
        } else {
            // Create new user
            const newUser = new User(testUser);
            await newUser.save();
            
            console.log('✅ Test user created successfully!');
            console.log('\n📋 Test User Credentials:');
            console.log('   Email: testuser@hku.hk');
            console.log('   Password: Test@1234');
            console.log('   Role: ATL Member - HKU Student');
        }

        console.log('\n🔐 You can now log in with these credentials at the login page.');
        
    } catch (error) {
        console.error('❌ Error creating test user:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed.');
        process.exit(0);
    }
};

seedTestUser();




