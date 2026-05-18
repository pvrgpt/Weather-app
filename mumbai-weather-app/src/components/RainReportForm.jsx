import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiSend } from 'react-icons/fi';

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.1 } }
};

// Animation for the collapsible form
const formVariants = {
    hidden: { height: 0, opacity: 0, overflow: 'hidden' },
    visible: { height: 'auto', opacity: 1, transition: { duration: 0.4, ease: "easeInOut" } }
};

async function reverseGeocode(lat, lon) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`
        );
        if (!response.ok) {
            throw new Error(`Nominatim API request failed: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.address) {
            const address = data.address;
            let displayAddress = '';
            if (address.suburb) displayAddress += address.suburb;
            else if (address.neighbourhood) displayAddress += address.neighbourhood;
            else if (address.road) displayAddress += address.road;

            if (address.city_district && displayAddress && !displayAddress.includes(address.city_district)) {
                displayAddress += `, ${address.city_district}`;
            } else if (address.city && displayAddress && !displayAddress.includes(address.city)) {
                if (displayAddress.length < 25) displayAddress += `, ${address.city}`;
            }

            if (displayAddress) return displayAddress;
            if (data.display_name) return data.display_name.split(',').slice(0, 2).join(',');
        }
        return null;
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return null;
    }
}

function RainReportForm() {
    const [area, setArea] = useState('');
    const [rainStatus, setRainStatus] = useState('Light');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [message, setMessage] = useState('');
    const [locationFetchedByGPS, setLocationFetchedByGPS] = useState(false);
    const [gpsCoords, setGpsCoords] = useState(null);

    // NEW: Toggle state for displaying the form
    const [isFormVisible, setIsFormVisible] = useState(false);

    useEffect(() => {
        let timer;
        if (message) {
            timer = setTimeout(() => {
                if (!message.toLowerCase().includes('fetching') && !message.toLowerCase().includes('submitting')) {
                    setMessage('');
                }
            }, 4000);
        }
        return () => clearTimeout(timer);
    }, [message]);

    const handleGetLocationAndGeocode = async () => {
        if (navigator.geolocation) {
            setIsGeocoding(true);
            setMessage('Fetching your location...');
            setLocationFetchedByGPS(false);
            setGpsCoords(null);
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true });
                });
                setGpsCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
                setMessage('Location found. Getting address...');
                const geocodedArea = await reverseGeocode(position.coords.latitude, position.coords.longitude);

                if (geocodedArea) {
                    setArea(geocodedArea);
                    setLocationFetchedByGPS(true);
                    setMessage('Location set! You can adjust it if needed.');
                } else {
                    setArea(`Lat: ${position.coords.latitude.toFixed(3)}, Lon: ${position.coords.longitude.toFixed(3)}`);
                    setLocationFetchedByGPS(true);
                    setMessage('Could not get address. Using coordinates. You can enter area manually.');
                }
            } catch (error) {
                console.warn("Geolocation or Geocoding error:", error);
                setMessage('Could not get location/address. Please enter area manually.');
                setArea('');
                setGpsCoords(null);
            } finally {
                setIsGeocoding(false);
            }
        } else {
            setMessage("Geolocation is not supported by your browser.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!area.trim()) {
            setMessage('Please enter your area or use the "Get My Location" button.');
            return;
        }
        setIsSubmitting(true);
        setMessage('Submitting report...');

        let reportData = {
            area: area.trim(),
            rainStatus,
            note: note.trim(),
            timestamp: serverTimestamp(),
            userId: auth.currentUser ? auth.currentUser.uid : 'unknown_anonymous'
        };

        if (locationFetchedByGPS && gpsCoords) {
            reportData.latitude = gpsCoords.lat;
            reportData.longitude = gpsCoords.lon;
        }

        try {
            await addDoc(collection(db, 'rainReports'), reportData);
            setMessage('Report submitted successfully! Thank you. 🙏');
            setArea('');
            setRainStatus('Light');
            setNote('');
            setLocationFetchedByGPS(false);
            setGpsCoords(null);

            // Optional: Close the form automatically after a successful submission
            setTimeout(() => {
                setIsFormVisible(false);
            }, 2000);

        } catch (error) {
            console.error("Error adding document: ", error);
            setMessage('Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputBaseStyle = "block w-full px-4 py-3 text-sm text-white bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-inner placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 focus:bg-white/10 transition-all duration-300";

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="p-6 md:p-8 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"
        >
            {/* Header Area with Toggle Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight drop-shadow-md">
                    Community Reports
                </h2>

                {/* iOS Style Pill Button to Toggle Form */}
                <button
                    onClick={() => setIsFormVisible(!isFormVisible)}
                    className={`flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 backdrop-blur-md border ${isFormVisible
                            ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                            : 'bg-sky-500/80 hover:bg-sky-500 border-sky-400/50 text-white shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                        }`}
                >
                    {isFormVisible ? 'Cancel' : 'Report Local Weather'}

                    <svg
                        className={`ml-2 w-4 h-4 transition-transform duration-300 ${isFormVisible ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        {isFormVisible
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> // X icon
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /> // Plus icon
                        }
                    </svg>
                </button>
            </div>

            {/* Collapsible Form Area */}
            <AnimatePresence>
                {isFormVisible && (
                    <motion.div
                        variants={formVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent my-6"></div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="area" className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                                    Area / Location
                                </label>
                                <div className="flex shadow-sm rounded-xl">
                                    <input
                                        type="text"
                                        id="area"
                                        value={area}
                                        onChange={(e) => {
                                            setArea(e.target.value);
                                            setLocationFetchedByGPS(false);
                                            setGpsCoords(null);
                                        }}
                                        placeholder="e.g., Dadar West, or click icon"
                                        className={`${inputBaseStyle} rounded-r-none focus:z-10`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGetLocationAndGeocode}
                                        disabled={isGeocoding}
                                        title="Get My Current Location"
                                        className="inline-flex items-center justify-center px-4 py-3 border border-l-0 border-white/10 rounded-r-xl bg-white/5 hover:bg-white/10 text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:z-10 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed backdrop-blur-md"
                                    >
                                        {isGeocoding ? (
                                            <svg className="animate-spin h-5 w-5 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <FiMapPin className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 ml-1">We'll try to get your current area. You can edit it.</p>
                            </div>

                            {/* The New Grid Condition Buttons */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">
                                    Current Condition
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {['None', 'Light', 'Moderate', 'Heavy'].map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setRainStatus(status)}
                                            className={`px-2 py-3 text-sm font-medium rounded-xl transition-all duration-300 backdrop-blur-md ${rainStatus === status
                                                    ? 'bg-sky-500/30 border border-sky-400/60 text-white shadow-[0_0_15px_rgba(14,165,233,0.2)]'
                                                    : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                                                }`}
                                        >
                                            {status === 'None' ? 'No Rain' : status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="note" className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                                    Optional Note <span className="text-xs text-slate-400 font-normal">(e.g., waterlogging, windy)</span>
                                </label>
                                <textarea
                                    id="note"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows="3"
                                    className={`${inputBaseStyle} min-h-[80px] resize-none`}
                                    placeholder="Any additional details?"
                                />
                            </div>

                            {message && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`text-sm text-center py-2.5 px-4 rounded-xl border backdrop-blur-md ${message.includes('successfully') ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200' :
                                            (message.includes('Could not') || message.includes('Failed')) ? 'bg-red-500/20 border-red-500/30 text-red-200' :
                                                'bg-sky-500/20 border-sky-500/30 text-sky-200'
                                        }`}
                                >
                                    {message}
                                </motion.p>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting || isGeocoding}
                                className="w-full flex items-center justify-center gap-x-2 px-6 py-3.5 border border-sky-400/50 rounded-xl shadow-[0_0_15px_rgba(14,165,233,0.3)] text-base font-medium text-white bg-sky-500/80 hover:bg-sky-500 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <FiSend className="h-5 w-5 -ml-1 mr-1" />
                                        Submit Report
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default RainReportForm;