
const fs = require('fs');
const path = require('path');

const envContent = `DATABASE_URL=postgresql://neondb_owner:npg_C8my9MhOqjWd@ep-delicate-lab-a5118d53.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=supersecret_dev_key
`;

const filePath = path.join(__dirname, '.env');

try {
    fs.writeFileSync(filePath, envContent, { encoding: 'utf8' });
    console.log('✅ .env file rewritten successfully (UTF-8)');
    console.log('Preview:', fs.readFileSync(filePath, 'utf8'));
} catch (e) {
    console.error('❌ Failed to write .env:', e);
}
