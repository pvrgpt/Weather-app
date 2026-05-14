// src/components/ForecastDisplay.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion'; // For animations

// Animation variants for the main card
const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

// Animation variants for list items (past forecasts)
const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" }
    })
};


function ForecastDisplay() {
    const [latestForecast, setLatestForecast] = useState(null);
    const [pastForecasts, setPastForecasts] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        // A more detailed skeleton loader
        return (
            <div className="animate-pulse space-y-4 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-6"></div> {/* Title placeholder */}
                <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                </div>
                <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-lg mt-4"></div> {/* Image placeholder */}
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mt-2"></div> {/* Timestamp placeholder */}
            </div>
        );
    }

    if (!latestForecast) {
        return (
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg text-center text-slate-500 dark:text-slate-400"
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
            // Using a white/slate background for the card, with sky-600 for the title text
            className="p-6 md:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
        >
            <h2 className="text-3xl md:text-4xl font-bold text-sky-600 dark:text-sky-400 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                Latest Forecast
            </h2>

            {/* Latest Forecast Content */}
            <div className="mb-6">
                {/* Using prose for nice default text formatting, can be customized */}
                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                    <p>{latestForecast.text.split('\n').map((paragraph, index) => <span key={index}>{paragraph}<br /></span>)}</p>
                </div>

                {latestForecast.imageUrl && (
                    <div className="mt-6">
                        <img
                            src={latestForecast.imageUrl}
                            alt="Forecast visual"
                            className="rounded-lg shadow-md max-w-full w-auto mx-auto"
                            style={{ maxHeight: '300px' }} // Limit image height
                        />
                    </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-6">
                    Posted: {latestForecast.timestamp?.toDate().toLocaleString()}
                </p>
            </div>

            {pastForecasts.length > 0 && (
                <>
                    <h3 className="text-xl font-semibold text-sky-700 dark:text-sky-500 mt-10 mb-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        Past Forecasts
                    </h3>
                    <div className="space-y-4">
                        {pastForecasts.map((forecast, index) => (
                            <motion.div
                                key={forecast.id}
                                custom={index} // For staggering
                                variants={listItemVariants}
                                // No need for initial/animate here if parent <motion.div> staggers
                                className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                            >
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-normal">
                                    {forecast.text.split('\n').map((paragraph, index) => <span key={index}>{paragraph}<br /></span>)}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                    Posted: {forecast.timestamp?.toDate().toLocaleString()}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}
        </motion.div>
    );
}

export default ForecastDisplay;