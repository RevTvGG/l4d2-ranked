import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simulateMatch() {
    console.log('🎮 Simulando Partida Completa\n');
    console.log('═══════════════════════════════════════\n');

    try {
        // 1. Obtener servidor
        const server = await prisma.gameServer.findUnique({
            where: { serverKey: 'ranked-server-k9cc0n0k4rc' },
        });

        if (!server) {
            console.error('❌ Servidor no encontrado');
            process.exit(1);
        }

        console.log('📡 Servidor encontrado:');
        console.log(`   Nombre: ${server.name}`);
        console.log(`   IP: ${server.ipAddress}:${server.port}`);
        console.log(`   Estado: ${server.status}\n`);

        // 2. Crear usuario de prueba (si no existe)
        console.log('👤 Creando usuario de prueba...');
        const testUser = await prisma.user.upsert({
            where: { steamId: 'STEAM_TEST_12345' },
            update: {},
            create: {
                name: 'Test Player',
                steamId: 'STEAM_TEST_12345',
                rating: 1000,
            },
        });
        console.log(`   ✅ Usuario: ${testUser.name} (ELO: ${testUser.rating})\n`);

        // 3. Simular entrada en cola
        console.log('🎯 Simulando entrada en cola...');
        const queueEntry = await prisma.queueEntry.create({
            data: {
                userId: testUser.id,
                status: 'WAITING',
            },
        });
        console.log(`   ✅ En cola: ${queueEntry.id}\n`);

        // 4. Crear match (simulando que se encontraron 8 jugadores)
        console.log('🔄 Creando match (simulando 8 jugadores encontrados)...');
        const match = await prisma.match.create({
            data: {
                serverId: server.id,
                status: 'READY',
                selectedMap: 'c2m1_highway',
                mapName: 'c2m1_highway',
                queueEntries: {
                    connect: { id: queueEntry.id },
                },
            },
        });
        console.log(`   ✅ Match creado: ${match.id}`);
        console.log(`   Mapa: ${match.selectedMap}\n`);

        // 5. Llamar al API para iniciar el match
        console.log('🚀 Iniciando match en el servidor...');
        const response = await fetch('http://localhost:3000/api/server/start-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId: match.id }),
        });

        const result = await response.json();

        if (result.success) {
            console.log('   ✅ Match iniciado exitosamente!\n');
            console.log('═══════════════════════════════════════');
            console.log('🎉 PARTIDA INICIADA EN EL SERVIDOR');
            console.log('═══════════════════════════════════════\n');
            console.log('📋 Detalles:');
            console.log(`   Match ID: ${result.matchId}`);
            console.log(`   Mapa: ${result.map}`);
            console.log(`   Servidor: ${server.ipAddress}:${server.port}\n`);
            console.log('🎮 Acciones ejecutadas en el servidor:');
            console.log('   ✅ Mensaje en chat: "[Ranked] Match starting..."');
            console.log('   ✅ Mapa cambiado a: c2m1_highway');
            console.log('   ✅ Estado del match: IN_PROGRESS\n');
            console.log('💡 Conecta al servidor para ver el resultado:');
            console.log(`   connect ${server.ipAddress}:${server.port}\n`);
        } else {
            console.log('   ❌ Error al iniciar match:', result.error);
        }

        // 6. Verificar estado final
        console.log('📊 Estado final del match:');
        const updatedMatch = await prisma.match.findUnique({
            where: { id: match.id },
            include: { server: true },
        });
        console.log(`   Estado: ${updatedMatch?.status}`);
        console.log(`   Servidor: ${updatedMatch?.server?.name}\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

simulateMatch();
