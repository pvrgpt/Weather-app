// src/components/ForecastDisplay.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

// Animation for the collapsible section
const contentVariants = {
    hidden: { height: 0, opacity: 0, overflow: 'hidden' },
    visible: { height: 'auto', opacity: 1, transition: { duration: 0.4, ease: "easeInOut" } }
};

const listItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.1, duration: 0.3, ease: "easeOut" }
    })
};

function ForecastDisplay() {
    const [latestForecast, setLatestForecast] = useState(null);
    const [pastForecasts, setPastForecasts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Toggle state for displaying forecasts
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const forecastsRef = collection(db, 'forecasts');
        const q = query(forecastsRef, orderBy('timestamp', 'desc'), limit(5));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const forecastsData = [];
            querySnapshot.forEach((doc) => {
                forecastsData.push({ id: doc.id, ...doc.data() });
            });

            if (forecastsData.length > 0) {
                setLatestForecast(forecastsData[0]);
                setPastForecasts(forecastsData.slice(1));
            } else {
                setLatestForecast(null);
                setPastForecasts([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching forecasts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // iOS Glass Skeleton Loader
    if (loading) {
        return (
            <div className="animate-pulse p-6 md:p-8 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
                <div className="h-8 bg-white/10 rounded-xl w-1/2 mb-6"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-white/10 rounded-md w-full"></div>
                    <div className="h-4 bg-white/10 rounded-md w-5/6"></div>
                    <div className="h-4 bg-white/10 rounded-md w-full"></div>
                </div>
            </div>
        );
    }

    if (!latestForecast) {
        return (
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="p-6 md:p-8 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl text-center text-slate-300"
            >
                No forecasts available at the moment.
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="p-6 md:p-8 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
            {/* Header Area with Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight drop-shadow-md">
                    Parth_GPT Forecasts
                </h2>

                {/* iOS Style Pill Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-center px-6 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/5 border border-white/20 rounded-full text-white text-sm font-medium transition-all duration-300 backdrop-blur-md"
                >
                    {isExpanded ? 'Hide Forecast' : 'View Forecasts'}

                    {/* Tiny arrow icon that flips */}
                    <svg
                        className={`ml-2 w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Collapsible Content Area */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {/* A subtle divider line */}
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent my-6"></div>

                        {/* Latest Forecast Content */}
                        <div className="mb-8">
                            <div className="text-slate-200 leading-relaxed font-light text-lg">
                                <p>{latestForecast.text.split('\n').map((paragraph, index) => <span key={index}>{paragraph}<br /></span>)}</p>
                            </div>

                            {latestForecast.imageUrl && (
                                <div className="mt-6">
                                    <img
                                        src={latestForecast.imageUrl}
                                        alt="Forecast visual"
                                        className="rounded-2xl border border-white/10 shadow-lg max-w-full w-auto mx-auto object-cover"
                                        style={{ maxHeight: '350px' }}
                                    />
                                </div>
                            )}
                            <p className="text-xs text-slate-400 mt-4 uppercase tracking-wider font-medium">
                                Updated: {latestForecast.timestamp?.toDate().toLocaleString(undefined, {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>

                        {/* Past Forecasts Section */}
                        {pastForecasts.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-medium text-slate-300 mb-4 tracking-wide">
                                    Previous Updates
                                </h3>
                                <div className="space-y-3">
                                    {pastForecasts.map((forecast, index) => (
                                        <motion.div
                                            key={forecast.id}
                                            custom={index}
                                            variants={listItemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            // Nested inner glass effect
                                            className="p-5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 rounded-2xl transition-colors duration-300"
                                        >
                                            <p className="text-sm text-slate-300 leading-relaxed font-light">
                                                {forecast.text.split('\n').map((paragraph, index) => <span key={index}>{paragraph}<br /></span>)}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider font-semibold">
                                                {forecast.timestamp?.toDate().toLocaleString(undefined, {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default ForecastDisplay;