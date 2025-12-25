const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Extract current DATABASE_URL
const match = envContent.match(/DATABASE_URL=(.+)/);
if (match) {
    const currentUrl = match[1].trim();
    console.log('Current DATABASE_URL:', currentUrl.substring(0, 50) + '...');
    console.log('\nPlease provide the FULL DATABASE_URL from Neon dashboard.');
    console.log('It should start with: postgresql://neondb_owner:...');
} else {
    console.log('DATABASE_URL not found in .env');
}
