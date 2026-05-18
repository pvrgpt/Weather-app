import React, { useState, useEffect } from 'react';
import NightSkyAnimation from './NightSkyAnimation';

const SunnyAnimation = () => {
    const [timePhase, setTimePhase] = useState('day');

    useEffect(() => {
        // Check local time
        const hour = new Date().getHours();

        if (hour >= 6 && hour < 10) {
            setTimePhase('morning');
        } else if (hour >= 10 && hour < 17) {
            setTimePhase('day');
        } else if (hour >= 17 && hour < 19) {
            setTimePhase('evening');
        } else {
            setTimePhase('night');
        }
    }, []);

    // If it's night time, return our highly detailed Night Sky component!
    if (timePhase === 'night') {
        return <NightSkyAnimation />;
    }

    // --- Theme Configurations for Daytime/Sunset ---
    const themes = {
        morning: {
            sky: 'bg-gradient-to-b from-[#4ca1af] via-[#96e6a1] to-[#ffedbc]',
            sunShadow: 'shadow-[0_0_100px_40px_rgba(253,224,71,0.6)]',
            sunColor: 'bg-yellow-100',
            sunPosition: 'top-[20%] right-[10%]'
        },
        day: {
            sky: 'bg-gradient-to-b from-[#2980b9] via-[#6dd5ed] to-[#ffffff]',
            sunShadow: 'shadow-[0_0_120px_60px_rgba(255,255,255,0.8)]',
            sunColor: 'bg-white',
            sunPosition: 'top-[10%] right-[20%]'
        },
        evening: {
            sky: 'bg-gradient-to-b from-[#4A00E0] via-[#8E2DE2] to-[#f5af19]',
            sunShadow: 'shadow-[0_0_100px_50px_rgba(249,115,22,0.8)]',
            sunColor: 'bg-orange-200',
            sunPosition: 'top-[40%] right-[15%]'
        }
    };

    const currentTheme = themes[timePhase];

    return (
        <>
            <style>
                {`
          @keyframes slow-pulse {
            0%, 100% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.05); opacity: 1; }
          }
          .animate-sun {
            animation: slow-pulse 6s ease-in-out infinite;
          }
        `}
            </style>

            {/* Dynamic Sky Background */}
            <div className={`fixed inset-0 z-[-6] transition-colors duration-1000 ${currentTheme.sky}`} />

            {/* The Sun */}
            <div className="fixed inset-0 z-[-4] pointer-events-none overflow-hidden">
                <div
                    className={`absolute rounded-full animate-sun ${currentTheme.sunPosition} ${currentTheme.sunColor} ${currentTheme.sunShadow}`}
                    style={{ width: '120px', height: '120px', filter: 'blur(2px)' }}
                >
                    <div className="w-full h-full rounded-full bg-white opacity-80 blur-md"></div>
                </div>
            </div>
        </>
    );
};

export default SunnyAnimation;