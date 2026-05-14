// src/components/RainReportList.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';

import {
    FiCloudDrizzle, // Light Rain
    FiCloudRain,   // Moderate Rain
    FiCloudLightning, // Heavy Rain / Storm (or just a more intense rain icon)
    FiSun,          // No Rain / Clear
    FiMapPin        // For location coordinates
} from 'react-icons/fi';
const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.3 } } // Delay after Map
};

// Animation variants for list items
const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" } // Slightly faster stagger
    })
};


function formatTimeAgo(timestamp) {
    if (!timestamp) return 'just now';
    const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) < 5 ? "just now" : Math.floor(seconds) + " seconds ago";
}

// Helper to get icon and color based on rain status
const getStatusStyle = (rainStatus) => {
    switch (rainStatus) {
        case 'Heavy':
            return { icon: <FiCloudLightning className="h-5 w-5 text-red-500 dark:text-red-400" />, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-700/30" };
        case 'Moderate':
            return { icon: <FiCloudRain className="h-5 w-5 text-amber-500 dark:text-amber-400" />, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-700/30" };
        case 'Light':
            return { icon: <FiCloudDrizzle className="h-5 w-5 text-sky-500 dark:text-sky-400" />, color: "text-sky-600 dark:text-sky-400", bgColor: "bg-sky-50 dark:bg-sky-700/30" };
        case 'None':
            return { icon: <FiSun className="h-5 w-5 text-slate-500 dark:text-slate-400" />, color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-100 dark:bg-slate-700/30" };
        default:
            return { icon: null, color: "text-slate-700 dark:text-slate-300", bgColor: "bg-slate-50 dark:bg-slate-700/30" };
    }
};
function RainReportList() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const reportsRef = collection(db, 'rainReports');
        const q = query(reportsRef, orderBy('timestamp', 'desc'), limit(15));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const reportsData = [];
            querySnapshot.forEach((doc) => {
                reportsData.push({ id: doc.id, ...doc.data() });
            });
            setReports(reportsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reports: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        // Skeleton loader for list items
        return (
            <div className="p-6 md:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl animate-pulse">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 bg-slate-100 dark:bg-slate-700 rounded-xl">
                            <div className="flex items-center gap-x-3">
                                <div className="h-6 w-6 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                                <div className="h-5 bg-slate-200 dark:bg-slate-600 rounded w-3/4"></div>
                            </div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2 mt-2 ml-9"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/3 mt-1 ml-9"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="p-6 md:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl"
        >
            <h2 className="text-2xl md:text-3xl font-bold text-sky-600 dark:text-sky-400 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                Live Rain Reports
            </h2>

            {reports.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                    No rain reports yet. Be the first to share an update!
                </p>
            ) : (
                <ul className="space-y-4">
                    {reports.map((report, index) => {
                        const statusStyle = getStatusStyle(report.rainStatus);
                        return (
                            <motion.li
                                key={report.id}
                                custom={index}
                                variants={listItemVariants}
                                initial="hidden" // If not using staggerChildren on parent ul/div
                                animate="visible"
                                className={`p-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 ${statusStyle.bgColor}`}
                            >
                                <div className="flex items-start gap-x-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {statusStyle.icon}
                                    </div>
                                    <div className="flex-grow">
                                        <p className={`font-semibold text-md ${statusStyle.color}`}>
                                            {report.rainStatus} rain
                                            <span className="text-slate-700 dark:text-slate-300 font-normal"> reported in </span>
                                            <span className="font-medium text-slate-800 dark:text-slate-200">{report.area}</span>
                                        </p>
                                        {report.note && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 italic">
                                                &ldquo;{report.note}&rdquo;
                                            </p>
                                        )}
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-x-2">
                                            <span>{formatTimeAgo(report.timestamp)}</span>
                                            {report.latitude && report.longitude && (
                                                <>
                                                    <span>&bull;</span>
                                                    <span className="flex items-center gap-x-1">
                                                        <FiMapPin className="h-3 w-3" />
                                                        ({report.latitude.toFixed(2)}, {report.longitude.toFixed(2)})
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.li>
                        );
                    })}
                </ul>
            )}
        </motion.div>
    );
}

export default RainReportList;