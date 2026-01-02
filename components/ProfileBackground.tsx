'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface ProfileBackgroundProps {
    isPremium: boolean;
    profileWallpaper?: string | null;
    themeColors: {
        primary: string;
        accent: string;
        dark: string;
        glow: string;
    };
}

export default function ProfileBackground({ isPremium, profileWallpaper, themeColors }: ProfileBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [wallpaperLoaded, setWallpaperLoaded] = useState(false);
    const [wallpaperError, setWallpaperError] = useState(false);

    // Show wallpaper if available
    const showWallpaper = isPremium && profileWallpaper && !wallpaperError;
    // Show animated background if no wallpaper or if wallpaper failed to load
    const showAnimatedBackground = isPremium && !showWallpaper;

    useEffect(() => {
        if (!showAnimatedBackground) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const updateCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        // Generate colors based on theme
        const colors = [
            themeColors.primary,
            themeColors.accent,
            themeColors.dark,
            themeColors.primary + '80', // With opacity
        ];

        // Particle configuration
        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            opacity: number;
            color: string;
        }> = [];

        const particleCount = 40;

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.4 + 0.1,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        let animationFrame: number;

        // Animation loop
        const animate = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle, i) => {
                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Wrap around edges
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                // Draw particle with glow
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.opacity;
                ctx.shadowBlur = 10;
                ctx.shadowColor = particle.color;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Draw connections
                particles.slice(i + 1).forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = themeColors.primary;
                        ctx.globalAlpha = (1 - distance / 120) * 0.15;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });

            ctx.globalAlpha = 1;
            animationFrame = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
            cancelAnimationFrame(animationFrame);
        };
    }, [showAnimatedBackground, themeColors]);

    if (!isPremium) return null;

    return (
        <>
            {/* Custom Wallpaper Layer */}
            {showWallpaper && (
                <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                    <img
                        src={profileWallpaper}
                        alt="Profile background"
                        className={`w-full h-full object-cover transition-opacity duration-500 ${wallpaperLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        loading="lazy"
                        onLoad={() => setWallpaperLoaded(true)}
                        onError={() => {
                            setWallpaperError(true);
                            setWallpaperLoaded(false);
                        }}
                        style={{
                            filter: 'brightness(0.3) blur(1px)',
                        }}
                    />
                    {/* Dark overlay for readability */}
                    <div className="absolute inset-0 bg-black/70" />
                </div>
            )}

            {/* Animated Background (fallback or default) */}
            {showAnimatedBackground && (
                <>
                    {/* Particle Canvas */}
                    <canvas
                        ref={canvasRef}
                        className="fixed inset-0 pointer-events-none opacity-30"
                        style={{ zIndex: 0 }}
                    />
                    {/* Gradient overlays */}
                    <div
                        className="fixed inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse at top, ${themeColors.primary}10, transparent 50%)`,
                            zIndex: 0,
                        }}
                    />
                    <div
                        className="fixed inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse at bottom right, ${themeColors.accent}08, transparent 50%)`,
                            zIndex: 0,
                        }}
                    />
                    {/* Scan line effect */}
                    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                        <div
                            className="absolute left-0 right-0 h-[2px] animate-scan-line"
                            style={{
                                backgroundImage: `linear-gradient(to right, transparent, ${themeColors.primary}40, transparent)`,
                                filter: `drop-shadow(0 0 8px ${themeColors.glow})`
                            }}
                        />
                    </div>
                </>
            )}
        </>
    );
}
