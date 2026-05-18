// src/components/WeatherBackground.jsx
import React from 'react';
import { useBackground } from '../contexts/BackgroundContext';
import RainAnimation from './animations/RainAnimation';
import RealisticClouds from './animations/RealisticClouds';
import ThunderstormAnimation from './animations/ThunderstormAnimation';
import SunnyAnimation from './animations/SunnyAnimation'; // <-- Add this import

const WeatherBackground = () => {
    const { currentEffect, effectsEnabled } = useBackground();

    if (!effectsEnabled || currentEffect === 'None') {
        return <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-slate-900 to-[#0f172a]" />;
    }

    switch (currentEffect?.toLowerCase()) {
        case 'rain':
            return <RainAnimation />;

        case 'clouds':
        case 'cloudy':
            return <RealisticClouds />;

        case 'thunderstorm':
        case 'thunder':
        case 'rain & thunder':
            return <ThunderstormAnimation />;

        case 'sunny': // <-- Add the new case!
        case 'clear':
            return <SunnyAnimation />;

        case 'sun & partly cloudy':
            return <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-blue-400 to-blue-600" />;
        case 'rain and cloudy':
            return <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-slate-700 to-slate-900" />;

        default:
            return <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-slate-900 to-[#0f172a]" />;
    }
};

export default WeatherBackground;