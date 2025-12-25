
const fs = require('fs');
const content = `DATABASE_URL=postgresql://neondb_owner:npg_C8my9MhOqjWd@ep-delicate-lab-a5118d53.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=supersecret_dev_key
`;
fs.writeFileSync('.env', content);
console.log('.env file rewritten successfully');
