// src/components/RainReportForm.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion'; // For animations
import { FiMapPin, FiSend } from 'react-icons/fi';

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.1 } } // Slight delay
};

// --- NEW FUNCTION FOR REVERSE GEOCODING ---
async function reverseGeocode(lat, lon) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`
            // zoom=16 or 18 is usually good for street/suburb level. addressdetails=1 gives more structured info.
        );
        if (!response.ok) {
            throw new Error(`Nominatim API request failed: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.address) {
            // Construct a human-readable address. You can customize this.
            // Example: suburb, city_district or road, suburb
            const address = data.address;
            let displayAddress = '';
            if (address.suburb) displayAddress += address.suburb;
            else if (address.neighbourhood) displayAddress += address.neighbourhood; // Fallback
            else if (address.road) displayAddress += address.road;

            if (address.city_district && displayAddress && !displayAddress.includes(address.city_district)) {
                displayAddress += `, ${address.city_district}`;
            } else if (address.city && displayAddress && !displayAddress.includes(address.city)) {
                // Only add city if it's different from suburb/district and displayAddress isn't already too long
                if (displayAddress.length < 25) displayAddress += `, ${address.city}`;
            }


            if (displayAddress) return displayAddress;
            // Fallback if specific parts aren't found but display_name exists
            if (data.display_name) return data.display_name.split(',').slice(0, 2).join(','); // A more generic part
        }
        return null; // Or some default like "Near your location"
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return null;
    }
}
// --- END OF NEW FUNCTION ---

function RainReportForm() {
    const [area, setArea] = useState('');
    const [rainStatus, setRainStatus] = useState('Light');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false); // --- NEW STATE for geocoding loading
    const [message, setMessage] = useState('');
    const [locationFetchedByGPS, setLocationFetchedByGPS] = useState(false); // To know if area was auto-filled
    const [gpsCoords, setGpsCoords] = useState(null); // To store { lat, lon }

    useEffect(() => {
        let timer;
        if (message) {
            timer = setTimeout(() => {
                // Don't clear active loading messages
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
        } catch (error) {
            console.error("Error adding document: ", error);
            setMessage('Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Common input styling
    const inputBaseStyle = "block w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors duration-150";


    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="p-6 md:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl"
        >
            <h2 className="text-2xl md:text-3xl font-bold text-sky-600 dark:text-sky-400 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                Report Rain
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="area" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Area / Location
                    </label>
                    <div className="mt-1 flex rounded-lg shadow-sm">
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
                            className={`${inputBaseStyle} rounded-r-none focus:z-10`} // focus:z-10 to bring focused input on top of sibling button's border
                            required
                        />
                        <button
                            type="button"
                            onClick={handleGetLocationAndGeocode}
                            disabled={isGeocoding}
                            title="Get My Current Location"
                            className="inline-flex items-center justify-center px-4 py-3 border border-l-0 border-slate-300 dark:border-slate-600 rounded-r-lg bg-slate-50 dark:bg-slate-700 text-sky-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:z-10 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isGeocoding ? (
                                <svg className="animate-spin h-5 w-5 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <FiMapPin className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">We'll try to get your current area. You can edit it.</p>
                </div>

                <div>
                    <label htmlFor="rainStatus" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Rain Status
                    </label>
                    <select
                        id="rainStatus"
                        value={rainStatus}
                        onChange={(e) => setRainStatus(e.target.value)}
                        className={`${inputBaseStyle} appearance-none`} // appearance-none to allow custom arrow
                    // For custom arrow, you might need more complex setup or a background image
                    >
                        <option value="Light">Light Rain</option>
                        <option value="Moderate">Moderate Rain</option>
                        <option value="Heavy">Heavy Rain</option>
                        <option value="None">No Rain</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="note" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Optional Note <span className="text-xs text-slate-400">(e.g., waterlogging, windy)</span>
                    </label>
                    <textarea
                        id="note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows="3"
                        className={`${inputBaseStyle} min-h-[60px]`} // min-h for textarea
                        placeholder="Any additional details?"
                    />
                </div>

                {message && (
                    <p className={`text-sm text-center py-2 px-3 rounded-md ${message.includes('successfully') ? 'bg-emerald-50 dark:bg-emerald-700/30 text-emerald-700 dark:text-emerald-300' :
                        (message.includes('Could not') || message.includes('Failed')) ? 'bg-red-50 dark:bg-red-700/30 text-red-700 dark:text-red-300' :
                            'bg-sky-50 dark:bg-sky-700/30 text-sky-700 dark:text-sky-300' // For info/loading messages
                        }`}>
                        {message}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || isGeocoding}
                    className="w-full flex items-center justify-center gap-x-2 px-6 py-3.5 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 transform active:scale-[0.98]"
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
    );
}

export default RainReportForm;