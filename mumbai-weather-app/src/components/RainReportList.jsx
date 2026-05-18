// src/components/RainReportList.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';

import {
    FiCloudDrizzle,
    FiCloudRain,
    FiCloudLightning,
    FiSun,
    FiMapPin
} from 'react-icons/fi';

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.3 } }
};

const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" } // Sped up slightly for a snappier feel
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

// Upgraded to Translucent Glowing Glass Colors
const getStatusStyle = (rainStatus) => {
    switch (rainStatus) {
        case 'Heavy':
            return {
                icon: <FiCloudLightning className="h-5 w-5 text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />,
                color: "text-red-400",
                bgColor: "bg-red-500/10 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40"
            };
        case 'Moderate':
            return {
                icon: <FiCloudRain className="h-5 w-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />,
                color: "text-amber-400",
                bgColor: "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40"
            };
        case 'Light':
            return {
                icon: <FiCloudDrizzle className="h-5 w-5 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />,
                color: "text-sky-400",
                bgColor: "bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/40"
            };
        case 'None':
            return {
                icon: <FiSun className="h-5 w-5 text-slate-400" />,
                color: "text-slate-300",
                bgColor: "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            };
        default:
            return {
                icon: null,
                color: "text-slate-300",
                bgColor: "bg-white/5 border-white/10 hover:bg-white/10"
            };
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

    // Dark Glass Skeleton Loader
    if (loading) {
        return (
            <div className="p-6 md:p-8 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl animate-pulse">
                <div className="h-8 bg-white/10 rounded-xl w-1/3 mb-6"></div>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                            <div className="flex items-center gap-x-3">
                                <div className="h-6 w-6 bg-white/10 rounded-full"></div>
                                <div className="h-5 bg-white/10 rounded w-3/4"></div>
                            </div>
                            <div className="h-3 bg-white/10 rounded w-1/2 mt-3 ml-9"></div>
                            <div className="h-3 bg-white/10 rounded w-1/3 mt-2 ml-9"></div>
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
            className="p-6 md:p-8 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden"
        >
            {/* Custom Scrollbar CSS for Glass Container */}
            <style>
                {`
                    .glass-scroll::-webkit-scrollbar { width: 6px; }
                    .glass-scroll::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 8px; }
                    .glass-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 8px; }
                    .glass-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.25); }
                `}
            </style>

            <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-white/10">
                <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight drop-shadow-md">
                    Live Community Feed
                </h2>
                <span className="flex items-center text-xs font-medium text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                    <span className="relative flex h-2 w-2 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                    </span>
                    Live
                </span>
            </div>

            {reports.length === 0 ? (
                <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-8">
                    <FiCloudRain className="h-10 w-10 text-slate-400 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-300 font-medium">No rain reports yet.</p>
                    <p className="text-slate-400 text-sm mt-1">Be the first to share an update from your area!</p>
                </div>
            ) : (
                <ul className="space-y-3.5 max-h-[500px] overflow-y-auto glass-scroll pr-2">
                    {reports.map((report, index) => {
                        const statusStyle = getStatusStyle(report.rainStatus);
                        return (
                            <motion.li
                                key={report.id}
                                custom={index}
                                variants={listItemVariants}
                                initial="hidden"
                                animate="visible"
                                className={`p-4.5 px-5 py-4 rounded-2xl border backdrop-blur-md shadow-sm transition-all duration-300 ease-in-out transform ${statusStyle.bgColor}`}
                            >
                                <div className="flex items-start gap-x-3.5">
                                    <div className="flex-shrink-0 mt-0.5 bg-white/5 p-2 rounded-full border border-white/10">
                                        {statusStyle.icon}
                                    </div>
                                    <div className="flex-grow pt-0.5">
                                        <p className="font-semibold text-base text-white tracking-wide">
                                            <span className={statusStyle.color}>{report.rainStatus} </span>
                                            {report.rainStatus === 'None' ? 'Reported' : 'Rain'}
                                            <span className="text-slate-400 font-normal mx-1.5">in</span>
                                            <span className="text-slate-200">{report.area}</span>
                                        </p>

                                        {report.note && (
                                            <div className="mt-2.5 mb-1.5">
                                                <p className="text-sm text-slate-300 italic border-l-2 border-white/20 pl-3 py-0.5">
                                                    "{report.note}"
                                                </p>
                                            </div>
                                        )}

                                        <div className="text-xs text-slate-400 mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                                            <span className="flex items-center text-slate-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                                {formatTimeAgo(report.timestamp)}
                                            </span>

                                            {report.latitude && report.longitude && (
                                                <span className="flex items-center gap-x-1.5 opacity-80">
                                                    <FiMapPin className="h-3 w-3 text-sky-400" />
                                                    ({report.latitude.toFixed(2)}, {report.longitude.toFixed(2)})
                                                </span>
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