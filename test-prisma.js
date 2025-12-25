
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

console.log('--- ENV CHECK ---');
console.log('URL Length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 'UNDEFINED');
console.log('URL Preview:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'N/A');

const prisma = new PrismaClient();

async function test() {
    try {
        await prisma.$connect();
        console.log('✅ Prisma connected successfully!');
    } catch (e) {
        console.error('❌ Prisma failed:', e.message.split('\n')[0]);
    }
}

test();
