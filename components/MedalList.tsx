'use client';

import { MedalBadge } from './MedalBadge';

interface MedalData {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    awardedAt: string;
    note?: string | null;
}

interface MedalListProps {
    medals: MedalData[];
    userId: string;
    isOwner: boolean;
}

export function MedalList({ medals, userId, isOwner }: MedalListProps) {
    const handleRemove = async (medalId: string) => {
        try {
            const res = await fetch(`/api/admin/medals/revoke?userId=${userId}&medalId=${medalId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                window.location.reload();
            } else {
                alert('Failed to revoke medal');
            }
        } catch (error) {
            console.error(error);
            alert('Error revoking medal');
        }
    };

    return (
        <div className="flex flex-wrap gap-4">
            {medals.map((medal) => (
                <MedalBadge
                    key={medal.id}
                    {...medal}
                    onRemove={isOwner ? handleRemove : undefined}
                />
            ))}
        </div>
    );
}
