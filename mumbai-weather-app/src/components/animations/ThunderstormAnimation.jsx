import React, { useEffect, useRef, useState } from 'react';
//import cloud1 from '/img/cloudsnew1.png';
//import cloud2 from '/img/cloudsnew2.png';
//import cloud3 from '/img/cloud3bg.png';

const ThunderstormAnimation = () => {
    const bgRainCanvasRef = useRef(null);
    const fgRainCanvasRef = useRef(null); // New Foreground Rain
    const lightningCanvasRef = useRef(null);

    const [flashData, setFlashData] = useState({ opacity: 0, xPos: '50%' });

    // --- 1. REALISTIC FRACTAL LIGHTNING GENERATOR ---
    useEffect(() => {
        const canvas = lightningCanvasRef.current;
        const ctx = canvas.getContext('2d');
        let timeout1, timeout2, timeout3, nextStrikeTimeout;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const drawBolt = (startX, startY) => {
            let x = startX;
            let y = startY;

            ctx.beginPath();
            ctx.moveTo(x, y);

            while (y < canvas.height * 0.8) {
                x += (Math.random() - 0.5) * 60;
                y += Math.random() * 30 + 10;
                ctx.lineTo(x, y);

                if (Math.random() > 0.8) {
                    const branchCtx = canvas.getContext('2d');
                    branchCtx.beginPath();
                    branchCtx.moveTo(x, y);
                    branchCtx.lineTo(x + (Math.random() - 0.5) * 100, y + Math.random() * 80);
                    branchCtx.lineWidth = 1;
                    branchCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    branchCtx.stroke();
                }
            }

            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#8b5cf6';
            ctx.stroke();
        };

        const triggerLightning = () => {
            const strikeX = Math.random() * canvas.width;

            setFlashData({ opacity: 1, xPos: `${(strikeX / canvas.width) * 100}%` });
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBolt(strikeX, 0);

            timeout1 = setTimeout(() => {
                setFlashData((prev) => ({ ...prev, opacity: 0 }));
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }, 50);

            timeout2 = setTimeout(() => {
                setFlashData((prev) => ({ ...prev, opacity: 0.6 }));
                drawBolt(strikeX + (Math.random() * 20 - 10), 0);
            }, 150);

            timeout3 = setTimeout(() => {
                setFlashData((prev) => ({ ...prev, opacity: 0 }));
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }, 250);

            const timeToNextStrike = Math.random() * 6000 + 2000;
            nextStrikeTimeout = setTimeout(triggerLightning, timeToNextStrike);
        };

        nextStrikeTimeout = setTimeout(triggerLightning, 1500);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            clearTimeout(timeout1); clearTimeout(timeout2);
            clearTimeout(timeout3); clearTimeout(nextStrikeTimeout);
        };
    }, []);

    // --- 2. 3D WINDY RAIN CANVASES ---
    useEffect(() => {
        const bgCanvas = bgRainCanvasRef.current;
        const fgCanvas = fgRainCanvasRef.current;
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

        const maxBgDrops = 500;
        const maxFgDrops = 180;
        let bgDrops = [];
        let fgDrops = [];

        // Background Drops (Behind UI)
        for (let i = 0; i < maxBgDrops; i++) {
            bgDrops.push({
                x: Math.random() * bgCanvas.width * 1.5 - bgCanvas.width * 0.2,
                y: Math.random() * bgCanvas.height,
                length: Math.random() * 20 + 10,
                speed: Math.random() * 20 + 10,
                wind: 3 + Math.random() * 2, // Heavy wind to the right
                opacity: Math.random() * 0.3 + 0.1,
                thickness: 1
            });
        }

        // Foreground Drops (In front of UI, very fast, very slanted)
        for (let i = 0; i < maxFgDrops; i++) {
            fgDrops.push({
                x: Math.random() * fgCanvas.width * 1.5 - fgCanvas.width * 0.2,
                y: Math.random() * fgCanvas.height,
                length: Math.random() * 40 + 20,
                speed: Math.random() * 35 + 25,
                wind: 4 + Math.random() * 3, // Stronger wind effect up close
                opacity: Math.random() * 0.2 + 0.05,
                thickness: Math.random() * 2 + 1.2
            });
        }

        const draw = () => {
            // Background rain
            bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            bgCtx.lineCap = 'round';
            for (let i = 0; i < maxBgDrops; i++) {
                const drop = bgDrops[i];
                bgCtx.beginPath();
                bgCtx.strokeStyle = `rgba(165, 180, 200, ${drop.opacity})`;
                bgCtx.lineWidth = drop.thickness;
                bgCtx.moveTo(drop.x, drop.y);
                bgCtx.lineTo(drop.x + drop.wind, drop.y + drop.length);
                bgCtx.stroke();

                drop.y += drop.speed;
                drop.x += drop.wind;
                if (drop.y > bgCanvas.height || drop.x > bgCanvas.width) {
                    drop.y = -20;
                    drop.x = Math.random() * bgCanvas.width * 1.5 - bgCanvas.width * 0.2;
                }
            }

            // Foreground rain
            fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
            fgCtx.lineCap = 'round';
            for (let i = 0; i < maxFgDrops; i++) {
                const drop = fgDrops[i];
                fgCtx.beginPath();
                fgCtx.strokeStyle = `rgba(190, 200, 220, ${drop.opacity})`; // Slightly brighter
                fgCtx.lineWidth = drop.thickness;
                fgCtx.moveTo(drop.x, drop.y);
                fgCtx.lineTo(drop.x + drop.wind, drop.y + drop.length);
                fgCtx.stroke();

                drop.y += drop.speed;
                drop.x += drop.wind;
                if (drop.y > fgCanvas.height || drop.x > fgCanvas.width) {
                    drop.y = -40;
                    drop.x = Math.random() * fgCanvas.width * 1.5 - fgCanvas.width * 0.2;
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
            {/* --- BACKGROUND LAYERS (Behind UI) --- */}
            <div className="fixed inset-0 z-[-6] bg-gradient-to-b from-slate-900 via-slate-800 to-gray-900" />

            {/* Main Sky Glow (Behind clouds) */}
            <div
                className="fixed inset-0 z-[-5] transition-opacity duration-75 pointer-events-none"
                style={{
                    opacity: flashData.opacity,
                    background: `radial-gradient(circle at ${flashData.xPos} 0%, rgba(139, 92, 246, 0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)`,
                    mixBlendMode: 'screen'
                }}
            />

            <canvas ref={lightningCanvasRef} className="fixed inset-0 z-[-4] w-full h-full pointer-events-none" />

            <div className="fixed inset-0 z-[-3] overflow-hidden pointer-events-none">
                <style>
                    {`
            @keyframes storm-cloud {
              0% { transform: translate3d(-120vw, 0, 0); }
              100% { transform: translate3d(120vw, 0, 0); }
            }
            .animate-storm-cloud { position: absolute; animation: storm-cloud linear infinite; }
          `}
                </style>
                {/*<div className="animate-storm-cloud top-[5%] w-[80vw] brightness-[0.3] contrast-150 opacity-80" style={{ animationDuration: '90s', animationDelay: '-10s' }}>
                    <img src={cloud1} alt="storm cloud" className="w-full h-auto" />
                </div>
                <div className="animate-storm-cloud top-[30%] w-[120vw] brightness-[0.2] contrast-150 opacity-95" style={{ animationDuration: '60s', animationDelay: '-40s' }}>
                    <img src={cloud3} alt="storm cloud" className="w-full h-auto" />
                </div>*/}
            </div>

            {/* Background Rain Canvas */}
            <canvas ref={bgRainCanvasRef} className="fixed inset-0 z-[-2] w-full h-full pointer-events-none" />


            {/* --- FOREGROUND LAYERS (In Front of UI, z-[49] and z-[50]) --- */}

            {/* Foreground Lightning Illumination (Makes your glass cards flash slightly) */}
            <div
                className="fixed inset-0 z-[49] transition-opacity duration-75 pointer-events-none"
                style={{
                    opacity: flashData.opacity * 0.15, // Very subtle, 15% strength of the main flash
                    background: 'white',
                    mixBlendMode: 'overlay'
                }}
            />

            {/* Foreground Fast Rain Canvas */}
            <canvas ref={fgRainCanvasRef} className="fixed inset-0 z-[50] w-full h-full pointer-events-none" />
        </>
    );
};

export default ThunderstormAnimation;