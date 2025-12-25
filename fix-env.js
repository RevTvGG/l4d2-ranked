const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const newDatabaseUrl = "postgresql://neondb_owner:npg_0oDHQOGXZM7U@ep-bold-star-a4kfr07a-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

let envContent = fs.readFileSync(envPath, 'utf8');

// Replace DATABASE_URL
if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(/DATABASE_URL=.+/, `DATABASE_URL="${newDatabaseUrl}"`);
} else {
    envContent += `\nDATABASE_URL="${newDatabaseUrl}"\n`;
}

fs.writeFileSync(envPath, envContent);
console.log('✅ DATABASE_URL updated successfully!');
