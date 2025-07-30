const fs = require('fs');
const path = require('path');

// Get the path to the .env file
const envPath = path.join(__dirname, '..', '.env');

console.log('Checking .env file...');
console.log('Expected path:', envPath);

try {
    // Check if file exists
    if (fs.existsSync(envPath)) {
        console.log('✅ .env file exists');
        
        // Read file contents
        const envContents = fs.readFileSync(envPath, 'utf8');
        console.log('\nFile contents:');
        console.log('-------------------');
        console.log(envContents);
        console.log('-------------------');
        
        // Check for required variables
        const hasMongoURI = envContents.includes('MONGO_URI=');
        const hasPort = envContents.includes('PORT=');
        
        console.log('\nRequired variables check:');
        console.log('MONGO_URI present:', hasMongoURI ? '✅' : '❌');
        console.log('PORT present:', hasPort ? '✅' : '❌');
    } else {
        console.log('❌ .env file does not exist at:', envPath);
        console.log('\nPlease create a .env file with the following contents:');
        console.log('-------------------');
        console.log('MONGO_URI=your_mongodb_connection_string_here');
        console.log('PORT=5000');
        console.log('NODE_ENV=development');
        console.log('-------------------');
    }
} catch (error) {
    console.error('Error reading .env file:', error.message);
} 