// Script to clean up stuck/old matches
// Run with: npx tsx clean-matches.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanMatches() {
    console.log('🧹 Cleaning stuck matches...\n');

    // Find all non-completed matches
    const stuckMatches = await prisma.match.findMany({
        where: {
            status: {
                notIn: ['COMPLETED', 'CANCELLED']
            }
        },
        select: {
            id: true,
            status: true,
            createdAt: true
        }
    });

    console.log(`Found ${stuckMatches.length} stuck matches\n`);

    if (stuckMatches.length === 0) {
        console.log('✅ No stuck matches found!');
        return;
    }

    // Cancel all stuck matches
    const result = await prisma.match.updateMany({
        where: {
            status: {
                notIn: ['COMPLETED', 'CANCELLED']
            }
        },
        data: {
            status: 'CANCELLED',
            cancelReason: 'Auto-cancelled: Cleanup script',
            completedAt: new Date()
        }
    });

    console.log(`✅ Cancelled ${result.count} matches`);

    // Also clean up queue entries
    const queueResult = await prisma.queueEntry.deleteMany({
        where: {
            status: {
                in: ['WAITING', 'MATCHED', 'READY_CHECK']
            }
        }
    });

    console.log(`✅ Cleaned ${queueResult.count} queue entries`);

    console.log('\n✨ Database cleaned!');
}

cleanMatches()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
