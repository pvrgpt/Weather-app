import React, { useEffect, useRef, useState } from 'react';

// Helper function to calculate the actual moon phase!
// Returns a value between 0 (New Moon) and 1 (Full Moon cycle)
const getMoonPhase = (date = new Date()) => {
    const lp = 2551443; // Lunar cycle in seconds
    const now = date.getTime() / 1000;
    const newMoon = new Date('2000-01-06T18:14:00Z').getTime() / 1000;
    const phase = ((now - newMoon) % lp) / lp;
    return phase;
};

const NightSkyAnimation = () => {
    const canvasRef = useRef(null);
    const [moonStyle, setMoonStyle] = useState({});

    // 1. Calculate Moon Phase and CSS Shadow
    useEffect(() => {
        const phase = getMoonPhase();

        // Moon Size is 100px. We use an inset shadow to create the dark part of the moon.
        // The background of the shadow perfectly matches the deep midnight sky (#0B1026).
        let shadowX = 0;

        if (phase < 0.5) {
            // Waxing (Right side illuminated, shadow on the left)
            // Phase 0 (New) -> shadow is 100px (fully covers). Phase 0.5 (Full) -> shadow is 0px.
            shadowX = 100 - (phase * 2 * 100);
            setMoonStyle({
                boxShadow: `inset ${shadowX}px 0px 5px 0px #0B1026, 0 0 40px 10px rgba(255, 255, 255, 0.2)`
            });
        } else {
            // Waning (Left side illuminated, shadow on the right)
            // Phase 0.5 (Full) -> shadow is 0px. Phase 1.0 (New) -> shadow is -100px.
            shadowX = -((phase - 0.5) * 2 * 100);
            setMoonStyle({
                boxShadow: `inset ${shadowX}px 0px 5px 0px #0B1026, 0 0 40px 10px rgba(255, 255, 255, 0.2)`
            });
        }
    }, []);

    // 2. Render Twinkling Stars and Shooting Stars on Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Generate Stars
        const maxStars = 250;
        const stars = [];
        for (let i = 0; i < maxStars; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5 + 0.5,
                alpha: Math.random(),
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinkleDir: Math.random() > 0.5 ? 1 : -1
            });
        }

        // Shooting Star Object
        let shootingStar = {
            active: false,
            x: 0, y: 0,
            length: 0, speed: 0, opacity: 0
        };

        const triggerShootingStar = () => {
            shootingStar = {
                active: true,
                x: Math.random() * canvas.width,
                y: Math.random() * (canvas.height / 2), // Start in the top half
                length: Math.random() * 80 + 40,
                speed: Math.random() * 15 + 15,
                opacity: 1
            };

            // Schedule next shooting star (between 4 to 12 seconds)
            setTimeout(triggerShootingStar, Math.random() * 8000 + 4000);
        };

        // Start first shooting star after 3 seconds
        setTimeout(triggerShootingStar, 3000);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Twinkling Stars
            stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
                ctx.fill();

                // Twinkle logic
                star.alpha += star.twinkleSpeed * star.twinkleDir;
                if (star.alpha <= 0.1) {
                    star.twinkleDir = 1;
                } else if (star.alpha >= 1) {
                    star.twinkleDir = -1;
                }
            });

            // Draw Shooting Star
            if (shootingStar.active) {
                ctx.beginPath();
                ctx.moveTo(shootingStar.x, shootingStar.y);
                ctx.lineTo(shootingStar.x - shootingStar.length, shootingStar.y - shootingStar.length); // 45 degree angle

                // Gradient tail
                const gradient = ctx.createLinearGradient(
                    shootingStar.x, shootingStar.y,
                    shootingStar.x - shootingStar.length, shootingStar.y - shootingStar.length
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.opacity})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.lineWidth = 2;
                ctx.strokeStyle = gradient;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Move shooting star
                shootingStar.x -= shootingStar.speed;
                shootingStar.y -= shootingStar.speed; // Moves diagonally down-left
                shootingStar.opacity -= 0.03; // Fade out

                if (shootingStar.opacity <= 0) {
                    shootingStar.active = false;
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <>
            {/* Deep Midnight Blue Sky Gradient */}
            <div className="fixed inset-0 z-[-6] bg-gradient-to-b from-[#0B1026] via-[#1B2744] to-[#2B3B5C]" />

            {/* Star and Shooting Star Canvas */}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 z-[-5] w-full h-full pointer-events-none"
            />

            {/* The Realistic Moon */}
            <div className="fixed inset-0 z-[-4] pointer-events-none overflow-hidden">
                <div
                    className="absolute top-[12%] right-[15%] rounded-full bg-yellow-50"
                    style={{
                        width: '100px',
                        height: '100px',
                        ...moonStyle, // Applies the dynamic phase shadow!
                        transform: 'rotate(-15deg)' // Slight tilt looks more natural
                    }}
                >
                    {/* Subtle moon texture (craters) using radial gradients */}
                    <div className="w-full h-full rounded-full opacity-30" style={{
                        background: 'radial-gradient(circle at 30% 30%, transparent 60%, rgba(0,0,0,0.1) 80%), radial-gradient(circle at 70% 60%, transparent 70%, rgba(0,0,0,0.15) 90%)'
                    }} />
                </div>
            </div>
        </>
    );
};

export default NightSkyAnimation;