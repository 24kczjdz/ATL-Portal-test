import mongoose from "mongoose";

// Utility function to ensure MongoDB connection
export const ensureConnected = async () => {
    if (mongoose.connection.readyState === 1) {
        return true; // Already connected
    }
    
    if (mongoose.connection.readyState === 2) {
        // Currently connecting, wait for it
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout after 10 seconds'));
            }, 10000); // Reduced timeout
            
            mongoose.connection.once('connected', () => {
                clearTimeout(timeout);
                resolve(true);
            });
            
            mongoose.connection.once('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }
    
    // Not connected, try to connect
    return await connectDB();
};

export const connectDB = async () => {
    try {
        console.log('🔍 Attempting MongoDB connection...');
        console.log('Environment variables check:');
        console.log('- NODE_ENV:', process.env.NODE_ENV);
        console.log('- Has MONGO_URI:', !!process.env.MONGO_URI);
        console.log('- MONGO_URI length:', process.env.MONGO_URI ? process.env.MONGO_URI.length : 0);
        console.log('- MONGO_URI start:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 30) + '...' : 'undefined');
        console.log('- All env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')));
        
        if (!process.env.MONGO_URI) {
            console.error('❌ MONGO_URI environment variable is not set');
            console.error('Available environment variables:', Object.keys(process.env));
            return false;
        }
        
        console.log('✅ MONGO_URI found, attempting connection...');
        console.log('Connection string (first 50 chars):', process.env.MONGO_URI.substring(0, 50) + '...');
        
        // For serverless environments, use optimized settings
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'ATLab-Admin', // Specify the database name
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 15000,
            maxPoolSize: 1, // Reduced for serverless
            minPoolSize: 0, // Reduced for serverless
            retryWrites: true,
            retryReads: true,
            family: 4, // Force IPv4
            bufferCommands: false, // Disable buffering for serverless
        });
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`✅ Database: ${conn.connection.name}`);
        console.log(`✅ Ready State: ${conn.connection.readyState}`);
        return true;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error('Error type:', error.name);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        
        // Log specific error details
        if (error.name === 'MongoServerSelectionError') {
            console.error('🔍 Server selection error - check network connectivity and MongoDB Atlas settings');
        } else if (error.name === 'MongoNetworkError') {
            console.error('🌐 Network error - check firewall and network settings');
        } else if (error.name === 'MongoParseError') {
            console.error('📝 Parse error - check connection string format');
        }
        
        return false;
    }
}