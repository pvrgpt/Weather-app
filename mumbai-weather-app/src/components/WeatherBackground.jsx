import React from 'react';
import { useBackground } from '../contexts/BackgroundContext';
import RainAnimation from './animations/RainAnimation';

const WeatherBackground = () => {
    // Use your custom hook and actual variable names
    const { currentEffect, effectsEnabled } = useBackground();

    // 1. If toggled off or set to None, show a default modern background
    if (!effectsEnabled || currentEffect === 'None') {
        return <div className="fixed inset-0 z-[-1] bg-slate-100" />;
    }

    // 2. Switch based on the current effect
    switch (currentEffect?.toLowerCase()) {
        case 'rain':
            return <RainAnimation />;

        // We will build these next!
        case 'clouds':
        case 'cloudy':
            return <div className="fixed inset-0 z-[-1] bg-gray-300" />; // Placeholder
        case 'sunny':
            return <div className="fixed inset-0 z-[-1] bg-blue-400" />; // Placeholder

        default:
            return <div className="fixed inset-0 z-[-1] bg-slate-100" />;
    }
};

export default WeatherBackground;