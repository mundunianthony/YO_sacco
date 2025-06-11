const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const result = dotenv.config({ path: path.join(__dirname, '..', '.env') });

if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
}

const connectDB = require('./config/db');

// Test the connection
const testConnection = async () => {
    console.log('Starting MongoDB Atlas connection test...');
    console.log('Environment check:', {
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: process.env.PORT || 'not set',
        MONGO_URI: process.env.MONGO_URI ? 'present' : 'missing'
    });

    try {
        const connection = await connectDB();
        console.log('✅ Connection test completed successfully');
        console.log('Database connection details:', {
            host: connection.connection.host,
            name: connection.connection.name,
            port: connection.connection.port
        });
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        if (!process.env.MONGO_URI) {
            console.error('Please make sure your .env file contains the MONGO_URI variable');
        }
        process.exit(1);
    }
};

testConnection(); 