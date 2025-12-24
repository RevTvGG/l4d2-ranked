import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyNeonIntegration() {
    console.log('🔍 Verificando integración completa con Neon...\n');
    console.log('='.repeat(60) + '\n');

    try {
        // Test 1: Database Connection
        console.log('📍 Test 1: Conexión a base de datos');
        const dbTest = await prisma.$queryRaw`SELECT current_database(), version()`;
        console.log('   ✅ Conectado a Neon PostgreSQL\n');

        // Test 2: User Table
        console.log('📍 Test 2: Tabla de usuarios');
        const userCount = await prisma.user.count();
        console.log(`   ✅ ${userCount} usuarios en la base de datos`);

        if (userCount > 0) {
            const sampleUser = await prisma.user.findFirst({
                select: { name: true, rating: true, wins: true, losses: true }
            });
            console.log(`   📊 Usuario ejemplo: ${sampleUser?.name} (ELO: ${sampleUser?.rating})`);
        }
        console.log('');

        // Test 3: Team Table
        console.log('📍 Test 3: Tabla de equipos');
        const teamCount = await prisma.team.count();
        console.log(`   ✅ ${teamCount} equipos registrados\n`);

        // Test 4: Match Table
        console.log('📍 Test 4: Sistema de matchmaking');
        const matchCount = await prisma.match.count();
        console.log(`   ✅ ${matchCount} partidas en historial`);

        const queueCount = await prisma.queueEntry.count();
        console.log(`   ✅ ${queueCount} jugadores en cola actualmente\n`);

        // Test 5: Chat Messages
        console.log('📍 Test 5: Sistema de chat');
        const messageCount = await prisma.message.count();
        console.log(`   ✅ ${messageCount} mensajes en el chat global`);

        if (messageCount > 0) {
            const recentMessages = await prisma.message.findMany({
                take: 3,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } } }
            });
            console.log('   📝 Mensajes recientes:');
            recentMessages.forEach(msg => {
                console.log(`      - ${msg.user.name}: "${msg.content.substring(0, 50)}..."`);
            });
        }
        console.log('');

        // Test 6: Game Servers
        console.log('📍 Test 6: Servidores de juego');
        const serverCount = await prisma.gameServer.count();
        console.log(`   ✅ ${serverCount} servidores registrados`);

        if (serverCount > 0) {
            const servers = await prisma.gameServer.findMany({
                select: { name: true, ipAddress: true, port: true, isActive: true }
            });
            servers.forEach(srv => {
                const status = srv.isActive ? '🟢 ACTIVO' : '🔴 INACTIVO';
                console.log(`      ${status} - ${srv.name} (${srv.ipAddress}:${srv.port})`);
            });
        }
        console.log('');

        // Test 7: Bans
        console.log('📍 Test 7: Sistema de bans');
        const activeBans = await prisma.ban.count({
            where: {
                expiresAt: { gt: new Date() }
            }
        });
        console.log(`   ✅ ${activeBans} bans activos\n`);

        // Test 8: Leaderboard
        console.log('📍 Test 8: Leaderboard (Top 5)');
        const topPlayers = await prisma.user.findMany({
            take: 5,
            orderBy: { rating: 'desc' },
            select: { name: true, rating: true, wins: true, losses: true }
        });

        if (topPlayers.length > 0) {
            console.log('   🏆 Top jugadores:');
            topPlayers.forEach((player, i) => {
                const winRate = player.wins + player.losses > 0
                    ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(1)
                    : '0.0';
                console.log(`      ${i + 1}. ${player.name} - ${player.rating} ELO (${player.wins}W/${player.losses}L - ${winRate}%)`);
            });
        } else {
            console.log('   ℹ️  No hay jugadores aún');
        }
        console.log('');

        // Summary
        console.log('='.repeat(60));
        console.log('✅ TODAS LAS TABLAS FUNCIONANDO CORRECTAMENTE CON NEON');
        console.log('='.repeat(60));
        console.log('\n📊 Resumen:');
        console.log(`   - Usuarios: ${userCount}`);
        console.log(`   - Equipos: ${teamCount}`);
        console.log(`   - Partidas: ${matchCount}`);
        console.log(`   - Mensajes: ${messageCount}`);
        console.log(`   - Servidores: ${serverCount}`);
        console.log(`   - Bans activos: ${activeBans}`);
        console.log('\n🎉 ¡Neon está funcionando perfectamente!\n');

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.error('\n💡 Posibles causas:');
        console.error('   - Conexión a Neon interrumpida');
        console.error('   - Schema no sincronizado (ejecuta: npx prisma db push)');
        console.error('   - Credenciales incorrectas en .env.local\n');
    } finally {
        await prisma.$disconnect();
    }
}

verifyNeonIntegration();
