import React, { useEffect, useRef } from 'react';

const RainAnimation = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Set canvas to full window size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Raindrop properties
        const maxDrops = 700; // Adjust for heavier/lighter rain
        let drops = [];

        for (let i = 0; i < maxDrops; i++) {
            drops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                length: Math.random() * 20 + 10, // Length of the drop
                speed: Math.random() * 15 + 10,  // Falling speed
                wind: Math.random() * 2 - 1,     // Slight wind effect (left/right)
                opacity: Math.random() * 0.4 + 0.1 // Random transparency
            });
        }

        const draw = () => {
            // Clear the canvas for the next frame
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Create a moody dark blue/grey gradient background for the rain
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1e293b'); // Tailwind slate-800
            gradient.addColorStop(1, '#0f172a'); // Tailwind slate-900
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.lineCap = 'round';

            // Draw and update each drop
            for (let i = 0; i < maxDrops; i++) {
                const drop = drops[i];

                ctx.beginPath();
                // Slightly blueish-white rain drops
                ctx.strokeStyle = `rgba(148, 163, 184, ${drop.opacity})`;
                ctx.lineWidth = drop.length / 15;

                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x + drop.wind, drop.y + drop.length);
                ctx.stroke();

                // Move the drop down and apply wind
                drop.y += drop.speed;
                drop.x += drop.wind;

                // If the drop falls off the screen, reset it to the top
                if (drop.y > canvas.height) {
                    drop.y = -20;
                    drop.x = Math.random() * canvas.width;
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
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[-1] w-full h-full pointer-events-none"
        />
    );
};

export default RainAnimation;