// src/contexts/BackgroundContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const BackgroundContext = createContext();

export const useBackground = () => useContext(BackgroundContext);

export const BackgroundProvider = ({ children }) => {
    // Load initial state from localStorage or default
    const initialEffect = localStorage.getItem('backgroundEffect') || 'None';
    const initialEnabled = localStorage.getItem('backgroundEffectsEnabled') === 'true'; // Default to false if not set

    const [currentEffect, setCurrentEffect] = useState(initialEffect); // e.g., 'None', 'Rain', 'Clouds'
    const [effectsEnabled, setEffectsEnabled] = useState(initialEnabled);

    // Save to localStorage whenever settings change
    useEffect(() => {
        localStorage.setItem('backgroundEffect', currentEffect);
    }, [currentEffect]);

    useEffect(() => {
        localStorage.setItem('backgroundEffectsEnabled', effectsEnabled);
    }, [effectsEnabled]);

    const value = {
        currentEffect,
        setCurrentEffect,
        effectsEnabled,
        setEffectsEnabled,
    };

    return <BackgroundContext.Provider value={value}>{children}</BackgroundContext.Provider>;
};