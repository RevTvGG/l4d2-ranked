const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupAdmin() {
    console.log('🛡️  Setting up admin user...\n');

    try {
        // Get your Steam ID (Revv)
        const yourSteamId = '76561198113376372';

        // Find your user
        const user = await prisma.user.findUnique({
            where: { steamId: yourSteamId }
        });

        if (!user) {
            console.log('❌ User not found with Steam ID:', yourSteamId);
            console.log('Please login to the website first to create your account.');
            return;
        }

        // Set as admin
        await prisma.user.update({
            where: { id: user.id },
            data: { isAdmin: true }
        });

        console.log('✅ Admin setup complete!');
        console.log(`   User: ${user.name}`);
        console.log(`   Steam ID: ${user.steamId}`);
        console.log(`   Is Admin: true`);
        console.log('\n🎉 You can now access the admin panel at: https://www.l4d2ranked.online/admin');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setupAdmin();
