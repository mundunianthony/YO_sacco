const fs = require('fs');
const path = require('path');

const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/sacco_db

# JWT Configuration
JWT_SECRET=sacco_secret_key_2024
JWT_EXPIRE=30d`;

const envPath = path.join(__dirname, '.env');

try {
  // Check if .env file already exists
  if (fs.existsSync(envPath)) {
    console.log('.env file already exists. Skipping creation.');
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('.env file created successfully!');
  }
  
  // Verify the content
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('\nCurrent .env configuration:');
  console.log(content);
} catch (error) {
  console.error('Error handling .env file:', error);
} 