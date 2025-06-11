const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Log the connection attempt
    console.log('Attempting to connect to MongoDB Atlas...');
    console.log('Connection URI:', process.env.MONGO_URI ? 'URI is present' : 'URI is missing');

    if (!process.env.MONGO_URI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Atlas Connected Successfully!`);
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);

    // Test the connection with a simple operation
    const testCollection = mongoose.connection.collection('connection_test');
    await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date() 
    });
    console.log('✅ Connection test successful - test document created');
    
    // Clean up test document
    await testCollection.deleteOne({ test: true });
    console.log('✅ Test document cleaned up');

    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    if (error.message.includes('ENOTFOUND')) {
      console.error('Network error: Could not reach MongoDB Atlas. Please check your internet connection.');
    } else if (error.message.includes('Authentication failed')) {
      console.error('Authentication error: Please check your MongoDB Atlas username and password.');
    }
    process.exit(1);
  }
};

module.exports = connectDB; 