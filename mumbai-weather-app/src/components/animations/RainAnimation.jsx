import React, { useEffect, useRef } from 'react';

const RainAnimation = () => {
    const bgCanvasRef = useRef(null);
    const fgCanvasRef = useRef(null);

    useEffect(() => {
        const bgCanvas = bgCanvasRef.current;
        const fgCanvas = fgCanvasRef.current;
        const bgCtx = bgCanvas.getContext('2d');
        const fgCtx = fgCanvas.getContext('2d');
        let animationFrameId;

        const resizeCanvas = () => {
            bgCanvas.width = window.innerWidth;
            bgCanvas.height = window.innerHeight;
            fgCanvas.width = window.innerWidth;
            fgCanvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // 1. Background Drops (Far away: smaller, slower, behind UI)
        const maxBgDrops = 600;
        let bgDrops = [];
        for (let i = 0; i < maxBgDrops; i++) {
            bgDrops.push({
                x: Math.random() * bgCanvas.width,
                y: Math.random() * bgCanvas.height,
                length: Math.random() * 15 + 10,
                speed: Math.random() * 10 + 10,
                wind: Math.random() * 1 - 0.5,
                opacity: Math.random() * 0.3 + 0.1,
                thickness: 1
            });
        }

        // 2. Foreground Drops (Close to camera: longer, faster, in front of UI)
        const maxFgDrops = 150; // Fewer drops so it doesn't distract from text
        let fgDrops = [];
        for (let i = 0; i < maxFgDrops; i++) {
            fgDrops.push({
                x: Math.random() * fgCanvas.width,
                y: Math.random() * fgCanvas.height,
                length: Math.random() * 30 + 20, // Much longer
                speed: Math.random() * 25 + 20,  // Much faster
                wind: Math.random() * 2 - 1,
                opacity: Math.random() * 0.2 + 0.05, // Slightly more transparent due to speed blur
                thickness: Math.random() * 1.5 + 1 // Thicker
            });
        }

        const draw = () => {
            // --- Draw Background ---
            bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

            // Moody sky background only goes on the background canvas
            const gradient = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
            gradient.addColorStop(0, '#1e293b');
            gradient.addColorStop(1, '#0f172a');
            bgCtx.fillStyle = gradient;
            bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

            bgCtx.lineCap = 'round';
            for (let i = 0; i < maxBgDrops; i++) {
                const drop = bgDrops[i];
                bgCtx.beginPath();
                bgCtx.strokeStyle = `rgba(148, 163, 184, ${drop.opacity})`;
                bgCtx.lineWidth = drop.thickness;
                bgCtx.moveTo(drop.x, drop.y);
                bgCtx.lineTo(drop.x + drop.wind, drop.y + drop.length);
                bgCtx.stroke();
                drop.y += drop.speed;
                drop.x += drop.wind;
                if (drop.y > bgCanvas.height) {
                    drop.y = -20;
                    drop.x = Math.random() * bgCanvas.width;
                }
            }

            // --- Draw Foreground ---
            // Clear foreground completely transparent
            fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
            fgCtx.lineCap = 'round';
            for (let i = 0; i < maxFgDrops; i++) {
                const drop = fgDrops[i];
                fgCtx.beginPath();
                // Slightly brighter white/blue for close drops
                fgCtx.strokeStyle = `rgba(200, 215, 235, ${drop.opacity})`;
                fgCtx.lineWidth = drop.thickness;
                fgCtx.moveTo(drop.x, drop.y);
                fgCtx.lineTo(drop.x + drop.wind, drop.y + drop.length);
                fgCtx.stroke();
                drop.y += drop.speed;
                drop.x += drop.wind;
                if (drop.y > fgCanvas.height) {
                    drop.y = -40; // Start higher up
                    drop.x = Math.random() * fgCanvas.width;
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
            {/* Background Layer: Goes behind the App */}
            <canvas ref={bgCanvasRef} className="fixed inset-0 z-[-1] w-full h-full pointer-events-none" />

            {/* Foreground Layer: Goes in FRONT of the App (z-[50]) but lets clicks pass through */}
            <canvas ref={fgCanvasRef} className="fixed inset-0 z-[50] w-full h-full pointer-events-none" />
        </>
    );
};

export default RainAnimation;